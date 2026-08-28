import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { extractFontStylesheets } from '../core/fontFamily'
import { PAGE_SURFACE_ATTR, queryPageSurface } from '../core/multiPage'
import {
  absorbLooseBlocksIntoPageShell,
  ensurePageShell,
  ensureSizedPageShellLayout,
  normalizeCaretInPageShell,
  queryPageShell,
  syncPageHolderBackground,
} from '../core/page'
import { syncPageCanvasLayout } from '../core/pageCanvasLayout'
import { hasPrintLayout } from '../core/printLayout'
import { stripPageAtRuleFromHtml } from '../core/pageAtRule'
import type { PageGeometry } from '../modules/ruler'
import { queryParagraphIndent, type ParagraphIndentState } from '../core/paragraphIndent'
import type { RulerUnit } from '../core/rulerUnits'
import { useT } from '../i18n/LocaleProvider'
import { measurePageGeometry } from './measurePageGeometry'
import { RulerHorizontalHeader, RulerPageRow, buildPageZoomContentStyle } from './RulerVisualFrame'
import styles from './Editor.module.css'

export type MultiPageVisualSurfaceHandle = {
  getContainer: () => HTMLDivElement | null
  getActivePageRoot: () => HTMLElement | null
  getActivePageIndex: () => number
  flushPageHtml: (index: number) => string | null
}

type MultiPageVisualSurfaceProps = {
  pages: readonly string[]
  activePageIndex: number
  hasSelectedPage?: boolean
  onActivePageIndexChange: (index: number) => void
  onPageSelected?: (index: number) => void
  onPageChange: (index: number, html: string) => void
  placeholder?: string
  disabled?: boolean
  rulerVisible?: boolean
  rulerUnit?: RulerUnit
  /** Viewport zoom factor for converting screen pointer deltas to document px during ruler drag. */
  zoomScale?: number
  onMarginChange?: (pageIndex: number, margins: { top?: number; right?: number; bottom?: number; left?: number }) => void
  onMarginPreview?: (pageIndex: number, margins: { top?: number; right?: number; bottom?: number; left?: number }) => void
  onIndentChange?: (indent: { firstLineIndentPx?: number; leftIndentPx?: number; rightIndentPx?: number }) => void
  onBeforeInput?: (event: InputEvent) => void
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onMouseUp?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void
}

export const MultiPageVisualSurface = forwardRef<
  MultiPageVisualSurfaceHandle,
  MultiPageVisualSurfaceProps
