import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { syncPageHolderBackground } from '../core/page'
import { syncPageCanvasLayout } from '../core/pageCanvasLayout'
import { stripPageAtRuleFromHtml } from '../core/pageAtRule'
import { useT } from '../i18n/LocaleProvider'
import styles from './Editor.module.css'

type VisualSurfaceProps = {
  html: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  onBeforeInput?: (event: InputEvent) => void
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onMouseUp?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void
}

export const VisualSurface = forwardRef<HTMLDivElement, VisualSurfaceProps>(
  function VisualSurface(
    { html, onChange, placeholder, disabled, onBeforeInput, onPointerDown, onMouseUp, onContextMenu },
    ref,
  ) {
    const t = useT()
    const innerRef = useRef<HTMLDivElement | null>(null)
    const onBeforeInputRef = useRef(onBeforeInput)
    onBeforeInputRef.current = onBeforeInput

    const setRefs = (node: HTMLDivElement | null) => {
      innerRef.current = node
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
      if (el.innerHTML !== editableHtml) {
        el.innerHTML = editableHtml
      }
      syncPageHolderBackground(el)
      syncPageCanvasLayout(el, html)
    }, [html])

    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el) return
      const handler = (event: Event) => {
        onBeforeInputRef.current?.(event as InputEvent)
      }
      el.addEventListener('beforeinput', handler)
      return () => el.removeEventListener('beforeinput', handler)
    }, [])

    return (
      <div
        ref={setRefs}
        className={`${styles.surface} ${styles.visual}`}
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
          onChange(event.currentTarget.innerHTML)
        }}
      />
    )
  },
)
