import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ImageDialogTab, ImagePropertiesApply } from '../../core/commandTypes'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import styles from '../format/FontPropertiesDialog.module.css'
import { ImagePropertiesFields } from './ImagePropertiesFields'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'

export type ImagePropertiesDialogProps = {
  open: boolean
  tab: ImageDialogTab
  value: ImagePropertiesApply
  aspectRatio?: number
  disabled?: boolean
  onTabChange: (tab: ImageDialogTab) => void
  onApply: (draft: ImagePropertiesApply) => void
  onClose: () => void
}

export function ImagePropertiesDialog({
  open,
  tab,
  value,
  aspectRatio = 1,
  disabled,
  onTabChange,
  onApply,
  onClose,
}: ImagePropertiesDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!open) return
    setDraft(value)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    const focusable = node?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.querySelector('[role="listbox"], [data-color-picker]')) return
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

  return createPortal(
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
            {t('imagePropertiesDialogTitle')}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('imagePropertiesDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <ImagePropertiesFields
          tab={tab}
          value={draft}
          aspectRatio={aspectRatio}
          disabled={disabled}
          onTabChange={onTabChange}
          onChange={setDraft}
        />
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
    </div>,
    document.body,
  )
}