>(function MultiPageVisualSurface(
  {
    pages,
    activePageIndex,
    hasSelectedPage = false,
    onActivePageIndexChange,
    onPageSelected,
    onPageChange,
    placeholder,
    disabled,
    rulerVisible = true,
    rulerUnit = 'in',
    zoomScale = 1,
    onMarginChange,
    onMarginPreview,
    onIndentChange,
    onBeforeInput,
    onPointerDown,
    onMouseUp,
    onContextMenu,
  },
  ref,
) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(activePageIndex)
  activeIndexRef.current = activePageIndex
  const onBeforeInputRef = useRef(onBeforeInput)
  onBeforeInputRef.current = onBeforeInput
  const pageHtmlRef = useRef(pages)
  pageHtmlRef.current = pages
  const onPageSelectedRef = useRef(onPageSelected)
  onPageSelectedRef.current = onPageSelected

  const [pageGeometries, setPageGeometries] = useState<Record<number, PageGeometry>>({})
  const geometryForPage = (index: number): PageGeometry | null => pageGeometries[index] ?? pageGeometries[0] ?? null

  const rulerContextIndex = hasSelectedPage ? activePageIndex : 0
  const rulerContextHtml = pages[rulerContextIndex] ?? ''
  const pageHasPrintLayout = (index: number) => hasPrintLayout(pages[index] ?? '')
  const showHorizontalRulers = rulerVisible && hasPrintLayout(rulerContextHtml)

  const [indentState, setIndentState] = useState<ParagraphIndentState>({
    firstLineIndentPx: 0,
    leftIndentPx: 0,
    rightIndentPx: 0,
    mixed: false,
  })

  const updateActivePageMetrics = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const measured: Record<number, PageGeometry> = {}

    for (let index = 0; index < pageHtmlRef.current.length; index += 1) {
      const surface = queryPageSurface(container, index)
      if (!surface) continue
      const pageHtml = pageHtmlRef.current[index] ?? pageHtmlRef.current[0] ?? ''
      measured[index] = measurePageGeometry(surface, pageHtml)
    }

    setPageGeometries((previous) => {
      const keys = Object.keys(measured)
      const unchanged = Object.keys(previous).length === keys.length && keys.every((key) => {
        const before = previous[Number(key)]
        const after = measured[Number(key)]
        return before?.pageWidthPx === after.pageWidthPx &&
          before?.pageHeightPx === after.pageHeightPx &&
          before?.marginsPx.top === after.marginsPx.top &&
          before?.marginsPx.right === after.marginsPx.right &&
          before?.marginsPx.bottom === after.marginsPx.bottom &&
          before?.marginsPx.left === after.marginsPx.left
      })
      return unchanged ? previous : measured
    })

    const activeSurface = queryPageSurface(container, activeIndexRef.current)
    if (activeSurface) setIndentState(queryParagraphIndent(activeSurface))
  }, [])

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(updateActivePageMetrics)
    return () => cancelAnimationFrame(frame)
  }, [activePageIndex, pages, zoomScale, updateActivePageMetrics])

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => updateActivePageMetrics())
    for (let index = 0; index < pages.length; index += 1) {
      const surface = queryPageSurface(container, index)
      if (surface) observer.observe(surface)
    }
    return () => observer.disconnect()
  }, [pages.length, updateActivePageMetrics])

  useLayoutEffect(() => {
    const handleSelection = () => {
      const container = containerRef.current
      if (!container) return
      const surface = queryPageSurface(container, activeIndexRef.current)
      if (surface) {
        setIndentState(queryParagraphIndent(surface))
      }
    }
    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [])

  const activatePage = useCallback(
    (index: number) => {
      activeIndexRef.current = index
      if (index !== activePageIndex) onActivePageIndexChange(index)
      onPageSelectedRef.current?.(index)
      updateActivePageMetrics()
      const container = containerRef.current
      if (!container) return
      const surface = queryPageSurface(container, index)
      if (surface) {
        requestAnimationFrame(() => normalizeCaretInPageShell(surface))
      }
    },
    [activePageIndex, onActivePageIndexChange, updateActivePageMetrics],
  )

  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getActivePageRoot: () => {
      const container = containerRef.current
      if (!container) return null
      return queryPageSurface(container, activeIndexRef.current)
    },
    getActivePageIndex: () => activeIndexRef.current,
    flushPageHtml: (index: number) => {
      const container = containerRef.current
      if (!container) return null
      return queryPageSurface(container, index)?.innerHTML ?? null
    },
  }))

  const syncSurfaceHtml = useCallback((surface: HTMLElement, html: string) => {
    const body = stripPageAtRuleFromHtml(extractFontStylesheets(html).body)
    const isFocused = surface === document.activeElement
    if (!isFocused && surface.innerHTML !== body) {
      surface.innerHTML = body
    }
    ensurePageShell(surface)
    absorbLooseBlocksIntoPageShell(surface)
    syncPageHolderBackground(surface)
    syncPageCanvasLayout(surface, html)
    const shell = queryPageShell(surface)
    if (shell) ensureSizedPageShellLayout(surface, shell)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    for (let index = 0; index < pages.length; index += 1) {
      const surface = queryPageSurface(container, index)
      if (surface) syncSurfaceHtml(surface, pages[index] ?? '')
    }
    const frame = requestAnimationFrame(updateActivePageMetrics)
    return () => cancelAnimationFrame(frame)
  }, [pages, syncSurfaceHtml, updateActivePageMetrics])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handler = (event: Event) => {
      const inputEvent = event as InputEvent
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.hasAttribute(PAGE_SURFACE_ATTR) &&
        (inputEvent.inputType === 'insertParagraph' || inputEvent.inputType === 'insertLineBreak')
      ) {
        normalizeCaretInPageShell(target)
      }
      onBeforeInputRef.current?.(inputEvent)
    }
    container.addEventListener('beforeinput', handler)
    return () => container.removeEventListener('beforeinput', handler)
  }, [])

  const handlePointerDown = useCallback(
    (index: number, event: ReactPointerEvent<HTMLDivElement>) => {
      activatePage(index)
      onPointerDown?.(event)
    },
    [activatePage, onPointerDown],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: showHorizontalRulers ? 'center' : 'stretch',
        width: '100%',
        height: '100%',
        minHeight: '100%',
        position: 'relative',
      }}
    >
      <RulerHorizontalHeader
        showRulers={showHorizontalRulers}
        geometry={geometryForPage(rulerContextIndex)}
        indentState={indentState}
        rulerUnit={rulerUnit}
        zoomScale={zoomScale}
        onMarginChange={(sides) => {
          onMarginChange?.(rulerContextIndex, sides)
        }}
        onMarginPreview={(sides) => {
          onMarginPreview?.(rulerContextIndex, sides)
        }}
        onIndentChange={(indents) => {
          onIndentChange?.(indents)
        }}
      />

      <div
        className={styles.pageZoomContent}
        style={buildPageZoomContentStyle(zoomScale)}
      >
        <div
          ref={containerRef}
          className={styles.multiPageContainer}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: showHorizontalRulers ? 'center' : 'stretch',
            width: '100%',
            minHeight: showHorizontalRulers ? undefined : '100%',
            position: 'relative',
          }}
        >
          {pages.map((_pageHtml, index) => (
            <RulerPageRow
              key={index}
              showVerticalRuler={showHorizontalRulers && pageHasPrintLayout(index)}
              pageSized={pageHasPrintLayout(index)}
              geometry={geometryForPage(index)}
              indentState={indentState}
              rulerUnit={rulerUnit}
              zoomScale={zoomScale}
              pageBlockStyle={{
                marginTop: index > 0 ? '1.5rem' : '0',
              }}
              onMarginChange={(sides) => {
                onMarginChange?.(index, sides)
              }}
              onMarginPreview={(sides) => {
                onMarginPreview?.(index, sides)
              }}
              onIndentChange={onIndentChange}
            >
              <div
                className={`${styles.surface} ${styles.visual} ${pageHasPrintLayout(index) ? styles.pageSurface : ''}`}
                {...{ [PAGE_SURFACE_ATTR]: '' }}
                data-page-index={index}
                contentEditable={!disabled}
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label={t('visualEditorAria')}
                aria-disabled={disabled || undefined}
                data-placeholder={index === 0 ? placeholder : undefined}
                onFocus={() => activatePage(index)}
                onPointerDown={(event) => handlePointerDown(index, event)}
                onMouseUp={onMouseUp}
                onContextMenu={onContextMenu}
                onInput={(event) => {
                  const surface = event.currentTarget
                  const absorbed = absorbLooseBlocksIntoPageShell(surface)
                  if (absorbed) normalizeCaretInPageShell(surface)
                  onPageChange(index, surface.innerHTML)
                  updateActivePageMetrics()
                }}
              />
            </RulerPageRow>
          ))}
        </div>
      </div>
    </div>
  )
})
