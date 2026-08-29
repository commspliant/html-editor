import type { ImageObjectFit } from '../../core/imageProperties'
import {
  DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH,
  isKeywordPageBackgroundFit,
  type PageBackgroundImageApply,
} from '../../core/pageBackgroundImage'
import type { ImageSizeLength } from '../../core/imageSize'
import { useT } from '../../i18n/LocaleProvider'
import type { CustomImagePicker } from '../../types'
import { ImageAdvancedFields } from '../insert/ImageAdvancedFields'
import { ImageSizeField } from '../insert/ImageSizeField'
import { ImageSourcePicker } from '../insert/ImageSourcePicker'
import styles from './FontPropertiesDialog.module.css'

export type PageBackgroundImageFieldsProps = {
  value: PageBackgroundImageApply
  disabled?: boolean
  customImagePicker?: CustomImagePicker
  disableBuiltinSources?: boolean
  onCustomImagePick?: () => void
  onChange: (next: PageBackgroundImageApply) => void
}

function sizeFromFit(fit: ImageObjectFit | null): Pick<PageBackgroundImageApply, 'width' | 'height'> {
  if (isKeywordPageBackgroundFit(fit)) return { width: null, height: null }
  if (fit === 'fill') {
    return {
      width: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
      height: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
    }
  }
  return {
    width: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
    height: null,
  }
}

export function PageBackgroundImageFields({
  value,
  disabled,
  customImagePicker,
  disableBuiltinSources,
  onCustomImagePick,
  onChange,
}: PageBackgroundImageFieldsProps) {
  const t = useT()
  const src = value.src ?? ''

  const changeSize = (side: 'width' | 'height', next: ImageSizeLength | null) => {
    onChange({
      ...value,
      fit: null,
      [side]: next,
    })
  }

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
        disableBuiltinSources={disableBuiltinSources}
        onCustomPick={onCustomImagePick}
        onSrcChange={(next) => {
          onChange({ ...value, src: next.trim() || null })
        }}
      />
      {src ? (
        <>
          <ImageSizeField
            label={t('imagePropertiesWidth')}
            inputAria={t('imagePropertiesWidthAria')}
            value={value.width}
            disabled={disabled}
            onChange={(width) => changeSize('width', width)}
          />
          <ImageSizeField
            label={t('imagePropertiesHeight')}
            inputAria={t('imagePropertiesHeightAria')}
            value={value.height}
            disabled={disabled}
            onChange={(height) => changeSize('height', height)}
          />
          <ImageAdvancedFields
            legendKey="pageDialogTabBackgroundImage"
            value={{
              opacity: value.opacity,
              fit: value.fit,
              position: value.position,
            }}
            disabled={disabled}
            onChange={(next) => {
              const size =
                next.fit === value.fit
                  ? { width: value.width, height: value.height }
                  : sizeFromFit(next.fit)
              onChange({
                ...value,
                opacity: next.opacity,
                fit: next.fit,
                position: next.position,
                ...size,
              })
            }}
          />
        </>
      ) : null}
    </>
  )
}
