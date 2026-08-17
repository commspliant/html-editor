import { useEffect, useId, useRef } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { writeDocumentHtml } from '../../core/documentStyles'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from './DocumentPreviewDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])'

export type DocumentPreviewDialogProps = {
  open: boolean
  html: string
  onClose: () => void
}

export function DocumentPreviewDialog({ open, html, onClose }: DocumentPreviewDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    const focusable = node?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    writeDocumentHtml(doc, html, t('previewDialogTitle'))
  }, [open, html, t])

  if (!open) return null

  return (
      <ChromePortal>

    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <h2 className={styles.header} id={titleId}>
            {t('previewDialogTitle')}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('previewDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>
          <iframe
            ref={frameRef}
            className={styles.frame}
            title={t('previewDialogTitle')}
            sandbox="allow-same-origin"
            tabIndex={-1}
            onLoad={() => {
              const doc = frameRef.current?.contentDocument
              if (!doc) return
              writeDocumentHtml(doc, html, t('previewDialogTitle'))
            }}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={onClose}>
            {t('previewDialogClose')}
          </button>
        </div>
      </div>
    </div>
      </ChromePortal>
    )
}
