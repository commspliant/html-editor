import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  IMAGE_ACCEPT,
  readImageFileAsDataUrl,
  validateImageSrc,
  type ImageAttrs,
  type ImageFileError,
  type ImageSrcError,
} from '../../core/image'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import type { CustomImagePicker } from '../../types'
import styles from '../format/FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled])'

const SRC_ERROR_KEYS: Record<ImageSrcError, MessageKey> = {
  empty: 'imageDialogErrorEmpty',
  invalid: 'imageDialogErrorInvalid',
}

const FILE_ERROR_KEYS: Record<ImageFileError, MessageKey> = {
  type: 'imageDialogErrorType',
  tooLarge: 'imageDialogErrorTooLarge',
}

type ImageSource = 'file' | 'url' | 'custom'

export type ImageDialogProps = {
  open: boolean
  disabled?: boolean
  customImagePicker?: CustomImagePicker
  onApply: (draft: ImageAttrs) => void
  onCustomPick?: () => void
  onClose: () => void
}

export function ImageDialog({
  open,
  disabled,
  customImagePicker,
  onApply,
  onCustomPick,
  onClose,
}: ImageDialogProps) {
  const t = useT()
  const titleId = useId()
  const urlId = useId()
  const altId = useId()
  const titleFieldId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<ImageSource>('file')
  const [url, setUrl] = useState('')
  const [fileSrc, setFileSrc] = useState('')
  const [fileName, setFileName] = useState('')
  const [alt, setAlt] = useState('')
  const [title, setTitle] = useState('')
  const [fileError, setFileError] = useState<ImageFileError | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    if (!open) return
    setSource('file')
    setUrl('')
    setFileSrc('')
    setFileName('')
    setAlt('')
    setTitle('')
    setFileError(null)
    setReading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  const activeSrc = source === 'file' ? fileSrc : source === 'url' ? url : ''
  const srcError = source === 'custom' ? null : validateImageSrc(activeSrc)
  const errorKey =
    source === 'custom'
      ? null
      : source === 'file' && fileError
        ? FILE_ERROR_KEYS[fileError]
        : srcError && (source === 'file' || url.trim().length > 0)
          ? SRC_ERROR_KEYS[srcError]
          : null
  const canApply =
    source !== 'custom' &&
    srcError === null &&
    !(source === 'file' && fileError) &&
    !disabled &&
    !reading

  const pickCustom = () => {
    if (disabled || !customImagePicker) return
    onCustomPick?.()
  }

  const submit = () => {
    if (!canApply) return
    onApply({
      src: activeSrc.trim(),
      alt: alt.trim(),
      title: title.trim(),
    })
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setReading(true)
    setFileError(null)
    void readImageFileAsDataUrl(file).then(
      (dataUrl) => {
        setFileSrc(dataUrl)
        setFileName(file.name)
        setSource('file')
        setReading(false)
      },
      (error: unknown) => {
        const code = error instanceof Error ? error.message : ''
        setFileSrc('')
        setFileName('')
        setSource('file')
        setFileError(code === 'tooLarge' || code === 'type' ? code : 'type')
        setReading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    )
  }

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
        <div className={styles.headerRow}>
          <h2 className={styles.header} id={titleId}>
            {t('imageDialogTitle')}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('imageDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>
          <fieldset className={styles.group}>
            <legend className={styles.subLabel}>{t('imageDialogSource')}</legend>
            <div className={styles.sizeRow} role="radiogroup" aria-label={t('imageDialogSource')}>
              <button
                type="button"
                className={styles.action}
                role="radio"
                aria-checked={source === 'file'}
                disabled={disabled}
                onClick={() => setSource('file')}
              >
                {t('imageDialogFile')}
              </button>
              <button
                type="button"
                className={styles.action}
                role="radio"
                aria-checked={source === 'url'}
                disabled={disabled}
                onClick={() => setSource('url')}
              >
                {t('imageDialogUrl')}
              </button>
              {customImagePicker ? (
                <button
                  type="button"
                  className={styles.action}
                  role="radio"
                  aria-checked={source === 'custom'}
                  disabled={disabled}
                  onClick={() => setSource('custom')}
                >
                  {customImagePicker.text}
                </button>
              ) : null}
            </div>
            {source === 'file' ? (
              <div className={styles.fileRow}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  hidden
                  disabled={disabled}
                  aria-label={t('imageDialogChooseFile')}
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  className={styles.action}
                  disabled={disabled || reading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('imageDialogChooseFile')}
                </button>
                {fileName ? <span className={styles.fileName}>{fileName}</span> : null}
              </div>
            ) : null}
            {source === 'url' ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor={urlId}>
                  {t('imageDialogUrl')}
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
            {source === 'custom' && customImagePicker ? (
              <div className={styles.field}>
                <p className={styles.emptyHint}>{customImagePicker.description}</p>
                <button
                  type="button"
                  className={styles.action}
                  disabled={disabled}
                  onClick={pickCustom}
                >
                  {customImagePicker.buttonCaption}
                </button>
              </div>
            ) : null}
          </fieldset>
          {source !== 'custom' ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={altId}>
                  {t('imageDialogAlt')}
                </label>
                <input
                  id={altId}
                  className={styles.textInput}
                  value={alt}
                  disabled={disabled}
                  onChange={(event) => setAlt(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={titleFieldId}>
                  {t('imageDialogTitleField')}
                </label>
                <input
                  id={titleFieldId}
                  className={styles.textInput}
                  value={title}
                  disabled={disabled}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
            </>
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
    </div>,
    document.body,
  )
}
