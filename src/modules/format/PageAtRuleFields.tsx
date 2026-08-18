import { useId, useState } from 'react'
import { DEFAULT_LENGTH_UNIT, parseCssLengthInput, type CssLength } from '../../core/cssLength'
import { BOX_SIDES, type BoxSide, type BoxSides } from '../../core/paragraphBox'
import {
  emptyPageAtRuleApply,
  type PageAtRuleApply,
  type PageSizePreset,
} from '../../core/pageAtRule'
import { formatFontSizeNumber } from '../../core/fontSizeUnits'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import styles from './FontPropertiesDialog.module.css'

const SIZE_PRESETS: PageSizePreset[] = ['auto', 'A4', 'letter', 'legal', 'custom']

const SIZE_LABELS: Record<PageSizePreset, MessageKey> = {
  auto: 'pageAtRuleSizeAuto',
  A4: 'pageAtRuleSizeA4',
  letter: 'pageAtRuleSizeLetter',
  legal: 'pageAtRuleSizeLegal',
  custom: 'pageAtRuleSizeCustom',
}

const SIDE_KEYS: Record<BoxSide, MessageKey> = {
  top: 'paragraphDialogSideTop',
  right: 'paragraphDialogSideRight',
  bottom: 'paragraphDialogSideBottom',
  left: 'paragraphDialogSideLeft',
}

export type PageAtRuleFieldsProps = {
  value: PageAtRuleApply
  disabled?: boolean
  onChange: (next: PageAtRuleApply) => void
  onReset: () => void
}

function lengthDraft(value: CssLength | null): string {
  return value === null ? '' : formatFontSizeNumber(value.value)
}

export function PageAtRuleFields({ value, disabled, onChange, onReset }: PageAtRuleFieldsProps) {
  const t = useT()
  const sizeId = useId()
  const [marginLinked, setMarginLinked] = useState(true)

  const draft = value ?? emptyPageAtRuleApply()

  const setMarginSide = (side: BoxSide, next: CssLength | null) => {
    if (marginLinked) {
      onChange({
        ...draft,
        margin: {
          top: next,
          right: next,
          bottom: next,
          left: next,
        },
        marginMixed: false,
      })
      return
    }
    onChange({
      ...draft,
      margin: { ...draft.margin, [side]: next },
      marginMixed: false,
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={sizeId}>
          {t('pageAtRuleSize')}
        </label>
        <select
          id={sizeId}
          className={styles.select}
          disabled={disabled}
          value={draft.sizePreset}
          onChange={(event) =>
            onChange({
              ...draft,
              sizePreset: event.target.value as PageSizePreset,
            })
          }
        >
          {SIZE_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {t(SIZE_LABELS[preset])}
            </option>
          ))}
        </select>
      </div>

      {draft.sizePreset === 'custom' ? (
        <div className={styles.sideGrid}>
          <LengthField
            label={t('pageAtRuleWidth')}
            value={draft.customWidth}
            disabled={disabled}
            onChange={(next) => onChange({ ...draft, customWidth: next })}
          />
          <LengthField
            label={t('pageAtRuleHeight')}
            value={draft.customHeight}
            disabled={disabled}
            onChange={(next) => onChange({ ...draft, customHeight: next })}
          />
        </div>
      ) : null}

      <div className={styles.field}>
        <span className={styles.label}>{t('pageAtRuleOrientation')}</span>
        <div className={styles.marks}>
          {(
            [
              ['none', 'pageAtRuleOrientationNone'],
              ['portrait', 'pageAtRuleOrientationPortrait'],
              ['landscape', 'pageAtRuleOrientationLandscape'],
            ] as const
          ).map(([orientation, labelKey]) => (
            <label key={orientation} className={styles.mark}>
              <input
                type="radio"
                name="page-orientation"
                checked={(draft.orientation ?? 'none') === orientation}
                disabled={disabled}
                onChange={() =>
                  onChange({
                    ...draft,
                    orientation: orientation === 'none' ? null : orientation,
                  })
                }
              />
              {t(labelKey)}
            </label>
          ))}
        </div>
      </div>

      <fieldset className={styles.nestedGroup}>
        <legend className={styles.subLabel}>{t('pageAtRuleMargins')}</legend>
        <label className={styles.mark}>
          <input
            type="checkbox"
            checked={marginLinked}
            disabled={disabled}
            onChange={() => setMarginLinked(!marginLinked)}
          />
          {t('paragraphDialogLinkSides')}
        </label>
        <div className={styles.sideGrid}>
          {(marginLinked ? (['top'] as const) : BOX_SIDES).map((side) => (
            <LengthField
              key={side}
              label={marginLinked ? t('pageAtRuleMargins') : t(SIDE_KEYS[side])}
              value={draft.margin[side]}
              disabled={disabled}
              onChange={(next) => setMarginSide(side, next)}
            />
          ))}
        </div>
      </fieldset>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          disabled={disabled}
          aria-label={t('pageAtRuleResetAria')}
          onClick={onReset}
        >
          {t('pageAtRuleReset')}
        </button>
      </div>
    </div>
  )
}

function LengthField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: CssLength | null
  disabled?: boolean
  onChange: (next: CssLength | null) => void
}) {
  const t = useT()
  const id = useId()
  const [draft, setDraft] = useState(() => lengthDraft(value))
  const unit = value?.unit ?? DEFAULT_LENGTH_UNIT

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.lengthRow}>
        <input
          id={id}
          className={styles.lengthInput}
          value={draft}
          disabled={disabled}
          inputMode="decimal"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const trimmed = draft.trim()
            if (!trimmed) {
              onChange(null)
              return
            }
            const parsed = parseCssLengthInput(trimmed, unit, false)
            if (!parsed) {
              setDraft(lengthDraft(value))
              return
            }
            onChange(parsed)
            setDraft(formatFontSizeNumber(parsed.value))
          }}
        />
        <select
          className={styles.lengthUnit}
          disabled={disabled}
          value={unit}
          aria-label={t('paragraphDialogLengthUnitAria')}
          onChange={(event) => {
            const nextUnit = event.target.value as CssLength['unit']
            if (!value) return
            onChange({ ...value, unit: nextUnit })
          }}
        >
          <option value="pt">{t('fontSizeUnitPt')}</option>
          <option value="px">{t('fontSizeUnitPx')}</option>
          <option value="em">{t('fontSizeUnitEm')}</option>
          <option value="rem">{t('fontSizeUnitRem')}</option>
          <option value="%">{t('fontSizeUnitPercent')}</option>
        </select>
      </div>
    </div>
  )
}
