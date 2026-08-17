import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import type { FontDialogTab, FontPropertiesApply, ParagraphDialogTab, ParagraphPropertiesApply } from '../../core/commandTypes'
import { paragraphApplyToStyle, styleToParagraphApply } from '../../core/paragraphProperties'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { CustomParagraphStyle, CustomParagraphStyleFont, CustomParagraphStyleParagraph } from '../../types'
import type { FontFace } from '../../core/fontFamily'
import { FontPropertiesFields } from './FontPropertiesFields'
import { ParagraphPropertiesFields } from './ParagraphPropertiesFields'
import styles from './FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])'

export type CustomParagraphStyleDialogTab = 'font' | 'paragraph'

export type CustomParagraphStyleDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  styleId?: string
  name?: string
  font: CustomParagraphStyleFont
  paragraph?: CustomParagraphStyleParagraph
  canDelete?: boolean
  busy?: boolean
  disabled?: boolean
  fonts?: readonly FontFace[]
  defaultOuterTab?: CustomParagraphStyleDialogTab
  onSave: (style: CustomParagraphStyle) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
  onClose: () => void
}

function createStyleId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `style-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

function fontToDraft(font: CustomParagraphStyleFont): FontPropertiesApply {
  return {
    size: font.size,
    unit: font.unit,
    marks: font.marks,
    fontFamily: font.fontFamily ?? null,
    fontFamilyMixed: false,
    fontColor: font.fontColor,
    highlightColor: font.highlightColor,
    fontColorMixed: false,
    highlightColorMixed: false,
  }
}

function draftToFont(draft: FontPropertiesApply): CustomParagraphStyleFont {
  return {
    size: draft.size,
    unit: draft.unit,
    marks: draft.marks,
    fontFamily: draft.fontFamilyMixed ? null : draft.fontFamily,
    fontColor: draft.fontColorMixed ? null : draft.fontColor,
    highlightColor: draft.highlightColorMixed ? null : draft.highlightColor,
  }
}

export function CustomParagraphStyleDialog({
  open,
  mode,
  styleId,
  name = '',
  font,
  paragraph,
  canDelete = false,
  busy,
  disabled,
  fonts,
  defaultOuterTab = 'font',
  onSave,
  onDelete,
  onClose,
}: CustomParagraphStyleDialogProps) {
  const t = useT()
  const titleId = useId()
  const nameId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draftName, setDraftName] = useState(name)
  const [outerTab, setOuterTab] = useState<CustomParagraphStyleDialogTab>(defaultOuterTab)
  const [fontTab, setFontTab] = useState<FontDialogTab>('general')
  const [paragraphTab, setParagraphTab] = useState<ParagraphDialogTab>('general')
  const [draft, setDraft] = useState<FontPropertiesApply>(() => fontToDraft(font))
  const [paragraphDraft, setParagraphDraft] = useState<ParagraphPropertiesApply>(() =>
    styleToParagraphApply(paragraph),
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraftName(name)
    setOuterTab(defaultOuterTab)
    setFontTab('general')
    setParagraphTab('general')
    setDraft(fontToDraft(font))
    setParagraphDraft(styleToParagraphApply(paragraph))
    setConfirmingDelete(false)
  }, [open, name, font, paragraph, defaultOuterTab])

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
        if (confirmingDelete) {
          setConfirmingDelete(false)
          return
        }
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
  }, [open, onClose, confirmingDelete])

  if (!open) return null

  const title = mode === 'create' ? t('customStyleDialogAddTitle') : t('customStyleDialogEditTitle')
  const canSave = draftName.trim().length > 0
  const locked = Boolean(disabled || busy)

  const submit = () => {
    const trimmed = draftName.trim()
    if (!trimmed) return
    void onSave({
      id: styleId ?? createStyleId(),
      name: trimmed,
      font: draftToFont(draft),
      paragraph: paragraphApplyToStyle(paragraphDraft),
    })
  }

  return (
      <ChromePortal>

    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles.dialogWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <h2 className={styles.header} id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('customStyleDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        {confirmingDelete ? (
          <>
            <div className={styles.confirmBody}>{t('customStyleDialogDeleteConfirm')}</div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.action}
                disabled={locked}
                onClick={() => setConfirmingDelete(false)}
              >
                {t('fontDialogCancel')}
              </button>
              <button
                type="button"
                className={`${styles.action} ${styles.actionDanger}`}
                disabled={locked || !styleId}
                onClick={() => {
                  if (!styleId) return
                  void onDelete?.(styleId)
                }}
              >
                {t('customStyleDialogDelete')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.nameSection}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={nameId}>
                  {t('customStyleDialogName')}
                </label>
                <input
                  id={nameId}
                  className={styles.nameInput}
                  value={draftName}
                  disabled={locked}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </div>
            </div>
            <div className={styles.tabs} role="tablist" aria-label={title}>
              <button
                type="button"
                className={styles.tab}
                role="tab"
                aria-selected={outerTab === 'font'}
                onClick={() => setOuterTab('font')}
              >
                {t('customStyleDialogTabFont')}
              </button>
              <button
                type="button"
                className={styles.tab}
                role="tab"
                aria-selected={outerTab === 'paragraph'}
                onClick={() => setOuterTab('paragraph')}
              >
                {t('customStyleDialogTabParagraph')}
              </button>
            </div>
            {outerTab === 'font' ? (
              <div className={styles.nestedPanel}>
                <FontPropertiesFields
                  tab={fontTab}
                  value={draft}
                  fonts={fonts}
                  disabled={locked}
                  onTabChange={setFontTab}
                  onChange={setDraft}
                />
              </div>
            ) : (
              <div className={styles.nestedPanel}>
                <ParagraphPropertiesFields
                  tab={paragraphTab}
                  value={paragraphDraft}
                  disabled={locked}
                  onTabChange={setParagraphTab}
                  onChange={setParagraphDraft}
                />
              </div>
            )}
            <div
              className={
                mode === 'edit' && canDelete
                  ? `${styles.actions} ${styles.actionsSpread}`
                  : styles.actions
              }
            >
              {mode === 'edit' && canDelete ? (
                <button
                  type="button"
                  className={`${styles.action} ${styles.actionDanger}`}
                  disabled={locked}
                  onClick={() => setConfirmingDelete(true)}
                >
                  {t('customStyleDialogDelete')}
                </button>
              ) : null}
              <div className={styles.actionsEnd}>
                <button type="button" className={styles.action} onClick={onClose}>
                  {t('fontDialogCancel')}
                </button>
                <button
                  type="button"
                  className={`${styles.action} ${styles.actionPrimary}`}
                  disabled={locked || !canSave}
                  onClick={submit}
                >
                  {t('fontDialogOk')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
      </ChromePortal>
    )
}
