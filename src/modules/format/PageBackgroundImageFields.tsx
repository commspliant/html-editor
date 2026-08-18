import type { PageBackgroundImageApply } from '../../core/pageBackgroundImage'
import { useT } from '../../i18n/LocaleProvider'
import type { CustomImagePicker } from '../../types'
import { ImageAdvancedFields } from '../insert/ImageAdvancedFields'
import { ImageSourcePicker } from '../insert/ImageSourcePicker'
import styles from './FontPropertiesDialog.module.css'

export type PageBackgroundImageFieldsProps = {
  value: PageBackgroundImageApply
  disabled?: boolean
  customImagePicker?: CustomImagePicker
  onCustomImagePick?: () => void
  onChange: (next: PageBackgroundImageApply) => void
}

export function PageBackgroundImageFields({
  value,
  disabled,
  customImagePicker,
  onCustomImagePick,
  onChange,
}: PageBackgroundImageFieldsProps) {
  const t = useT()
  const src = value.src ?? ''

  return (
    <>
      {src ? (
        <div className={styles.field}>
          <span className={styles.label}>{t('pageBackgroundImagePreview')}</span>
          <img
            className={styles.previewImage}
            src={src}
            alt={t('pageBackgroundImagePreviewAlt')}
          />
          <button
            type="button"
            className={styles.action}
            disabled={disabled}
            onClick={() => {
              onChange({ ...value, src: null })
            }}
          >
            {t('pageBackgroundImageClear')}
          </button>
        </div>
      ) : null}
      <ImageSourcePicker
        src={src}
        disabled={disabled}
        customImagePicker={customImagePicker}
        onCustomPick={onCustomImagePick}
        onSrcChange={(next) => {
          onChange({ ...value, src: next.trim() || null })
        }}
      />
      {src ? (
        <ImageAdvancedFields
          legendKey="pageDialogTabBackgroundImage"
          value={{
            opacity: value.opacity,
            fit: value.fit,
            position: value.position,
          }}
          disabled={disabled}
          onChange={(next) => {
            onChange({
              ...value,
              opacity: next.opacity,
              fit: next.fit,
              position: next.position,
            })
          }}
        />
      ) : null}
    </>
  )
}
