import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  HELP_ARTICLE_BY_ID,
  type HelpCategoryId,
  type HelpTopicId,
} from './articles'
import { filterHelpTopics } from './search'
import styles from './HelpDialog.module.css'

export type HelpDialogProps = {
  open: boolean
  topicId: HelpTopicId
  onTopicChange: (topicId: HelpTopicId) => void
  onClose: () => void
}

function categoryLabelKey(category: HelpCategoryId): MessageKey {
  const map: Record<HelpCategoryId, MessageKey> = {
    getStarted: 'helpCategoryGetStarted',
    file: 'helpCategoryFile',
    edit: 'helpCategoryEdit',
    insert: 'helpCategoryInsert',
    format: 'helpCategoryFormat',
    table: 'helpCategoryTable',
    view: 'helpCategoryView',
    keyboard: 'helpCategoryKeyboard',
  }
  return map[category]
}

export function HelpDialog({
  open,
  topicId,
  onTopicChange,
  onClose,
}: HelpDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    escapeIgnoreSelectors: false,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])',
  })

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const searchable = useMemo(
    () =>
      HELP_ARTICLES.map((article) => ({
        id: article.id,
        title: t(article.titleKey),
        body: t(article.bodyKey),
        keywords: t(article.keywordsKey),
      })),
    [t],
  )

  const filteredIds = useMemo(() => {
    const filtered = filterHelpTopics(searchable, query)
    return new Set(filtered.map((entry) => entry.id))
  }, [query, searchable])

  const activeArticle = HELP_ARTICLE_BY_ID[topicId]
  const showNoResults = query.trim().length > 0 && filteredIds.size === 0

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
          <div className={styles.headerRow}>
            <h2 id={titleId} className={styles.header}>
              {t('helpDialogTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label={t('helpDialogCloseAria')}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.searchRow}>
            <input
              type="search"
              className={styles.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('helpDialogSearchPlaceholder')}
              aria-label={t('helpDialogSearchAria')}
            />
          </div>
          <div className={styles.body}>
            <aside className={styles.sidebar} aria-label={t('helpDialogContentsAria')}>
              {HELP_CATEGORIES.map((category) => {
                const topics = HELP_ARTICLES.filter(
                  (article) => article.category === category && filteredIds.has(article.id),
                )
                if (topics.length === 0) return null
                return (
                  <div key={category}>
                    <h3 className={styles.category}>{t(categoryLabelKey(category))}</h3>
                    <ul className={styles.topicList}>
                      {topics.map((article) => (
                        <li key={article.id}>
                          <button
                            type="button"
                            className={`${styles.topicButton}${
                              article.id === topicId ? ` ${styles.topicButtonActive}` : ''
                            }`}
                            onClick={() => onTopicChange(article.id)}
                          >
                            {t(article.titleKey)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </aside>
            <div className={styles.main}>
              {showNoResults ? (
                <p className={styles.noResults}>{t('helpDialogNoResults')}</p>
              ) : (
                <>
                  <h3 className={styles.articleTitle}>{t(activeArticle.titleKey)}</h3>
                  <p className={styles.articleBody}>{t(activeArticle.bodyKey)}</p>
                  {activeArticle.related.length > 0 ? (
                    <div className={styles.related}>
                      <h4 className={styles.relatedTitle}>{t('helpDialogRelatedTitle')}</h4>
                      <ul className={styles.relatedList}>
                        {activeArticle.related.map((relatedId) => {
                          const related = HELP_ARTICLE_BY_ID[relatedId]
                          if (!related || !filteredIds.has(relatedId)) return null
                          return (
                            <li key={relatedId} className={styles.relatedItem}>
                              <button
                                type="button"
                                className={styles.relatedButton}
                                onClick={() => onTopicChange(relatedId)}
                              >
                                {t(related.titleKey)}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ChromePortal>
  )
}
