import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from './FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'

export type CustomCssDialogProps = {
  open: boolean
  value: string
  disabled?: boolean
  onApply: (css: string) => void
  onClose: () => void
}

export function CustomCssDialog({
  open,
  value,
  disabled,
  onApply,
  onClose,
}: CustomCssDialogProps) {
  const t = useT()
  const titleId = useId()
  const fieldId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!open) return
    setDraft(value)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    textareaRef.current?.focus()

    const node = dialogRef.current
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

  if (!open) return null

  const submit = () => {
    if (disabled) return
    onApply(draft)
  }

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
              {t('customCssDialogTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label={t('customCssDialogCloseAria')}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={fieldId}>
                {t('customCssDialogField')}
              </label>
              <textarea
                ref={textareaRef}
                id={fieldId}
                className={styles.textarea}
                value={draft}
                disabled={disabled}
                spellCheck={false}
                aria-label={t('customCssDialogFieldAria')}
                rows={8}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={onClose}>
              {t('fontDialogCancel')}
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.actionPrimary}`}
              disabled={disabled}
              onClick={submit}
            >
              {t('fontDialogOk')}
            </button>
          </div>
        </div>
      </div>
    </ChromePortal>
  )
}
