import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import type { FontDialogTab, FontPropertiesApply } from '../../core/commandTypes'
import type { FontFace } from '../../core/fontFamily'
import type { FontSizeUnit } from '../../core/fontSizeUnits'
import type { FontMarkState } from '../../core/marks'
import { useT } from '../../i18n/LocaleProvider'
import { FontPropertiesFields } from './FontPropertiesFields'
import styles from './FontPropertiesDialog.module.css'

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

  useDialogFocusTrap(dialogRef, { open, onClose })

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
    </div>
      </ChromePortal>
    )
}
