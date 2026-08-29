import { useEffect, useId, useMemo, useRef } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import { writeDocumentHtml } from '../../core/documentStyles'
import { splitPagesFromHtml } from '../../core/multiPage'
import { extractFontStylesheets } from '../../core/fontFamily'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from './DocumentPreviewDialog.module.css'

export type DocumentPreviewDialogProps = {
  open: boolean
  html: string
  onClose: () => void
}

export function formatPreviewHtml(html: string): string {
  const pages = splitPagesFromHtml(html)
  if (pages.length <= 1) return html

  const hrefs: string[] = []
  const bodies: string[] = []
  for (const page of pages) {
    const extracted = extractFontStylesheets(page)
    hrefs.push(...extracted.hrefs)
    bodies.push(extracted.body)
  }

  const pageCards = bodies
    .map((body, index) => {
      const isLast = index === bodies.length - 1
      const breakStyle = isLast
        ? 'display: block; break-inside: avoid; page-break-inside: avoid;'
        : 'display: block; break-after: page; page-break-after: always; break-inside: avoid; page-break-inside: avoid;'
      return `<div class="wysiwyg-preview-page" style="${breakStyle}">${body}</div>`
    })
    .join('')

  return [
    ...Array.from(new Set(hrefs)).map((href) => `<link rel="stylesheet" href="${href}" />`),
    pageCards,
  ]
    .filter(Boolean)
    .join('')
}

export function DocumentPreviewDialog({ open, html, onClose }: DocumentPreviewDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const previewHtml = useMemo(() => formatPreviewHtml(html), [html])

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    escapeIgnoreSelectors: false,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])',
  })

  useEffect(() => {
    if (!open) return
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    writeDocumentHtml(doc, previewHtml, t('previewDialogTitle'))
  }, [open, previewHtml, t])

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
              writeDocumentHtml(doc, previewHtml, t('previewDialogTitle'))
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
