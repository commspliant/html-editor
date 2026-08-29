import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import type { RowPropertiesApply } from '../../core/rowProperties'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from '../format/FontPropertiesDialog.module.css'
import { RowPropertiesFields } from './RowPropertiesFields'

export type RowPropertiesDialogProps = {
  open: boolean
  value: RowPropertiesApply
  disabled?: boolean
  onApply: (draft: RowPropertiesApply) => void
  onClose: () => void
}

export function RowPropertiesDialog({
  open,
  value,
  disabled,
  onApply,
  onClose,
}: RowPropertiesDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!open) return
    setDraft(value)
  }, [open, value])

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
  })

  if (!open) return null

  return (
      <ChromePortal>

    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles.dialogWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <h2 className={styles.header} id={titleId}>
            {t('rowPropertiesDialogTitle')}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('rowPropertiesDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <RowPropertiesFields value={draft} disabled={disabled} onChange={setDraft} />
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={onClose}>
            {t('fontDialogCancel')}
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.actionPrimary}`}
            disabled={disabled}
            onClick={() => onApply(draft)}
          >
            {t('fontDialogOk')}
          </button>
        </div>
      </div>
    </div>
      </ChromePortal>
    )
}
