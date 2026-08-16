import type { ParagraphShadow } from '../../core/paragraphBox'
import { useT } from '../../i18n/LocaleProvider'
import { ColorField } from './ColorField'
import { LengthField } from './LengthField'
import styles from './FontPropertiesDialog.module.css'

export type ShadowFieldsProps = {
  shadow: ParagraphShadow
  disabled?: boolean
  onChange: (next: ParagraphShadow) => void
}

export function ShadowFields({ shadow, disabled, onChange }: ShadowFieldsProps) {
  const t = useT()
  return (
    <div className={styles.shadowGrid}>
      <LengthField
        label={t('paragraphDialogShadowOffsetX')}
        value={shadow.offsetX}
        disabled={disabled}
        allowNegative
        onChange={(offsetX) => {
          onChange({ ...shadow, offsetX: offsetX ?? { value: 0, unit: 'px' } })
        }}
      />
      <LengthField
        label={t('paragraphDialogShadowOffsetY')}
        value={shadow.offsetY}
        disabled={disabled}
        allowNegative
        onChange={(offsetY) => {
          onChange({ ...shadow, offsetY: offsetY ?? { value: 0, unit: 'px' } })
        }}
      />
      <LengthField
        label={t('paragraphDialogShadowBlur')}
        value={shadow.blur}
        disabled={disabled}
        onChange={(blur) => {
          onChange({ ...shadow, blur: blur ?? { value: 0, unit: 'px' } })
        }}
      />
      <LengthField
        label={t('paragraphDialogShadowSpread')}
        value={shadow.spread}
        disabled={disabled}
        allowNegative
        onChange={(spread) => {
          onChange({ ...shadow, spread: spread ?? { value: 0, unit: 'px' } })
        }}
      />
      <ColorField
        label={t('paragraphDialogShadowColor')}
        noneLabel={t('colorNone')}
        value={shadow.color}
        disabled={disabled}
        onChange={(color) => {
          onChange({ ...shadow, color })
        }}
      />
      <label className={styles.mark}>
        <input
          type="checkbox"
          checked={shadow.inset}
          disabled={disabled}
          onChange={() => {
            onChange({ ...shadow, inset: !shadow.inset })
          }}
        />
        {t('paragraphDialogShadowInset')}
      </label>
    </div>
  )
}
