import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
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
import { stripPageAtRuleFromHtml } from '../core/pageAtRule'
import { useT } from '../i18n/LocaleProvider'
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
  onActivePageIndexChange: (index: number) => void
  onPageChange: (index: number, html: string) => void
  placeholder?: string
  disabled?: boolean
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
    onActivePageIndexChange,
    onPageChange,
    placeholder,
    disabled,
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
  }, [pages, syncSurfaceHtml])

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

  const handleFocus = (index: number) => {
    activeIndexRef.current = index
    if (index !== activePageIndex) onActivePageIndexChange(index)
    const container = containerRef.current
    if (!container) return
    const surface = queryPageSurface(container, index)
    if (surface) {
      requestAnimationFrame(() => normalizeCaretInPageShell(surface))
    }
  }

  return (
    <div ref={containerRef} className={styles.multiPageContainer}>
      {pages.map((_pageHtml, index) => (
        <div key={index} className={styles.pageBlock}>
          {index > 0 ? <div className={styles.pageGap} aria-hidden="true" /> : null}
          <div
            className={`${styles.surface} ${styles.visual} ${styles.pageSurface}`}
            {...{ [PAGE_SURFACE_ATTR]: '' }}
            data-page-index={index}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={t('visualEditorAria')}
            aria-disabled={disabled || undefined}
            data-placeholder={index === 0 ? placeholder : undefined}
            onFocus={() => handleFocus(index)}
            onPointerDown={onPointerDown}
            onMouseUp={onMouseUp}
            onContextMenu={onContextMenu}
            onInput={(event) => {
              const surface = event.currentTarget
              const absorbed = absorbLooseBlocksIntoPageShell(surface)
              if (absorbed) normalizeCaretInPageShell(surface)
              onPageChange(index, surface.innerHTML)
            }}
          />
        </div>
      ))}
    </div>
  )
})
