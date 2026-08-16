import { useEffect, useId, useState } from 'react'
import { CELL_VERTICAL_ALIGNS } from '../../core/cellProperties'
import type { RowPropertiesApply } from '../../core/rowProperties'
import {
  BOX_SIDES,
  boxSidesEqual,
  type BoxSide,
  type BoxSides,
  type CssLength,
} from '../../core/paragraphBox'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { ColorField } from '../format/ColorField'
import { LengthField } from '../format/LengthField'
import styles from '../format/FontPropertiesDialog.module.css'

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

export type RowPropertiesFieldsProps = {
  value: RowPropertiesApply
  disabled?: boolean
  onChange: (next: RowPropertiesApply) => void
}

export function RowPropertiesFields({ value, disabled, onChange }: RowPropertiesFieldsProps) {
  const t = useT()
  const alignId = useId()
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
              verticalAlign: raw ? (raw as RowPropertiesApply['verticalAlign']) : null,
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
        label={t('rowPropertiesHeight')}
        value={value.height}
        disabled={disabled}
        onChange={(height) => onChange({ ...value, height })}
      />
    </div>
  )
}
