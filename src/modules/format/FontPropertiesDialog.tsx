import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FontDialogTab, FontPropertiesApply } from '../../core/commandTypes'
import type { FontFace } from '../../core/fontFamily'
import type { FontSizeUnit } from '../../core/fontSizeUnits'
import type { FontMarkState } from '../../core/marks'
import { useT } from '../../i18n/LocaleProvider'
import { FontPropertiesFields } from './FontPropertiesFields'
import styles from './FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])'

export type FontPropertiesDialogProps = {
  open: boolean
  tab: FontDialogTab
  size: number | null
  unit: FontSizeUnit
  marks: FontMarkState
  fontFamily?: string | null
  fontFamilyMixed?: boolean
  fontColor: string | null
  fontColorMixed?: boolean
  highlightColor: string | null
  highlightColorMixed?: boolean
  fonts?: readonly FontFace[]
  disabled?: boolean
  onTabChange: (tab: FontDialogTab) => void
  onApply: (draft: FontPropertiesApply) => void
  onClose: () => void
}

export function FontPropertiesDialog({
  open,
  tab,
  size,
  unit,
  marks,
  fontFamily = null,
  fontFamilyMixed = false,
  fontColor,
  fontColorMixed = false,
  highlightColor,
  highlightColorMixed = false,
  fonts,
  disabled,
  onTabChange,
  onApply,
  onClose,
}: FontPropertiesDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<FontPropertiesApply>({
    size,
    unit,
    marks,
    fontFamily,
    fontFamilyMixed,
    fontColor,
    highlightColor,
    fontColorMixed,
    highlightColorMixed,
  })

  useEffect(() => {
    if (!open) return
    setDraft({
      size,
      unit,
      marks,
      fontFamily,
      fontFamilyMixed,
      fontColor,
      highlightColor,
      fontColorMixed,
      highlightColorMixed,
    })
  }, [open, size, unit, marks, fontFamily, fontFamilyMixed, fontColor, fontColorMixed, highlightColor, highlightColorMixed])

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
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={styles.header} id={titleId}>
          {t('fontDialogTitle')}
        </h2>
        <FontPropertiesFields
          tab={tab}
          value={draft}
          fonts={fonts}
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
