import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import {
  AUDIO_ACCEPT,
  readAudioFileAsDataUrl,
  validateAudioSrc,
  type AudioAttrs,
  type AudioFileError,
  type AudioSrcError,
} from '../../core/audio'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import type { CustomAudioPicker } from '../../types'
import styles from '../format/FontPropertiesDialog.module.css'

const SRC_ERROR_KEYS: Record<AudioSrcError, MessageKey> = {
  empty: 'audioDialogErrorEmpty',
  invalid: 'audioDialogErrorInvalid',
}

const FILE_ERROR_KEYS: Record<AudioFileError, MessageKey> = {
  type: 'audioDialogErrorType',
  tooLarge: 'audioDialogErrorTooLarge',
}

type AudioSource = 'file' | 'url' | 'custom'

export type AudioDialogProps = {
  open: boolean
  disabled?: boolean
  customAudioPicker?: CustomAudioPicker
  onApply: (draft: AudioAttrs) => void
  onCustomPick?: () => void
  onClose: () => void
}

export function AudioDialog({
  open,
  disabled,
  customAudioPicker,
  onApply,
  onCustomPick,
  onClose,
}: AudioDialogProps) {
  const t = useT()
  const titleId = useId()
  const urlId = useId()
  const titleFieldId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<AudioSource>('file')
  const [url, setUrl] = useState('')
  const [fileSrc, setFileSrc] = useState('')
  const [fileName, setFileName] = useState('')
  const [title, setTitle] = useState('')
  const [fileError, setFileError] = useState<AudioFileError | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    if (!open) return
    setSource('file')
    setUrl('')
    setFileSrc('')
    setFileName('')
    setTitle('')
    setFileError(null)
    setReading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open])

  useDialogFocusTrap(dialogRef, { open, onClose, escapeIgnoreSelectors: false })

  if (!open) return null

  const activeSrc = source === 'file' ? fileSrc : source === 'url' ? url : ''
  const srcError = source === 'custom' ? null : validateAudioSrc(activeSrc)
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
    if (disabled || !customAudioPicker) return
    onCustomPick?.()
  }

  const submit = () => {
    if (!canApply) return
    onApply({
      src: activeSrc.trim(),
      title: title.trim(),
    })
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setReading(true)
    setFileError(null)
    void readAudioFileAsDataUrl(file).then(
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
              {t('audioDialogTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label={t('audioDialogCloseAria')}
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
                  aria-checked={source === 'file'}
                  disabled={disabled}
                  onClick={() => setSource('file')}
                >
                  {t('audioDialogFile')}
                </button>
                <button
                  type="button"
                  className={styles.action}
                  role="radio"
                  aria-checked={source === 'url'}
                  disabled={disabled}
                  onClick={() => setSource('url')}
                >
                  {t('audioDialogUrl')}
                </button>
                {customAudioPicker ? (
                  <button
                    type="button"
                    className={styles.action}
                    role="radio"
                    aria-checked={source === 'custom'}
                    disabled={disabled}
                    onClick={() => setSource('custom')}
                  >
                    {customAudioPicker.text}
                  </button>
                ) : null}
              </div>
              {source === 'file' ? (
                <div className={styles.fileRow}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={AUDIO_ACCEPT}
                    hidden
                    disabled={disabled}
                    aria-label={t('audioDialogChooseFile')}
                    onChange={onFileChange}
                  />
                  <button
                    type="button"
                    className={styles.action}
                    disabled={disabled || reading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('audioDialogChooseFile')}
                  </button>
                  {fileName ? <span className={styles.fileName}>{fileName}</span> : null}
                </div>
              ) : null}
              {source === 'url' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={urlId}>
                    {t('audioDialogUrl')}
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
              {source === 'custom' && customAudioPicker ? (
                <div className={styles.field}>
                  <p className={styles.emptyHint}>{customAudioPicker.description}</p>
                  <button
                    type="button"
                    className={styles.action}
                    disabled={disabled}
                    onClick={pickCustom}
                  >
                    {customAudioPicker.buttonCaption}
                  </button>
                </div>
              ) : null}
            </fieldset>
            {source !== 'custom' ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor={titleFieldId}>
                  {t('audioDialogTitleField')}
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
