import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import type { LinkApply, LinkDialogTab } from '../../core/commandTypes'
import type { BookmarkEntry } from '../../core/bookmark'
import { defaultLinkAttrs, type LinkHoverMode } from '../../core/link'
import { useT } from '../../i18n/LocaleProvider'
import { ColorField } from '../format/ColorField'
import styles from '../format/FontPropertiesDialog.module.css'

export type LinkDialogProps = {
  open: boolean
  tab: LinkDialogTab
  href: string
  title: string
  targetBlank: boolean
  textDecorationNone: boolean
  hoverMode: LinkHoverMode
  hoverColor: string | null
  hoverHtml: string
  bookmarks: readonly BookmarkEntry[]
  selectedBookmarkId: string
  disabled?: boolean
  onTabChange: (tab: LinkDialogTab) => void
  onApply: (draft: LinkApply) => void
  onClose: () => void
}

export function LinkDialog({
  open,
  tab,
  href,
  title,
  targetBlank,
  textDecorationNone,
  hoverMode,
  hoverColor,
  hoverHtml,
  bookmarks,
  selectedBookmarkId,
  disabled,
  onTabChange,
  onApply,
  onClose,
}: LinkDialogProps) {
  const t = useT()
  const titleId = useId()
  const hrefId = useId()
  const hoverTitleId = useId()
  const bookmarkId = useId()
  const hoverHtmlId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draftHref, setDraftHref] = useState(href)
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftBlank, setDraftBlank] = useState(targetBlank)
  const [draftNone, setDraftNone] = useState(textDecorationNone)
  const [draftHoverMode, setDraftHoverMode] = useState<LinkHoverMode>(hoverMode)
  const [draftHoverColor, setDraftHoverColor] = useState<string | null>(hoverColor)
  const [draftHoverHtml, setDraftHoverHtml] = useState(hoverHtml)
  const [draftBookmark, setDraftBookmark] = useState(selectedBookmarkId)

  useEffect(() => {
    if (!open) return
    setDraftHref(href)
    setDraftTitle(title)
    setDraftBlank(targetBlank)
    setDraftNone(textDecorationNone)
    setDraftHoverMode(hoverMode)
    setDraftHoverColor(hoverColor)
    setDraftHoverHtml(hoverHtml)
    setDraftBookmark(selectedBookmarkId)
  }, [
    open,
    href,
    title,
    targetBlank,
    textDecorationNone,
    hoverMode,
    hoverColor,
    hoverHtml,
    selectedBookmarkId,
  ])

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
  })

  if (!open) return null

  const appearance = () =>
    defaultLinkAttrs({
      title: draftTitle,
      targetBlank: draftBlank,
      textDecorationNone: draftNone,
      hoverMode: draftHoverMode,
      hoverColor: draftHoverColor,
      hoverHtml: draftHoverHtml,
    })

  const applyLink = () => {
    const nextHref = draftHref.trim()
    if (!nextHref || disabled) return
    onApply({ ...appearance(), href: nextHref })
  }

  const applyBookmark = () => {
    if (!draftBookmark || disabled) return
    onApply({ ...appearance(), href: `#${draftBookmark}` })
  }

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
          {t('linkDialogTitle')}
        </h2>
        <div className={styles.tabs} role="tablist" aria-label={t('linkDialogTitle')}>
          <button
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={tab === 'link'}
            onClick={() => onTabChange('link')}
          >
            {t('linkDialogTabLink')}
          </button>
          <button
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={tab === 'bookmark'}
            onClick={() => onTabChange('bookmark')}
          >
            {t('linkDialogTabBookmark')}
          </button>
        </div>
        <div className={styles.body} role="tabpanel">
          {tab === 'link' ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={hrefId}>
                  {t('linkDialogHref')}
                </label>
                <input
                  id={hrefId}
                  className={styles.textInput}
                  value={draftHref}
                  disabled={disabled}
                  onChange={(event) => setDraftHref(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={hoverTitleId}>
                  {t('linkDialogHoverTitle')}
                </label>
                <input
                  id={hoverTitleId}
                  className={styles.textInput}
                  value={draftTitle}
                  disabled={disabled}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
              </div>
              <label className={styles.mark}>
                <input
                  type="checkbox"
                  checked={draftBlank}
                  disabled={disabled}
                  onChange={(event) => setDraftBlank(event.target.checked)}
                />
                {t('linkDialogTargetBlank')}
              </label>
            </>
          ) : bookmarks.length === 0 ? (
            <p className={styles.emptyHint}>{t('linkDialogBookmarkEmpty')}</p>
          ) : (
            <div className={styles.field}>
              <label className={styles.label} htmlFor={bookmarkId}>
                {t('linkDialogBookmark')}
              </label>
              <select
                id={bookmarkId}
                className={`${styles.select} ${styles.fullSelect}`}
                value={draftBookmark}
                disabled={disabled}
                onChange={(event) => setDraftBookmark(event.target.value)}
              >
                <option value="" />
                {bookmarks.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className={styles.mark}>
            <input
              type="checkbox"
              checked={draftNone}
              disabled={disabled}
              onChange={(event) => setDraftNone(event.target.checked)}
            />
            {t('linkDialogTextDecorationNone')}
          </label>
          <fieldset className={styles.group}>
            <legend className={styles.subLabel}>{t('linkDialogHover')}</legend>
            <div className={styles.sizeRow} role="group" aria-label={t('linkDialogHover')}>
              <button
                type="button"
                className={styles.action}
                aria-pressed={draftHoverMode === 'color'}
                disabled={disabled}
                onClick={() => setDraftHoverMode('color')}
              >
                {t('linkDialogHoverColor')}
              </button>
              <button
                type="button"
                className={styles.action}
                aria-pressed={draftHoverMode === 'html'}
                disabled={disabled}
                onClick={() => setDraftHoverMode('html')}
              >
                {t('linkDialogHoverHtml')}
              </button>
            </div>
            {draftHoverMode === 'color' ? (
              <ColorField
                label={t('linkDialogHoverColorField')}
                noneLabel={t('colorNone')}
                value={draftHoverColor}
                disabled={disabled}
                onChange={setDraftHoverColor}
              />
            ) : (
              <div className={styles.field}>
                <label className={styles.label} htmlFor={hoverHtmlId}>
                  {t('linkDialogHoverHtmlAria')}
                </label>
                <textarea
                  id={hoverHtmlId}
                  className={styles.textarea}
                  value={draftHoverHtml}
                  disabled={disabled}
                  spellCheck={false}
                  onChange={(event) => setDraftHoverHtml(event.target.value)}
                />
              </div>
            )}
          </fieldset>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            disabled={disabled || !draftBookmark}
            onClick={applyBookmark}
          >
            {t('linkDialogSelect')}
          </button>
          <button type="button" className={styles.action} onClick={onClose}>
            {t('fontDialogCancel')}
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.actionPrimary}`}
            disabled={disabled || !draftHref.trim()}
            onClick={applyLink}
          >
            {t('fontDialogOk')}
          </button>
        </div>
      </div>
    </div>
      </ChromePortal>
    )
}
