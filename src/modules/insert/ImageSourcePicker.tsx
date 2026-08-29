import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import {
  IMAGE_ACCEPT,
  readImageFileAsDataUrl,
  validateImageSrc,
  type ImageFileError,
  type ImageSrcError,
} from '../../core/image'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import type { CustomImagePicker } from '../../types'
import styles from '../format/FontPropertiesDialog.module.css'

const SRC_ERROR_KEYS: Record<ImageSrcError, MessageKey> = {
  empty: 'imageDialogErrorEmpty',
  invalid: 'imageDialogErrorInvalid',
}

const FILE_ERROR_KEYS: Record<ImageFileError, MessageKey> = {
  type: 'imageDialogErrorType',
  tooLarge: 'imageDialogErrorTooLarge',
}

type ImageSource = 'file' | 'url' | 'custom'

export type { ImageSource }

export type ImageSourcePickerProps = {
  src: string
  disabled?: boolean
  customImagePicker?: CustomImagePicker
  /** When true with `customImagePicker`, hide File/URL and show only the custom source. */
  disableBuiltinSources?: boolean
  onSrcChange: (src: string) => void
  onCustomPick?: () => void
  onSourceChange?: (source: ImageSource) => void
}

function initialImageSource(
  src: string,
  disableBuiltinSources: boolean,
  customImagePicker?: CustomImagePicker,
): ImageSource {
  if (disableBuiltinSources && customImagePicker) return 'custom'
  return src.startsWith('data:') ? 'file' : src.trim() ? 'url' : 'file'
}

export function ImageSourcePicker({
  src,
  disabled,
  customImagePicker,
  disableBuiltinSources = false,
  onSrcChange,
  onCustomPick,
  onSourceChange,
}: ImageSourcePickerProps) {
  const t = useT()
  const urlId = useId()
  const errorId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const customOnly = disableBuiltinSources && Boolean(customImagePicker)
  const [source, setSource] = useState<ImageSource>(() =>
    initialImageSource(src, disableBuiltinSources, customImagePicker),
  )
  const [url, setUrl] = useState(() => (src.startsWith('data:') ? '' : src))
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState<ImageFileError | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    onSourceChange?.(source)
  }, [onSourceChange, source])

  useEffect(() => {
    if (customOnly) setSource('custom')
  }, [customOnly])

  const activeSrc = source === 'file' && src.startsWith('data:') ? src : source === 'url' ? url : ''
  const srcError = source === 'custom' ? null : validateImageSrc(activeSrc)
  const errorKey =
    source === 'custom'
      ? null
      : source === 'file' && fileError
        ? FILE_ERROR_KEYS[fileError]
        : srcError && (source === 'file' || url.trim().length > 0)
          ? SRC_ERROR_KEYS[srcError]
          : null

  const pickCustom = () => {
    if (disabled || !customImagePicker) return
    onCustomPick?.()
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setReading(true)
    setFileError(null)
    void readImageFileAsDataUrl(file).then(
      (dataUrl) => {
        setFileName(file.name)
        setSource('file')
        onSrcChange(dataUrl)
        setReading(false)
      },
      (error: unknown) => {
        const code = error instanceof Error ? error.message : ''
        setFileName('')
        setSource('file')
        setFileError(code === 'tooLarge' || code === 'type' ? code : 'type')
        setReading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    )
  }

  return (
    <fieldset className={styles.group}>
      <legend className={styles.subLabel}>{t('imageDialogSource')}</legend>
      {customOnly ? null : (
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
      )}
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
          {src.startsWith('data:') && !fileName ? (
            <span className={styles.fileName}>{t('pageBackgroundImageCurrent')}</span>
          ) : null}
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
            onChange={(event) => {
              const next = event.target.value
              setUrl(next)
              onSrcChange(next.trim())
            }}
          />
        </div>
      ) : null}
      {(customOnly || source === 'custom') && customImagePicker ? (
        <div className={styles.field}>
          <p className={styles.emptyHint}>{customImagePicker.description}</p>
          <button type="button" className={styles.action} disabled={disabled} onClick={pickCustom}>
            {customImagePicker.buttonCaption}
          </button>
        </div>
      ) : null}
      {errorKey ? (
        <p id={errorId} className={styles.error}>
          {t(errorKey)}
        </p>
      ) : null}
    </fieldset>
  )
}

export function isImageSourceValid(src: string): boolean {
  return validateImageSrc(src.trim()) === null
}
