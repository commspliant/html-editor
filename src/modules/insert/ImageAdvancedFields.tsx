import { useEffect, useId, useState } from 'react'
import {
  opacityToPercent,
  percentToOpacity,
} from '../../core/paragraphBox'
import {
  IMAGE_OBJECT_FITS,
  IMAGE_OBJECT_POSITIONS,
  type ImageObjectFit,
} from '../../core/imageProperties'
import { formatFontSizeNumber } from '../../core/fontSizeUnits'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import styles from '../format/FontPropertiesDialog.module.css'

const FIT_KEYS: Record<ImageObjectFit, MessageKey> = {
  fill: 'imagePropertiesFitFill',
  contain: 'imagePropertiesFitContain',
  cover: 'imagePropertiesFitCover',
  none: 'imagePropertiesFitNoneValue',
  'scale-down': 'imagePropertiesFitScaleDown',
}

const POSITION_KEYS: Record<(typeof IMAGE_OBJECT_POSITIONS)[number], MessageKey> = {
  center: 'imagePropertiesPositionCenter',
  top: 'imagePropertiesPositionTop',
  bottom: 'imagePropertiesPositionBottom',
  left: 'imagePropertiesPositionLeft',
  right: 'imagePropertiesPositionRight',
  'top left': 'imagePropertiesPositionTopLeft',
  'top right': 'imagePropertiesPositionTopRight',
  'bottom left': 'imagePropertiesPositionBottomLeft',
  'bottom right': 'imagePropertiesPositionBottomRight',
}

export type ImageAdvancedFieldsValue = {
  opacity: number | null
  fit: ImageObjectFit | null
  position: string | null
}

export type ImageAdvancedFieldsProps = {
  legendKey?: MessageKey
  value: ImageAdvancedFieldsValue
  disabled?: boolean
  onChange: (next: ImageAdvancedFieldsValue) => void
}

export function ImageAdvancedFields({
  legendKey = 'imagePropertiesTabAdvanced',
  value,
  disabled,
  onChange,
}: ImageAdvancedFieldsProps) {
  const t = useT()
  const fitId = useId()
  const positionId = useId()

  return (
    <fieldset className={styles.group}>
      <legend className={styles.label}>{t(legendKey)}</legend>
      <OpacityField
        value={value.opacity}
        disabled={disabled}
        onChange={(opacity) => {
          onChange({ ...value, opacity })
        }}
      />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={fitId}>
          {t('imagePropertiesFit')}
        </label>
        <select
          id={fitId}
          className={styles.select}
          value={value.fit ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const raw = event.target.value
            onChange({ ...value, fit: raw ? (raw as ImageObjectFit) : null })
          }}
        >
          <option value="">{t('imagePropertiesFitDefault')}</option>
          {IMAGE_OBJECT_FITS.map((item) => (
            <option key={item} value={item}>
              {t(FIT_KEYS[item])}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={positionId}>
          {t('imagePropertiesPosition')}
        </label>
        <select
          id={positionId}
          className={styles.select}
          value={value.position ?? ''}
          disabled={disabled}
          onChange={(event) => {
            onChange({ ...value, position: event.target.value || null })
          }}
        >
          <option value="">{t('imagePropertiesPositionDefault')}</option>
          {IMAGE_OBJECT_POSITIONS.map((item) => (
            <option key={item} value={item}>
              {t(POSITION_KEYS[item])}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}

function OpacityField({
  value,
  disabled,
  onChange,
}: {
  value: number | null
  disabled?: boolean
  onChange: (next: number | null) => void
}) {
  const t = useT()
  const id = useId()
  const percent = value === null ? null : opacityToPercent(value)
  const [draft, setDraft] = useState(() =>
    percent === null ? '' : formatFontSizeNumber(percent),
  )
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDraft(percent === null ? '' : formatFontSizeNumber(percent))
    }
  }, [percent, focused])

  const commit = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange(null)
      setDraft('')
      return
    }
    const parsed = Number(trimmed.replace(',', '.'))
    if (!Number.isFinite(parsed)) {
      setDraft(percent === null ? '' : formatFontSizeNumber(percent))
      return
    }
    const next = percentToOpacity(parsed)
    onChange(next)
    setDraft(formatFontSizeNumber(opacityToPercent(next)))
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {t('paragraphDialogOpacity')}
      </label>
      <div className={styles.lengthRow}>
        <input
          id={id}
          className={styles.lengthInput}
          value={draft}
          disabled={disabled}
          inputMode="decimal"
          onFocus={() => setFocused(true)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            setFocused(false)
            commit(draft)
          }}
        />
        <span className={styles.lengthUnit} aria-hidden="true">
          {t('fontSizeUnitPercent')}
        </span>
      </div>
    </div>
  )
}
