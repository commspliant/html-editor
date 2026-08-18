import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import {
  validateYoutubeUrl,
  type YoutubeAttrs,
  type YoutubeUrlError,
} from '../../core/youtube'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import type { CustomVideoPicker } from '../../types'
import styles from '../format/FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled])'

const URL_ERROR_KEYS: Record<YoutubeUrlError, MessageKey> = {
  empty: 'youtubeDialogErrorEmpty',
  invalid: 'youtubeDialogErrorInvalid',
}

type YoutubeSource = 'url' | 'custom'

export type YoutubeDialogProps = {
  open: boolean
  disabled?: boolean
  customVideoPicker?: CustomVideoPicker
  onApply: (draft: YoutubeAttrs) => void
  onCustomPick?: () => void
  onClose: () => void
}

export function YoutubeDialog({
  open,
  disabled,
  customVideoPicker,
  onApply,
  onCustomPick,
  onClose,
}: YoutubeDialogProps) {
  const t = useT()
  const titleId = useId()
  const urlId = useId()
  const titleFieldId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [source, setSource] = useState<YoutubeSource>('url')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!open) return
    setSource('url')
    setUrl('')
    setTitle('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    const focusable = node?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  const urlError = source === 'custom' ? null : validateYoutubeUrl(url)
  const errorKey =
    source === 'custom'
      ? null
      : urlError && url.trim().length > 0
        ? URL_ERROR_KEYS[urlError]
        : urlError === 'empty' && url.trim().length === 0
          ? null
          : urlError
            ? URL_ERROR_KEYS[urlError]
            : null
  const canApply = source !== 'custom' && urlError === null && !disabled && url.trim().length > 0

  const pickCustom = () => {
    if (disabled || !customVideoPicker) return
    onCustomPick?.()
  }

  const submit = () => {
    if (!canApply) return
    onApply({
      url: url.trim(),
      title: title.trim(),
    })
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
          <div className={styles.headerRow}>
            <h2 className={styles.header} id={titleId}>
              {t('youtubeDialogTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label={t('youtubeDialogCloseAria')}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.body}>
            <fieldset className={styles.group}>
              <legend className={styles.subLabel}>{t('audioDialogSource')}</legend>
              <div className={styles.sizeRow} role="radiogroup" aria-label={t('audioDialogSource')}>
                <button
                  type="button"
                  className={styles.action}
                  role="radio"
                  aria-checked={source === 'url'}
                  disabled={disabled}
                  onClick={() => setSource('url')}
                >
                  {t('youtubeDialogUrl')}
                </button>
                {customVideoPicker ? (
                  <button
                    type="button"
                    className={styles.action}
                    role="radio"
                    aria-checked={source === 'custom'}
                    disabled={disabled}
                    onClick={() => setSource('custom')}
                  >
                    {customVideoPicker.text}
                  </button>
                ) : null}
              </div>
              {source === 'url' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={urlId}>
                    {t('youtubeDialogUrl')}
                  </label>
                  <input
                    id={urlId}
                    className={styles.textInput}
                    value={url}
                    disabled={disabled}
                    aria-invalid={errorKey !== null}
                    aria-describedby={errorKey ? errorId : undefined}
                    onChange={(event) => setUrl(event.target.value)}
                  />
                </div>
              ) : null}
              {source === 'custom' && customVideoPicker ? (
                <div className={styles.field}>
                  <p className={styles.emptyHint}>{customVideoPicker.description}</p>
                  <button
                    type="button"
                    className={styles.action}
                    disabled={disabled}
                    onClick={pickCustom}
                  >
                    {customVideoPicker.buttonCaption}
                  </button>
                </div>
              ) : null}
            </fieldset>
            {source !== 'custom' ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor={titleFieldId}>
                  {t('youtubeDialogTitleField')}
                </label>
                <input
                  id={titleFieldId}
                  className={styles.textInput}
                  value={title}
                  disabled={disabled}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
            ) : null}
            {errorKey ? (
              <p id={errorId} className={styles.error}>
                {t(errorKey)}
              </p>
            ) : null}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={onClose}>
              {t('fontDialogCancel')}
            </button>
            {source !== 'custom' ? (
              <button
                type="button"
                className={`${styles.action} ${styles.actionPrimary}`}
                disabled={!canApply}
                onClick={submit}
              >
                {t('fontDialogOk')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </ChromePortal>
  )
}
