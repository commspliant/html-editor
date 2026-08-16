import { useEffect, useId, useState } from 'react'
import type { FontSizeUnit } from '../../core/fontSizeUnits'
import {
  CSS_LENGTH_UNITS,
  DEFAULT_LENGTH_UNIT,
  parseCssLengthInput,
  type CssLength,
} from '../../core/cssLength'
import { formatFontSizeNumber } from '../../core/fontSizeUnits'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import styles from './FontPropertiesDialog.module.css'

const UNIT_KEYS: Record<FontSizeUnit, MessageKey> = {
  pt: 'fontSizeUnitPt',
  px: 'fontSizeUnitPx',
  em: 'fontSizeUnitEm',
  rem: 'fontSizeUnitRem',
  '%': 'fontSizeUnitPercent',
}

export type LengthFieldProps = {
  label: string
  value: CssLength | null
  disabled?: boolean
  allowNegative?: boolean
  unitAria?: string
  inputId?: string
  onChange: (next: CssLength | null) => void
}

export function LengthField({
  label,
  value,
  disabled,
  allowNegative = false,
  unitAria,
  inputId,
  onChange,
}: LengthFieldProps) {
  const t = useT()
  const generatedId = useId()
  const id = inputId ?? generatedId
  const unit = value?.unit ?? DEFAULT_LENGTH_UNIT
  const [draft, setDraft] = useState(() => (value ? formatFontSizeNumber(value.value) : ''))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDraft(value ? formatFontSizeNumber(value.value) : '')
    }
  }, [value, focused])

  const commit = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange(null)
      setDraft('')
      return
    }
    const parsed = parseCssLengthInput(trimmed, unit, allowNegative)
    if (!parsed) {
      setDraft(value ? formatFontSizeNumber(value.value) : '')
      return
    }
    onChange(parsed)
    setDraft(formatFontSizeNumber(parsed.value))
  }

  return (
    <div className={styles.lengthField}>
      <label className={styles.sideLabel} htmlFor={id}>
        {label}
      </label>
      <div className={styles.lengthRow}>
        <input
          id={id}
          className={styles.lengthInput}
          value={draft}
          disabled={disabled}
          inputMode="decimal"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            commit(draft)
          }}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            commit(draft)
            event.currentTarget.blur()
          }}
        />
        <select
          className={styles.lengthUnit}
          value={unit}
          disabled={disabled}
          aria-label={unitAria ?? t('paragraphDialogLengthUnitAria')}
          onChange={(event) => {
            const nextUnit = event.target.value as FontSizeUnit
            if (value) {
              onChange({ value: value.value, unit: nextUnit })
              return
            }
            if (draft.trim()) {
              const parsed = parseCssLengthInput(draft, nextUnit, allowNegative)
              onChange(parsed)
            }
          }}
        >
          {CSS_LENGTH_UNITS.map((item) => (
            <option key={item} value={item}>
              {t(UNIT_KEYS[item])}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
