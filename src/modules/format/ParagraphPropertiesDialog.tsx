import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import type { ParagraphDialogTab, ParagraphPropertiesApply } from '../../core/commandTypes'
import {
  emptyPageBackgroundImageApply,
  type PageBackgroundImageApply,
} from '../../core/pageBackgroundImage'
import { useT } from '../../i18n/LocaleProvider'
import type { CustomImagePicker } from '../../types'
import { ParagraphPropertiesFields } from './ParagraphPropertiesFields'
import styles from './FontPropertiesDialog.module.css'

export type ParagraphPropertiesApplyResult = {
  value: ParagraphPropertiesApply
  backgroundImage: PageBackgroundImageApply
}

export type ParagraphPropertiesDialogProps = {
  open: boolean
  tab: ParagraphDialogTab
  value: ParagraphPropertiesApply
  backgroundImage: PageBackgroundImageApply
  disabled?: boolean
  customImagePicker?: CustomImagePicker
  disableBuiltinImageInsert?: boolean
  onCustomImagePick?: () => void
  onTabChange: (tab: ParagraphDialogTab) => void
  onApply: (draft: ParagraphPropertiesApplyResult) => void
  onClose: () => void
}

export function ParagraphPropertiesDialog({
  open,
  tab,
  value,
  backgroundImage,
  disabled,
  customImagePicker,
  disableBuiltinImageInsert,
  onCustomImagePick,
  onTabChange,
  onApply,
  onClose,
}: ParagraphPropertiesDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(value)
  const [backgroundImageDraft, setBackgroundImageDraft] = useState(backgroundImage)

  useEffect(() => {
    if (!open) return
    setDraft(value)
    setBackgroundImageDraft(backgroundImage ?? emptyPageBackgroundImageApply())
  }, [open, value, backgroundImage])

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])',
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
        <h2 className={styles.header} id={titleId}>
          {t('paragraphDialogTitle')}
        </h2>
        <ParagraphPropertiesFields
          tab={tab}
          value={draft}
          disabled={disabled}
          backgroundImage={backgroundImageDraft}
          customImagePicker={customImagePicker}
          disableBuiltinImageInsert={disableBuiltinImageInsert}
          onCustomImagePick={onCustomImagePick}
          onBackgroundImageChange={setBackgroundImageDraft}
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
            onClick={() =>
              onApply({
                value: draft,
                backgroundImage: backgroundImageDraft,
              })
            }
          >
            {t('fontDialogOk')}
          </button>
        </div>
      </div>
    </div>
      </ChromePortal>
    )
}
