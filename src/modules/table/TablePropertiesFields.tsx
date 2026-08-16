import { useId } from 'react'
import type { TablePropertiesApply } from '../../core/tableProperties'
import {
  BORDER_STYLES,
  type BorderStyle,
  type CssLength,
  type ParagraphShadow,
} from '../../core/paragraphBox'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { ColorField } from '../format/ColorField'
import { LengthField } from '../format/LengthField'
import { ShadowFields } from '../format/ShadowFields'
import styles from '../format/FontPropertiesDialog.module.css'

const BORDER_STYLE_KEYS: Record<BorderStyle, MessageKey> = {
  none: 'paragraphDialogBorderStyleNone',
  solid: 'paragraphDialogBorderStyleSolid',
  dotted: 'paragraphDialogBorderStyleDotted',
  dashed: 'paragraphDialogBorderStyleDashed',
  double: 'paragraphDialogBorderStyleDouble',
  groove: 'paragraphDialogBorderStyleGroove',
  ridge: 'paragraphDialogBorderStyleRidge',
  inset: 'paragraphDialogBorderStyleInset',
  outset: 'paragraphDialogBorderStyleOutset',
}

const DEFAULT_BORDER_WIDTH: CssLength = { value: 1, unit: 'pt' }

const DEFAULT_SHADOW: ParagraphShadow = {
  offsetX: { value: 0, unit: 'px' },
  offsetY: { value: 4, unit: 'px' },
  blur: { value: 8, unit: 'px' },
  spread: { value: 0, unit: 'px' },
  color: '#000000',
  inset: false,
}

export type TablePropertiesFieldsProps = {
  value: TablePropertiesApply
  disabled?: boolean
  onChange: (next: TablePropertiesApply) => void
}

export function TablePropertiesFields({ value, disabled, onChange }: TablePropertiesFieldsProps) {
  const t = useT()
  const collapseId = useId()
  const borderStyleId = useId()

  return (
    <div className={styles.body}>
      <fieldset className={styles.group}>
        <legend className={styles.label}>{t('tablePropertiesWidth')}</legend>
        <LengthField
          label={t('tablePropertiesWidth')}
          value={value.width}
          disabled={disabled}
          onChange={(width) => onChange({ ...value, width })}
        />
        <div className={styles.field}>
          <label className={styles.label} htmlFor={collapseId}>
            {t('tablePropertiesCollapse')}
          </label>
          <select
            id={collapseId}
            className={styles.select}
            value={value.borderCollapse}
            disabled={disabled}
            onChange={(event) => {
              const borderCollapse = event.target.value === 'separate' ? 'separate' : 'collapse'
              onChange({
                ...value,
                borderCollapse,
                borderSpacing: borderCollapse === 'separate' ? value.borderSpacing : null,
              })
            }}
          >
            <option value="collapse">{t('tablePropertiesCollapseCollapse')}</option>
            <option value="separate">{t('tablePropertiesCollapseSeparate')}</option>
          </select>
        </div>
        {value.borderCollapse === 'separate' ? (
          <LengthField
            label={t('tablePropertiesSpacing')}
            value={value.borderSpacing}
            disabled={disabled}
            onChange={(borderSpacing) => onChange({ ...value, borderSpacing })}
          />
        ) : null}
      </fieldset>
      <fieldset className={styles.group}>
        <legend className={styles.label}>{t('paragraphDialogBorder')}</legend>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={borderStyleId}>
            {t('paragraphDialogBorderStyle')}
          </label>
          <select
            id={borderStyleId}
            className={styles.select}
            value={value.border.style}
            disabled={disabled}
            onChange={(event) => {
              const style = event.target.value as BorderStyle
              onChange({
                ...value,
                border: {
                  style,
                  width: style === 'none' ? null : (value.border.width ?? DEFAULT_BORDER_WIDTH),
                  color: style === 'none' ? null : value.border.color,
                },
              })
            }}
          >
            {BORDER_STYLES.map((item) => (
              <option key={item} value={item}>
                {t(BORDER_STYLE_KEYS[item])}
              </option>
            ))}
          </select>
        </div>
        {value.border.style !== 'none' ? (
          <>
            <LengthField
              label={t('paragraphDialogBorderWidth')}
              value={value.border.width}
              disabled={disabled}
              onChange={(width) => onChange({ ...value, border: { ...value.border, width } })}
            />
            <ColorField
              label={t('paragraphDialogBorderColor')}
              noneLabel={t('colorNone')}
              value={value.border.color}
              disabled={disabled}
              onChange={(color) => onChange({ ...value, border: { ...value.border, color } })}
            />
          </>
        ) : null}
        <LengthField
          label={t('paragraphDialogBorderRadius')}
          value={value.borderRadius}
          disabled={disabled}
          onChange={(borderRadius) => onChange({ ...value, borderRadius })}
        />
        <label className={styles.mark}>
          <input
            type="checkbox"
            checked={value.boxShadow !== null}
            disabled={disabled}
            onChange={() => {
              onChange({
                ...value,
                boxShadow: value.boxShadow ? null : DEFAULT_SHADOW,
              })
            }}
          />
          {t('paragraphDialogBoxShadow')}
        </label>
        {value.boxShadow ? (
          <ShadowFields
            shadow={value.boxShadow}
            disabled={disabled}
            onChange={(boxShadow) => onChange({ ...value, boxShadow })}
          />
        ) : null}
      </fieldset>
    </div>
  )
}
