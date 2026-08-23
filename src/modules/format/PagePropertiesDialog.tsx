import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import type {
  FontDialogTab,
  FontPropertiesApply,
  PageDialogTab,
  PagePropertiesApply,
  ParagraphDialogTab,
} from '../../core/commandTypes'
import type { PageBackgroundImageApply } from '../../core/pageBackgroundImage'
import {
  emptyPageBackgroundImageApply,
} from '../../core/pageBackgroundImage'
import { emptyPageAtRuleApply, type PageAtRuleApply } from '../../core/pageAtRule'
import type { FontFace } from '../../core/fontFamily'
import {
  emptyParagraphPropertiesApply,
  type ParagraphPropertiesApply,
} from '../../core/paragraphProperties'
import { useT } from '../../i18n/LocaleProvider'
import { FontPropertiesFields } from './FontPropertiesFields'
import { PAGE_DIALOG_TABS } from './pageDialog'
import { ParagraphPropertiesFields } from './ParagraphPropertiesFields'
import { PageAtRuleFields } from './PageAtRuleFields'
import styles from './FontPropertiesDialog.module.css'
import type { CustomImagePicker } from '../../types'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])'

const PAGE_TABS = PAGE_DIALOG_TABS.map((item) => item.id)

function boxToFields(value: ParagraphBoxApply): ParagraphPropertiesApply {
  return {
    ...emptyParagraphPropertiesApply(),
    ...value,
  }
}

function fieldsToBox(value: ParagraphPropertiesApply): ParagraphBoxApply {
  const {
    align: _align,
    alignMixed: _alignMixed,
    list: _list,
    listMixed: _listMixed,
    ...box
  } = value
  return box
}

export type PagePropertiesDialogProps = {
  open: boolean
  tab: PageDialogTab
  value: PagePropertiesApply
  fonts?: readonly FontFace[]
  disabled?: boolean
  /** When false (default), the Print tab is hidden. */
  printTabVisible?: boolean
  customImagePicker?: CustomImagePicker
  onCustomImagePick?: () => void
  onTabChange: (tab: PageDialogTab) => void
  onApply: (draft: PagePropertiesApply) => void
  onResetAtRule?: () => void
  onClose: () => void
}

export function PagePropertiesDialog({
  open,
  tab,
  value,
  fonts,
  disabled,
  printTabVisible = false,
  customImagePicker,
  onCustomImagePick,
  onTabChange,
  onApply,
  onResetAtRule,
  onClose,
}: PagePropertiesDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [fontTab, setFontTab] = useState<FontDialogTab>('general')
  const [paragraphTab, setParagraphTab] = useState<ParagraphDialogTab>('spacing')
  const [fontDraft, setFontDraft] = useState<FontPropertiesApply>(value.font)
  const [boxDraft, setBoxDraft] = useState<ParagraphBoxApply>(value.box)
  const [backgroundImageDraft, setBackgroundImageDraft] = useState<PageBackgroundImageApply>(
    value.backgroundImage,
  )
  const [atRuleDraft, setAtRuleDraft] = useState<PageAtRuleApply>(
    value.atRule ?? emptyPageAtRuleApply(),
  )

  useEffect(() => {
    if (!open) return
    setFontTab('general')
    setParagraphTab('spacing')
    setFontDraft(value.font)
    setBoxDraft(value.box)
    setBackgroundImageDraft(value.backgroundImage ?? emptyPageBackgroundImageApply())
    setAtRuleDraft(value.atRule ?? emptyPageAtRuleApply())
    if (tab === 'print' && !printTabVisible) {
      onTabChange('font')
    }
  }, [open, value, tab, printTabVisible, onTabChange])

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

  const title = t('pageDialogTitle')
  const activeTab = tab === 'print' && !printTabVisible ? 'font' : tab

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
          {title}
        </h2>
        <div className={styles.tabs} role="tablist" aria-label={title}>
          <button
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={activeTab === 'font'}
            onClick={() => onTabChange('font')}
          >
            {t('customStyleDialogTabFont')}
          </button>
          <button
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={activeTab === 'paragraph'}
            onClick={() => onTabChange('paragraph')}
          >
            {t('customStyleDialogTabParagraph')}
          </button>
          {printTabVisible ? (
            <button
              type="button"
              className={styles.tab}
              role="tab"
              aria-selected={activeTab === 'print'}
              onClick={() => onTabChange('print')}
            >
              {t('pageDialogTabPrint')}
            </button>
          ) : null}
        </div>
        {activeTab === 'font' ? (
          <div className={styles.nestedPanel}>
            <FontPropertiesFields
              tab={fontTab}
              value={fontDraft}
              fonts={fonts}
              disabled={disabled}
              onTabChange={setFontTab}
              onChange={setFontDraft}
            />
          </div>
        ) : activeTab === 'paragraph' ? (
          <div className={styles.nestedPanel}>
            <ParagraphPropertiesFields
              tab={paragraphTab}
              value={boxToFields(boxDraft)}
              disabled={disabled}
              tabs={PAGE_TABS}
              tablistLabelKey="pageDialogTitle"
              backgroundImage={backgroundImageDraft}
              customImagePicker={customImagePicker}
              onCustomImagePick={onCustomImagePick}
              onBackgroundImageChange={setBackgroundImageDraft}
              onTabChange={(next) => {
                if (next === 'general') return
                setParagraphTab(next)
              }}
              onChange={(next) => setBoxDraft(fieldsToBox(next))}
            />
          </div>
        ) : (
          <div className={styles.nestedPanel}>
            <PageAtRuleFields
              value={atRuleDraft}
              disabled={disabled}
              onChange={setAtRuleDraft}
              onReset={() => {
                setAtRuleDraft(emptyPageAtRuleApply())
                onResetAtRule?.()
              }}
            />
          </div>
        )}
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
                font: fontDraft,
                box: boxDraft,
                backgroundImage: backgroundImageDraft,
                atRule: printTabVisible ? atRuleDraft : (value.atRule ?? emptyPageAtRuleApply()),
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
