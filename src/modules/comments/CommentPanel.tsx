import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../../i18n/LocaleProvider'
import { CloseIcon } from '../../icons'
import type { CommentAuthor, CommentThread } from '../../types'
import styles from './CommentPanel.module.css'

export type CommentPanelProps = {
  thread: CommentThread | null
  locale: string
  disabled?: boolean
  commentAuthor?: CommentAuthor
  onPost: (message: string) => void
  onClose: () => void
}

function formatTimestamp(createdAt: string, locale: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function CommentPanel({
  thread,
  locale,
  disabled,
  commentAuthor,
  onPost,
  onClose,
}: CommentPanelProps) {
  const t = useT()
  const [draft, setDraft] = useState('')

  const canPost = !disabled && commentAuthor && draft.trim().length > 0

  const messages = useMemo(() => thread?.messages ?? [], [thread?.messages])

  if (!thread) return null

  const handleSubmit = () => {
    const text = draft.trim()
    if (!text || !canPost) return
    onPost(text)
    setDraft('')
  }

  return createPortal(
    <div className={styles.panel} role="dialog" aria-label={t('commentPanelTitle')}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('commentPanelTitle')}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={t('commentPanelCloseAria')}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <p className={styles.empty}>{t('commentEmpty')}</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={styles.message}>
              <header className={styles.messageHeader}>
                <span className={styles.author}>{message.userName}</span>
                <time className={styles.time} dateTime={message.createdAt}>
                  {formatTimestamp(message.createdAt, locale)}
                </time>
              </header>
              <p className={styles.body}>{message.message}</p>
            </article>
          ))
        )}
      </div>
      <div className={styles.reply}>
        <textarea
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('commentReplyPlaceholder')}
          rows={3}
          disabled={disabled || !commentAuthor}
        />
        <button
          type="button"
          className={styles.post}
          onClick={handleSubmit}
          disabled={!canPost}
        >
          {t('commentPost')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
