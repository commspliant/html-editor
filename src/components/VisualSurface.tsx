import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  absorbLooseBlocksIntoPageShell,
  ensurePageShell,
  ensureSizedPageShellLayout,
  queryPageShell,
  reconcileCaretAfterBlockAbsorb,
  syncPageHolderBackground,
} from '../core/page'
import { syncPageCanvasLayout, type PageMarginSidesPx } from '../core/pageCanvasLayout'
import { normalizePageBackgroundLayerInHolder } from '../core/pageBackgroundImage'
import { hasPrintLayout } from '../core/printLayout'
import { stripPageAtRuleFromHtml } from '../core/pageAtRule'
import type { HydrateEmbeddedImages } from '../core/documentEquality'
import { syncVisualBodyHtml } from '../core/visualBodySync'
import type { RulerUnit } from '../core/rulerUnits'
import { useT } from '../i18n/LocaleProvider'
import { RulerVisualFrame } from './RulerVisualFrame'
import { usePageRulerMetrics } from './usePageRulerMetrics'
import styles from './Editor.module.css'

type VisualSurfaceProps = {
  html: string
  /** Full page HTML including @page rule; used for print layout and ruler metrics. */
  pageHtml?: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  rulerVisible?: boolean
  rulerUnit?: RulerUnit
  /** Viewport zoom factor for converting screen pointer deltas to document px during ruler drag. */
  zoomScale?: number
  onMarginChange?: (sides: PageMarginSidesPx) => void
  onMarginPreview?: (sides: PageMarginSidesPx) => void
  onIndentChange?: (indent: {
    firstLineIndentPx?: number
    leftIndentPx?: number
    rightIndentPx?: number
  }) => void
  onBeforeInput?: (event: InputEvent) => void
  /** Editor sets this to skip the next prop-driven innerHTML sync after a local visual commit. */
  propSyncGuardRef?: MutableRefObject<(() => void) | null>
  resolveEmbeddedImageDataUrl?: (id: string) => string | null
  hydrateEmbeddedImages?: HydrateEmbeddedImages
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onMouseUp?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void
}

export const VisualSurface = forwardRef<HTMLDivElement, VisualSurfaceProps>(
  function VisualSurface(
    {
      html,
      pageHtml,
      onChange,
      placeholder,
      disabled,
      rulerVisible = true,
      rulerUnit = 'in',
      zoomScale = 1,
      onMarginChange,
      onMarginPreview,
      onIndentChange,
      onBeforeInput,
      propSyncGuardRef,
      resolveEmbeddedImageDataUrl,
      hydrateEmbeddedImages,
      onPointerDown,
      onMouseUp,
      onContextMenu,
    },
    ref,
  ) {
    const t = useT()
    const innerRef = useRef<HTMLDivElement | null>(null)
    const skipPropSyncRef = useRef(false)
    const [surfaceEl, setSurfaceEl] = useState<HTMLDivElement | null>(null)
    const onBeforeInputRef = useRef(onBeforeInput)
    onBeforeInputRef.current = onBeforeInput

    const layoutHtml = pageHtml ?? html
    const showRulers = rulerVisible && hasPrintLayout(layoutHtml)

    const { geometry, indentState, refresh } = usePageRulerMetrics(surfaceEl, layoutHtml, showRulers)

    const setRefs = (node: HTMLDivElement | null) => {
      innerRef.current = node
      setSurfaceEl(node)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el) return
      const editableHtml = stripPageAtRuleFromHtml(html)
      const isFocused = el === document.activeElement
      const skipSync = isFocused && skipPropSyncRef.current
      skipPropSyncRef.current = false
      if (!skipSync) {
        syncVisualBodyHtml(el, editableHtml, {
          resolveDataUrl: resolveEmbeddedImageDataUrl,
          hydrateEmbeddedImages,
        })
      }
      if (queryPageShell(el) || hasPrintLayout(layoutHtml)) {
        ensurePageShell(el)
        absorbLooseBlocksIntoPageShell(el)
        normalizePageBackgroundLayerInHolder(el)
        const shell = queryPageShell(el)
        if (shell) ensureSizedPageShellLayout(el, shell)
      }
      syncPageHolderBackground(el)
      syncPageCanvasLayout(el, layoutHtml)
    }, [html, layoutHtml, resolveEmbeddedImageDataUrl, hydrateEmbeddedImages])

    useLayoutEffect(() => {
      if (!propSyncGuardRef) return
      propSyncGuardRef.current = () => {
        skipPropSyncRef.current = true
      }
      return () => {
        propSyncGuardRef.current = null
      }
    }, [propSyncGuardRef])

    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el) return
      const handler = (event: Event) => {
        onBeforeInputRef.current?.(event as InputEvent)
      }
      el.addEventListener('beforeinput', handler)
      return () => el.removeEventListener('beforeinput', handler)
    }, [])

    const surface = (
      <div
        ref={setRefs}
        className={`${styles.surface} ${styles.visual} ${showRulers ? styles.pageSurface : ''}`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={t('visualEditorAria')}
        aria-disabled={disabled || undefined}
        data-placeholder={placeholder}
        onPointerDown={onPointerDown}
        onMouseUp={onMouseUp}
        onContextMenu={onContextMenu}
        onInput={(event) => {
          const surface = event.currentTarget
          skipPropSyncRef.current = true
          if (queryPageShell(surface)) {
            const { absorbedBlocks } = absorbLooseBlocksIntoPageShell(surface)
            onChange(surface.innerHTML)
            if (absorbedBlocks.length > 0) {
              const count = absorbedBlocks.length
              requestAnimationFrame(() => reconcileCaretAfterBlockAbsorb(surface, count))
            }
          } else {
            onChange(surface.innerHTML)
          }
          if (showRulers) refresh()
        }}
      />
    )

    return (
      <RulerVisualFrame
        showRulers={showRulers}
        geometry={geometry}
        indentState={indentState}
        rulerUnit={rulerUnit}
        zoomScale={zoomScale}
        onMarginChange={onMarginChange}
        onMarginPreview={onMarginPreview}
        onIndentChange={onIndentChange}
      >
        {surface}
      </RulerVisualFrame>
    )
  },
)
