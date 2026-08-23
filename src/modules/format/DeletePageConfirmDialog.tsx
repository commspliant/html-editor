import { useEffect, useId, useRef } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from './FontPropertiesDialog.module.css'

export type DeletePageConfirmDialogProps = {
  open: boolean
  disabled?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeletePageConfirmDialog({
  open,
  disabled,
  onClose,
  onConfirm,
}: DeletePageConfirmDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = dialog.querySelector<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"])',
    )
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  const locked = Boolean(disabled)

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
              {t('deletePageDialogTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label={t('fontDialogCloseAria')}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.confirmBody}>{t('deletePageConfirmMessage')}</div>
          <div className={styles.actions}>
            <button type="button" className={styles.action} disabled={locked} onClick={onClose}>
              {t('fontDialogCancel')}
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.actionDanger}`}
              disabled={locked}
              onClick={onConfirm}
            >
              {t('commandDeletePage')}
            </button>
          </div>
        </div>
      </div>
    </ChromePortal>
  )
}
