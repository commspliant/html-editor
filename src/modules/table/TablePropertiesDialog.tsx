import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import type { TablePropertiesApply } from '../../core/tableProperties'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from '../format/FontPropertiesDialog.module.css'
import { TablePropertiesFields } from './TablePropertiesFields'

export type TablePropertiesDialogProps = {
  open: boolean
  value: TablePropertiesApply
  disabled?: boolean
  onApply: (draft: TablePropertiesApply) => void
  onClose: () => void
}

export function TablePropertiesDialog({
  open,
  value,
  disabled,
  onApply,
  onClose,
}: TablePropertiesDialogProps) {
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
            {t('tablePropertiesDialogTitle')}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('tablePropertiesDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <TablePropertiesFields value={draft} disabled={disabled} onChange={setDraft} />
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
