import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { extractFontStylesheets } from '../core/fontFamily'
import { PAGE_SURFACE_ATTR, queryPageSurface } from '../core/multiPage'
import { createPageHeightCache, estimatePageRowHeight } from '../core/pageRowHeight'
import {
  absorbLooseBlocksIntoPageShell,
  ensurePageShell,
  ensureSizedPageShellLayout,
  normalizeCaretInPageShell,
  queryPageShell,
  reconcileCaretAfterBlockAbsorb,
  syncPageHolderBackground,
} from '../core/page'
import { syncPageCanvasLayout } from '../core/pageCanvasLayout'
import { normalizePageBackgroundLayerInHolder } from '../core/pageBackgroundImage'
import type { PageMarginSidesPx } from '../core/pageCanvasLayout'
import { hasPrintLayout } from '../core/printLayout'
import { stripPageAtRuleFromHtml } from '../core/pageAtRule'
import type { HydrateEmbeddedImages } from '../core/documentEquality'
import { syncVisualBodyHtml } from '../core/visualBodySync'
import type { RulerUnit } from '../core/rulerUnits'
import { useVirtualPageRange } from '../hooks/useVirtualPageRange'
import { useT } from '../i18n/LocaleProvider'
import { useMultiPageRulerMetrics } from './useMultiPageRulerMetrics'
import { RulerHorizontalHeader, RulerPageRow, buildPageZoomContentStyle } from './RulerVisualFrame'
import styles from './Editor.module.css'

export type MultiPageVisualSurfaceHandle = {
  getContainer: () => HTMLDivElement | null
  getActivePageRoot: () => HTMLElement | null
  getActivePageIndex: () => number
  flushPageHtml: (index: number) => string | null
  ensurePageMounted: (index: number) => void
}

type MultiPageVisualSurfaceProps = {
  pages: readonly string[]
  activePageIndex: number
  hasSelectedPage?: boolean
  scrollRootRef?: RefObject<HTMLElement | null>
  onActivePageIndexChange: (index: number) => void
  onPageSelected?: (index: number) => void
  onPageChange: (index: number, html: string) => void
  onPageFlush?: (index: number, html: string) => void
  suppressPageFlushRef?: RefObject<boolean>
  placeholder?: string
  disabled?: boolean
  rulerVisible?: boolean
  rulerUnit?: RulerUnit
  /** Viewport zoom factor for converting screen pointer deltas to document px during ruler drag. */
  zoomScale?: number
  onMarginChange?: (pageIndex: number, margins: PageMarginSidesPx) => void
  onMarginPreview?: (pageIndex: number, margins: PageMarginSidesPx) => void
  onIndentChange?: (indent: { firstLineIndentPx?: number; leftIndentPx?: number; rightIndentPx?: number }) => void
  onBeforeInput?: (event: InputEvent) => void
  resolveEmbeddedImageDataUrl?: (id: string) => string | null
  hydrateEmbeddedImages?: HydrateEmbeddedImages
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onMouseUp?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void
}

type PageRowGeometry = ReturnType<
  ReturnType<typeof useMultiPageRulerMetrics>['geometryForPage']
>

type MemoizedPageRowProps = {
  index: number
  pageHtml: string
  showVerticalRuler: boolean
  pageSized: boolean
  geometry: PageRowGeometry
  rulerUnit: RulerUnit
  zoomScale: number
  placeholder?: string
  disabled?: boolean
  visualEditorAria: string
  onActivate: (index: number) => void
  onPointerDown: (index: number, event: ReactPointerEvent<HTMLDivElement>) => void
  onPageChange: (index: number, html: string) => void
  onPageFlush?: (index: number, html: string) => void
  suppressPageFlushRef?: RefObject<boolean>
  onMeasured?: (index: number, height: number) => void
  onMarginChange?: (index: number, sides: PageMarginSidesPx) => void
  onMarginPreview?: (index: number, sides: PageMarginSidesPx) => void
  onMouseUp?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onRulerRefresh: () => void
}

