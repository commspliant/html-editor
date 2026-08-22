import { useEffect, useId, useState } from 'react'
import type { CellPropertiesApply } from '../../core/cellProperties'
import { CELL_VERTICAL_ALIGNS } from '../../core/cellProperties'
import {
  BOX_SIDES,
  boxSidesEqual,
  type BoxSide,
  type BoxSides,
  type CssLength,
} from '../../core/paragraphBox'
import type { TextAlign } from '../../core/textAlign'
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { ColorField } from '../format/ColorField'
import { LengthField } from '../format/LengthField'
import styles from '../format/FontPropertiesDialog.module.css'

const CELL_TEXT_ALIGNS = ['left', 'center', 'right'] as const satisfies readonly TextAlign[]

const TEXT_ALIGN_ICONS = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
} as const

const TEXT_ALIGN_KEYS: Record<(typeof CELL_TEXT_ALIGNS)[number], MessageKey> = {
  left: 'commandAlignLeftAria',
  center: 'commandAlignCenterAria',
  right: 'commandAlignRightAria',
}

const SIDE_KEYS: Record<BoxSide, MessageKey> = {
  top: 'paragraphDialogSideTop',
  right: 'paragraphDialogSideRight',
  bottom: 'paragraphDialogSideBottom',
  left: 'paragraphDialogSideLeft',
}

const ALIGN_KEYS: Record<(typeof CELL_VERTICAL_ALIGNS)[number], MessageKey> = {
  top: 'cellPropertiesVerticalAlignTop',
  middle: 'cellPropertiesVerticalAlignMiddle',
  bottom: 'cellPropertiesVerticalAlignBottom',
  baseline: 'cellPropertiesVerticalAlignBaseline',
}

function setAllSides(length: CssLength | null): BoxSides {
  return { top: length, right: length, bottom: length, left: length }
}

function firstDefinedSide(sides: BoxSides): CssLength | null {
  for (const side of BOX_SIDES) {
    if (sides[side]) return sides[side]
  }
  return null
}

export type CellPropertiesFieldsProps = {
  value: CellPropertiesApply
  disabled?: boolean
  onChange: (next: CellPropertiesApply) => void
}

export function CellPropertiesFields({ value, disabled, onChange }: CellPropertiesFieldsProps) {
  const t = useT()
  const alignId = useId()
  const colSpanId = useId()
  const rowSpanId = useId()
  const [paddingLinked, setPaddingLinked] = useState(() =>
    boxSidesEqual(value.padding, setAllSides(firstDefinedSide(value.padding))),
  )

  useEffect(() => {
    setPaddingLinked(boxSidesEqual(value.padding, setAllSides(firstDefinedSide(value.padding))))
  }, [value.padding])

  return (
    <div className={styles.body}>
      <ColorField
        label={t('paragraphDialogBackgroundColor')}
        noneLabel={t('colorNone')}
        value={value.backgroundColor}
        disabled={disabled}
        onChange={(backgroundColor) => onChange({ ...value, backgroundColor })}
      />
      <ColorField
        label={t('cellPropertiesColor')}
        noneLabel={t('colorNone')}
        value={value.color}
        disabled={disabled}
        onChange={(color) => onChange({ ...value, color })}
      />
      <fieldset className={styles.group}>
        <legend className={styles.label}>{t('paragraphDialogPadding')}</legend>
        <label className={styles.mark}>
          <input
            type="checkbox"
            checked={paddingLinked}
            disabled={disabled}
            onChange={() => {
              const next = !paddingLinked
              setPaddingLinked(next)
              if (next) onChange({ ...value, padding: setAllSides(firstDefinedSide(value.padding)) })
            }}
          />
          {t('paragraphDialogLinkSides')}
        </label>
        <div className={styles.sideGrid}>
          {(paddingLinked ? (['top'] as const) : BOX_SIDES).map((side) => (
            <LengthField
              key={side}
              label={paddingLinked ? t('paragraphDialogPadding') : t(SIDE_KEYS[side])}
              value={value.padding[side]}
              disabled={disabled}
              onChange={(next) => {
                const padding = paddingLinked ? setAllSides(next) : { ...value.padding, [side]: next }
                onChange({ ...value, padding })
              }}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <legend className={styles.label}>{t('paragraphDialogAlignment')}</legend>
        <div className={styles.iconRow} role="radiogroup" aria-label={t('paragraphDialogAlignment')}>
          {CELL_TEXT_ALIGNS.map((align) => {
            const Icon = TEXT_ALIGN_ICONS[align]
            const pressed = (value.textAlign ?? 'left') === align
            return (
              <button
                key={align}
                type="button"
                className={styles.iconButton}
                role="radio"
                aria-checked={pressed}
                aria-label={t(TEXT_ALIGN_KEYS[align])}
                disabled={disabled}
                onClick={() => {
                  onChange({ ...value, textAlign: align === 'left' ? null : align })
                }}
              >
                <Icon />
              </button>
            )
          })}
        </div>
      </fieldset>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={alignId}>
          {t('cellPropertiesVerticalAlign')}
        </label>
        <select
          id={alignId}
          className={styles.select}
          value={value.verticalAlign ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const raw = event.target.value
            onChange({
              ...value,
              verticalAlign: raw ? (raw as CellPropertiesApply['verticalAlign']) : null,
            })
          }}
        >
          <option value="">{t('cellPropertiesVerticalAlignDefault')}</option>
          {CELL_VERTICAL_ALIGNS.map((item) => (
            <option key={item} value={item}>
              {t(ALIGN_KEYS[item])}
            </option>
          ))}
        </select>
      </div>
      <LengthField
        label={t('cellPropertiesWidth')}
        value={value.width}
        disabled={disabled}
        onChange={(width) => onChange({ ...value, width })}
      />
      <div className={styles.sizeRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={colSpanId}>
            {t('cellPropertiesColSpan')}
          </label>
          <input
            id={colSpanId}
            className={styles.lengthInput}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={value.colSpan}
            disabled={disabled}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10)
              onChange({ ...value, colSpan: Number.isFinite(parsed) ? Math.max(1, parsed) : 1 })
            }}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={rowSpanId}>
            {t('cellPropertiesRowSpan')}
          </label>
          <input
            id={rowSpanId}
            className={styles.lengthInput}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={value.rowSpan}
            disabled={disabled}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10)
              onChange({ ...value, rowSpan: Number.isFinite(parsed) ? Math.max(1, parsed) : 1 })
            }}
          />
        </div>
      </div>
    </div>
  )
}
