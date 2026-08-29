import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import { validateImageSrc, type ImageAttrs } from '../../core/image'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { CustomImagePicker } from '../../types'
import styles from '../format/FontPropertiesDialog.module.css'
import { ImageSourcePicker, isImageSourceValid } from './ImageSourcePicker'

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
  const altId = useId()
  const titleFieldId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<'file' | 'url' | 'custom'>('file')

  useEffect(() => {
    if (!open) return
    setSrc('')
    setAlt('')
    setTitle('')
    setSource('file')
  }, [open])

  useDialogFocusTrap(dialogRef, { open, onClose, escapeIgnoreSelectors: false })

  if (!open) return null

  const canApply = isImageSourceValid(src) && !disabled

  const submit = () => {
    if (!canApply) return
    onApply({
      src: src.trim(),
      alt: alt.trim(),
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
          <ImageSourcePicker
            src={src}
            disabled={disabled}
            customImagePicker={customImagePicker}
            onCustomPick={onCustomPick}
            onSourceChange={setSource}
            onSrcChange={setSrc}
          />
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