const MemoizedPageRow = memo(function MemoizedPageRow({
  index,
  pageHtml,
  showVerticalRuler,
  pageSized,
  geometry,
  rulerUnit,
  zoomScale,
  placeholder,
  disabled,
  visualEditorAria,
  onActivate,
  onPointerDown,
  onPageChange,
  onPageFlush,
  suppressPageFlushRef,
  onMeasured,
  onMarginChange,
  onMarginPreview,
  onMouseUp,
  onContextMenu,
  onRulerRefresh,
}: MemoizedPageRowProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const pageBlockRef = useRef<HTMLDivElement>(null)
  const htmlSnapshotRef = useRef('')
  const dirtyRef = useRef(false)
  const onPageFlushRef = useRef(onPageFlush)
  onPageFlushRef.current = onPageFlush
  const onMeasuredRef = useRef(onMeasured)
  onMeasuredRef.current = onMeasured

  useLayoutEffect(() => {
    const block = pageBlockRef.current
    if (!block || !onMeasuredRef.current) return
    const report = () => onMeasuredRef.current?.(index, block.offsetHeight)
    report()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(report)
    observer.observe(block)
    return () => observer.disconnect()
  }, [index, pageHtml, pageSized, showVerticalRuler])

  const assignSurfaceRef = useCallback((node: HTMLDivElement | null) => {
    surfaceRef.current = node
    if (node) {
      htmlSnapshotRef.current = node.innerHTML
    }
  }, [])

  useLayoutEffect(() => {
    return () => {
      if (suppressPageFlushRef?.current) return
      if (!dirtyRef.current || !onPageFlushRef.current) return
      onPageFlushRef.current(index, htmlSnapshotRef.current)
    }
  }, [index, suppressPageFlushRef])

  return (
    <RulerPageRow
      pageBlockRef={pageBlockRef}
      showVerticalRuler={showVerticalRuler}
      pageSized={pageSized}
      geometry={geometry}
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
    >
      <div
        ref={assignSurfaceRef}
        className={`${styles.surface} ${styles.visual} ${pageSized ? styles.pageSurface : ''}`}
        {...{ [PAGE_SURFACE_ATTR]: '' }}
        data-page-index={index}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={visualEditorAria}
        aria-disabled={disabled || undefined}
        data-placeholder={index === 0 ? placeholder : undefined}
        onFocus={() => onActivate(index)}
        onPointerDown={(event) => onPointerDown(index, event)}
        onMouseUp={onMouseUp}
        onContextMenu={onContextMenu}
        onInput={(event) => {
          const surface = event.currentTarget
          dirtyRef.current = true
          htmlSnapshotRef.current = surface.innerHTML
          const { absorbedBlocks } = absorbLooseBlocksIntoPageShell(surface)
          htmlSnapshotRef.current = surface.innerHTML
          onPageChange(index, surface.innerHTML)
          if (absorbedBlocks.length > 0) {
            const count = absorbedBlocks.length
            requestAnimationFrame(() => reconcileCaretAfterBlockAbsorb(surface, count))
          }
          onRulerRefresh()
        }}
      />
    </RulerPageRow>
  )
}, arePageRowPropsEqual)

function arePageRowPropsEqual(prev: MemoizedPageRowProps, next: MemoizedPageRowProps): boolean {
  return (
    prev.index === next.index &&
    prev.pageHtml === next.pageHtml &&
    prev.showVerticalRuler === next.showVerticalRuler &&
    prev.pageSized === next.pageSized &&
    prev.geometry === next.geometry &&
    prev.rulerUnit === next.rulerUnit &&
    prev.zoomScale === next.zoomScale &&
    prev.placeholder === next.placeholder &&
    prev.disabled === next.disabled &&
    prev.visualEditorAria === next.visualEditorAria
  )
}

export const MultiPageVisualSurface = forwardRef<
  MultiPageVisualSurfaceHandle,
  MultiPageVisualSurfaceProps
