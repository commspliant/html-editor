import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import type { ParagraphDialogTab, ParagraphPropertiesApply } from '../../core/commandTypes'
import {
  emptyPageBackgroundImageApply,
  type PageBackgroundImageApply,
} from '../../core/pageBackgroundImage'
import { useT } from '../../i18n/LocaleProvider'
import type { CustomImagePicker } from '../../types'
import { ParagraphPropertiesFields } from './ParagraphPropertiesFields'
import styles from './FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])'

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