>(function MultiPageVisualSurface(
  {
    pages,
    activePageIndex,
    hasSelectedPage = false,
    scrollRootRef,
    onActivePageIndexChange,
    onPageSelected,
    onPageChange,
    onPageFlush,
    suppressPageFlushRef,
    placeholder,
    disabled,
    rulerVisible = true,
    rulerUnit = 'in',
    zoomScale = 1,
    onMarginChange,
    onMarginPreview,
    onIndentChange,
    onBeforeInput,
    resolveEmbeddedImageDataUrl,
    hydrateEmbeddedImages,
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
  const onPageChangeRef = useRef(onPageChange)
  onPageChangeRef.current = onPageChange
  const onPageFlushRef = useRef(onPageFlush)
  onPageFlushRef.current = onPageFlush
  const onPageSelectedRef = useRef(onPageSelected)
  onPageSelectedRef.current = onPageSelected
  const onPointerDownRef = useRef(onPointerDown)
  onPointerDownRef.current = onPointerDown
  const onMarginChangeRef = useRef(onMarginChange)
  onMarginChangeRef.current = onMarginChange
  const onMarginPreviewRef = useRef(onMarginPreview)
  onMarginPreviewRef.current = onMarginPreview
  const prevPagesRef = useRef<readonly string[] | null>(null)
  const prevVisibleIndicesRef = useRef<readonly number[]>([])
  const heightCacheRef = useRef(createPageHeightCache())
  const suppressPageFlushRefProp = suppressPageFlushRef

  const getActiveIndex = useCallback(() => activeIndexRef.current, [])

  const getRowHeight = useCallback(
    (index: number) => heightCacheRef.current.get(index, pages[index] ?? ''),
    [pages],
  )

  const {
    visibleIndices,
    topSpacerHeight,
    bottomSpacerHeight,
    scrollToIndex,
    notifyRowMeasured,
  } = useVirtualPageRange({
    scrollElementRef: scrollRootRef ?? containerRef,
    pageCount: pages.length,
    getRowHeight,
    activePageIndex,
    pinActivePage: hasSelectedPage,
  })

  const { geometryForPage, indentState, refresh: refreshRulerMetrics } = useMultiPageRulerMetrics(
    containerRef,
    pages,
    visibleIndices,
    getActiveIndex,
    true,
    zoomScale,
  )

  const rulerContextIndex = hasSelectedPage ? activePageIndex : 0
  const rulerContextHtml = pages[rulerContextIndex] ?? ''
  const pageHasPrintLayout = useCallback((index: number) => hasPrintLayout(pages[index] ?? ''), [pages])
  const showHorizontalRulers = rulerVisible && hasPrintLayout(rulerContextHtml)

  const scrollToPage = useCallback(
    (index: number) => {
      scrollToIndex(index)
      requestAnimationFrame(() => {
        const container = containerRef.current
        if (!container) return
        const surface = queryPageSurface(container, index)
        if (surface) normalizeCaretInPageShell(surface)
      })
    },
    [scrollToIndex],
  )

  const scrollToIndexRef = useRef(scrollToIndex)
  scrollToIndexRef.current = scrollToIndex

  useLayoutEffect(() => {
    scrollToIndexRef.current(activePageIndex)
  }, [activePageIndex, pages.length])

  const activatePage = useCallback(
    (index: number) => {
      activeIndexRef.current = index
      if (index !== activePageIndex) onActivePageIndexChange(index)
      onPageSelectedRef.current?.(index)
      if (!visibleIndices.includes(index)) {
        scrollToPage(index)
        return
      }
      refreshRulerMetrics()
      const container = containerRef.current
      if (!container) return
      const surface = queryPageSurface(container, index)
      if (surface) {
        requestAnimationFrame(() => normalizeCaretInPageShell(surface))
      }
    },
    [activePageIndex, onActivePageIndexChange, refreshRulerMetrics, scrollToPage, visibleIndices],
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
    ensurePageMounted: (index: number) => {
      scrollToPage(index)
    },
  }))

  const syncSurfaceHtml = useCallback((
    index: number,
    surface: HTMLElement,
    html: string,
    options?: { forceBodySync?: boolean },
  ) => {
    const body = stripPageAtRuleFromHtml(extractFontStylesheets(html).body)
    const isFocused = surface === document.activeElement
    if (options?.forceBodySync || !isFocused) {
      syncVisualBodyHtml(surface, body, {
        resolveDataUrl: resolveEmbeddedImageDataUrl,
        hydrateEmbeddedImages,
      })
    }
    ensurePageShell(surface)
    absorbLooseBlocksIntoPageShell(surface)
    const normalized = normalizePageBackgroundLayerInHolder(surface)
    syncPageHolderBackground(surface)
    syncPageCanvasLayout(surface, html)
    const shell = queryPageShell(surface)
    if (shell) ensureSizedPageShellLayout(surface, shell)
    if (normalized) {
      const storedBody = stripPageAtRuleFromHtml(extractFontStylesheets(html).body)
      if (surface.innerHTML !== storedBody) {
        onPageChangeRef.current(index, surface.innerHTML)
      }
    }
  }, [hydrateEmbeddedImages, resolveEmbeddedImageDataUrl])

  useLayoutEffect(() => {
    heightCacheRef.current.clear()
  }, [pages.length])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const prev = prevPagesRef.current
    const lengthChanged = prev === null || prev.length !== pages.length
    if (lengthChanged) {
      scrollToIndexRef.current(activePageIndex)
    }
    const prevVisible = new Set(prevVisibleIndicesRef.current)
    const indicesToSync = new Set<number>(visibleIndices)
    if (lengthChanged) {
      indicesToSync.add(activePageIndex)
    }
    for (const index of indicesToSync) {
      const newlyVisible = !prevVisible.has(index)
      const pageChanged = pages[index] !== prev?.[index]
      if (!lengthChanged && !newlyVisible && !pageChanged) continue
      const surface = queryPageSurface(container, index)
      if (surface) {
        syncSurfaceHtml(index, surface, pages[index] ?? '', { forceBodySync: lengthChanged })
      }
    }
    prevPagesRef.current = pages
    prevVisibleIndicesRef.current = visibleIndices
    if (lengthChanged && suppressPageFlushRefProp?.current) {
      suppressPageFlushRefProp.current = false
    }
    const frame = requestAnimationFrame(refreshRulerMetrics)
    return () => cancelAnimationFrame(frame)
  }, [activePageIndex, pages, suppressPageFlushRefProp, syncSurfaceHtml, refreshRulerMetrics, visibleIndices])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handler = (event: Event) => {
      onBeforeInputRef.current?.(event as InputEvent)
    }
    container.addEventListener('beforeinput', handler)
    return () => container.removeEventListener('beforeinput', handler)
  }, [])

  const handlePointerDown = useCallback((index: number, event: ReactPointerEvent<HTMLDivElement>) => {
    activatePage(index)
    onPointerDownRef.current?.(event)
  }, [activatePage])

  const handlePageChange = useCallback((index: number, html: string) => {
    onPageChangeRef.current(index, html)
  }, [])

  const handlePageFlush = useCallback((index: number, html: string) => {
    onPageFlushRef.current?.(index, html)
  }, [])

  const handleRowMeasured = useCallback(
    (index: number, height: number) => {
      const estimate = estimatePageRowHeight(pages[index] ?? '', index)
      const stableHeight = Math.max(height, estimate)
      heightCacheRef.current.set(index, stableHeight)
      notifyRowMeasured(index, stableHeight)
    },
    [notifyRowMeasured, pages],
  )

  const handleMarginChange = useCallback((index: number, sides: PageMarginSidesPx) => {
    onMarginChangeRef.current?.(index, sides)
  }, [])

  const handleMarginPreview = useCallback((index: number, sides: PageMarginSidesPx) => {
    onMarginPreviewRef.current?.(index, sides)
  }, [])

  const visualEditorAria = t('visualEditorAria')

  const pageRows = useMemo(
    () =>
      visibleIndices.map((index) => (
        <MemoizedPageRow
          key={index}
          index={index}
          pageHtml={pages[index] ?? ''}
          showVerticalRuler={showHorizontalRulers && pageHasPrintLayout(index)}
          pageSized={pageHasPrintLayout(index)}
          geometry={geometryForPage(index)}
          rulerUnit={rulerUnit}
          zoomScale={zoomScale}
          placeholder={placeholder}
          disabled={disabled}
          visualEditorAria={visualEditorAria}
          onActivate={activatePage}
          onPointerDown={handlePointerDown}
          onPageChange={handlePageChange}
          onPageFlush={handlePageFlush}
          suppressPageFlushRef={suppressPageFlushRefProp}
          onMeasured={handleRowMeasured}
          onMarginChange={handleMarginChange}
          onMarginPreview={handleMarginPreview}
          onMouseUp={onMouseUp}
          onContextMenu={onContextMenu}
          onRulerRefresh={refreshRulerMetrics}
        />
      )),
    [
      activatePage,
      disabled,
      geometryForPage,
      handleMarginChange,
      handleMarginPreview,
      handlePageChange,
      handlePageFlush,
      handlePointerDown,
      handleRowMeasured,
      onContextMenu,
      onMouseUp,
      pageHasPrintLayout,
      pages,
      placeholder,
      refreshRulerMetrics,
      rulerUnit,
      showHorizontalRulers,
      visibleIndices,
      visualEditorAria,
      zoomScale,
    ],
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
          {topSpacerHeight > 0 ? (
            <div aria-hidden style={{ height: topSpacerHeight, flexShrink: 0 }} />
          ) : null}
          {pageRows}
          {bottomSpacerHeight > 0 ? (
            <div aria-hidden style={{ height: bottomSpacerHeight, flexShrink: 0 }} />
          ) : null}
        </div>
      </div>
    </div>
  )
})
