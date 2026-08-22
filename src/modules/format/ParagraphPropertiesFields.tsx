import { useEffect, useId, useState } from 'react'
import type { ParagraphDialogTab, ParagraphPropertiesApply } from '../../core/commandTypes'
import type { PageBackgroundImageApply } from '../../core/pageBackgroundImage'
import { DEFAULT_LENGTH_UNIT, parseCssLengthInput } from '../../core/cssLength'
import { formatFontSizeNumber, type FontSizeUnit } from '../../core/fontSizeUnits'
import {
  BORDER_STYLES,
  BOX_SIDES,
  boxSidesEqual,
  opacityToPercent,
  percentToOpacity,
  type BorderStyle,
  type BoxSide,
  type BoxSides,
  type BreakBeforeAfterValue,
  type BreakInsideValue,
  type CssLength,
  type LineHeightValue,
  type ParagraphShadow,
} from '../../core/paragraphBox'
import {
  BREAK_BEFORE_AFTER_VALUES,
  BREAK_INSIDE_VALUES,
} from '../../core/paragraphBreak'
import { TEXT_ALIGN_VALUES, type TextAlign } from '../../core/textAlign'
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BulletListIcon,
  NumberedListIcon,
} from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { ColorField } from './ColorField'
import { LengthField } from './LengthField'
import { ShadowFields } from './ShadowFields'
import { PARAGRAPH_DIALOG_TABS } from './paragraphDialog'
import { PAGE_DIALOG_TABS } from './pageDialog'
import { PageBackgroundImageFields } from './PageBackgroundImageFields'
import styles from './FontPropertiesDialog.module.css'
import type { CustomImagePicker } from '../../types'

const ALIGN_ICONS: Record<TextAlign, typeof AlignLeftIcon> = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
  justify: AlignJustifyIcon,
}

const ALIGN_KEYS: Record<TextAlign, { aria: MessageKey }> = {
  left: { aria: 'commandAlignLeftAria' },
  center: { aria: 'commandAlignCenterAria' },
  right: { aria: 'commandAlignRightAria' },
  justify: { aria: 'commandAlignJustifyAria' },
}

const SIDE_KEYS: Record<BoxSide, MessageKey> = {
  top: 'paragraphDialogSideTop',
  right: 'paragraphDialogSideRight',
  bottom: 'paragraphDialogSideBottom',
  left: 'paragraphDialogSideLeft',
}

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

const UNIT_KEYS: Record<FontSizeUnit, MessageKey> = {
  pt: 'fontSizeUnitPt',
  px: 'fontSizeUnitPx',
  em: 'fontSizeUnitEm',
  rem: 'fontSizeUnitRem',
  '%': 'fontSizeUnitPercent',
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

const BREAK_INSIDE_OPTION_KEYS: Record<BreakInsideValue, MessageKey> = {
  auto: 'paragraphDialogBreakAuto',
  avoid: 'paragraphDialogBreakAvoid',
}

const BREAK_BEFORE_AFTER_OPTION_KEYS: Record<BreakBeforeAfterValue, MessageKey> = {
  auto: 'paragraphDialogBreakAuto',
  avoid: 'paragraphDialogBreakAvoid',
  page: 'paragraphDialogBreakPage',
}

export type ParagraphPropertiesFieldsProps = {
  tab: ParagraphDialogTab
  value: ParagraphPropertiesApply
  disabled?: boolean
  tabs?: ParagraphDialogTab[]
  tablistLabelKey?: MessageKey
  backgroundImage?: PageBackgroundImageApply
  customImagePicker?: CustomImagePicker
  onCustomImagePick?: () => void
  onBackgroundImageChange?: (next: PageBackgroundImageApply) => void
  onTabChange: (tab: ParagraphDialogTab) => void
  onChange: (next: ParagraphPropertiesApply) => void
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

function mergedDialogTabs() {
  const merged = [...PARAGRAPH_DIALOG_TABS]
  for (const item of PAGE_DIALOG_TABS) {
    if (!merged.some((entry) => entry.id === item.id)) merged.push(item)
  }
  return merged
}

export function ParagraphPropertiesFields({
  tab,
  value,
  disabled,
  tabs,
  tablistLabelKey = 'paragraphDialogTitle',
  backgroundImage,
  customImagePicker,
  onCustomImagePick,
  onBackgroundImageChange,
  onTabChange,
  onChange,
}: ParagraphPropertiesFieldsProps) {
  const t = useT()
  const visibleTabs = tabs
    ? mergedDialogTabs().filter((item) => tabs.includes(item.id))
    : PARAGRAPH_DIALOG_TABS
  const borderStyleId = useId()
  const breakInsideId = useId()
  const breakAfterId = useId()
  const breakBeforeId = useId()
  const [marginLinked, setMarginLinked] = useState(() =>
    boxSidesEqual(value.margin, setAllSides(value.margin.top)),
  )
  const [paddingLinked, setPaddingLinked] = useState(() =>
    boxSidesEqual(value.padding, setAllSides(value.padding.top)),
  )

  const changeSides = (
    kind: 'margin' | 'padding',
    linked: boolean,
    side: BoxSide,
    next: CssLength | null,
  ) => {
    const current = value[kind]
    const sides = linked ? setAllSides(next) : { ...current, [side]: next }
    onChange({
      ...value,
      [kind]: sides,
      [`${kind}Mixed`]: false,
    })
  }

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label={t(tablistLabelKey)}>
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={item.id === tab}
            disabled={!item.implemented}
            onClick={() => onTabChange(item.id)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
      <div className={styles.body} role="tabpanel">
        {tab === 'general' ? (
          <>
            <fieldset className={styles.group}>
              <legend className={styles.label}>{t('paragraphDialogAlignment')}</legend>
              <div className={styles.iconRow} role="radiogroup" aria-label={t('paragraphDialogAlignment')}>
                {TEXT_ALIGN_VALUES.map((align) => {
                  const Icon = ALIGN_ICONS[align]
                  const pressed = !value.alignMixed && value.align === align
                  return (
                    <button
                      key={align}
                      type="button"
                      className={styles.iconButton}
                      role="radio"
                      aria-checked={pressed}
                      aria-label={t(ALIGN_KEYS[align].aria)}
                      disabled={disabled}
                      onClick={() => {
                        onChange({ ...value, align, alignMixed: false })
                      }}
                    >
                      <Icon />
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <fieldset className={styles.group}>
              <legend className={styles.label}>{t('paragraphDialogLists')}</legend>
              <div className={styles.iconRow}>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-pressed={!value.listMixed && value.list === 'ul'}
                  aria-label={t('commandBulletListAria')}
                  disabled={disabled}
                  onClick={() => {
                    const next = !value.listMixed && value.list === 'ul' ? null : 'ul'
                    onChange({ ...value, list: next, listMixed: false })
                  }}
                >
                  <BulletListIcon />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-pressed={!value.listMixed && value.list === 'ol'}
                  aria-label={t('commandNumberedListAria')}
                  disabled={disabled}
                  onClick={() => {
                    const next = !value.listMixed && value.list === 'ol' ? null : 'ol'
                    onChange({ ...value, list: next, listMixed: false })
                  }}
                >
                  <NumberedListIcon />
                </button>
              </div>
            </fieldset>
          </>
        ) : null}
        {tab === 'spacing' ? (
          <fieldset className={styles.group}>
            <legend className={styles.label}>{t('paragraphDialogSpacing')}</legend>
            <BoxSidesFields
              legend={t('paragraphDialogMargin')}
              sides={value.margin}
              linked={marginLinked}
              disabled={disabled}
              allowNegative
              onLinkedChange={(linked) => {
                setMarginLinked(linked)
                if (linked) {
                  onChange({
                    ...value,
                    margin: setAllSides(firstDefinedSide(value.margin)),
                    marginMixed: false,
                  })
                }
              }}
              onSideChange={(side, next) => changeSides('margin', marginLinked, side, next)}
            />
            <BoxSidesFields
              legend={t('paragraphDialogPadding')}
              sides={value.padding}
              linked={paddingLinked}
              disabled={disabled}
              onLinkedChange={(linked) => {
                setPaddingLinked(linked)
                if (linked) {
                  onChange({
                    ...value,
                    padding: setAllSides(firstDefinedSide(value.padding)),
                    paddingMixed: false,
                  })
                }
              }}
              onSideChange={(side, next) => changeSides('padding', paddingLinked, side, next)}
            />
            <LineHeightField
              value={value.lineHeight}
              disabled={disabled}
              onChange={(lineHeight) => {
                onChange({ ...value, lineHeight, lineHeightMixed: false })
              }}
            />
            <fieldset className={styles.nestedGroup}>
              <legend className={styles.subLabel}>{t('paragraphDialogPageBreaks')}</legend>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={breakInsideId}>
                  {t('paragraphDialogBreakInside')}
                </label>
                <select
                  id={breakInsideId}
                  className={styles.select}
                  value={value.breakInsideMixed ? 'auto' : value.breakInside}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange({
                      ...value,
                      breakInside: event.target.value as BreakInsideValue,
                      breakInsideMixed: false,
                    })
                  }}
                >
                  {BREAK_INSIDE_VALUES.map((item) => (
                    <option key={item} value={item}>
                      {t(BREAK_INSIDE_OPTION_KEYS[item])}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={breakAfterId}>
                  {t('paragraphDialogBreakAfter')}
                </label>
                <select
                  id={breakAfterId}
                  className={styles.select}
                  value={value.breakAfterMixed ? 'auto' : value.breakAfter}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange({
                      ...value,
                      breakAfter: event.target.value as BreakBeforeAfterValue,
                      breakAfterMixed: false,
                    })
                  }}
                >
                  {BREAK_BEFORE_AFTER_VALUES.map((item) => (
                    <option key={item} value={item}>
                      {t(BREAK_BEFORE_AFTER_OPTION_KEYS[item])}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={breakBeforeId}>
                  {t('paragraphDialogBreakBefore')}
                </label>
                <select
                  id={breakBeforeId}
                  className={styles.select}
                  value={value.breakBeforeMixed ? 'auto' : value.breakBefore}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange({
                      ...value,
                      breakBefore: event.target.value as BreakBeforeAfterValue,
                      breakBeforeMixed: false,
                    })
                  }}
                >
                  {BREAK_BEFORE_AFTER_VALUES.map((item) => (
                    <option key={item} value={item}>
                      {t(BREAK_BEFORE_AFTER_OPTION_KEYS[item])}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
          </fieldset>
        ) : null}
        {tab === 'border' ? (
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
                    borderMixed: false,
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
                  onChange={(width) => {
                    onChange({
                      ...value,
                      border: { ...value.border, width },
                      borderMixed: false,
                    })
                  }}
                />
                <ColorField
                  label={t('paragraphDialogBorderColor')}
                  noneLabel={t('colorNone')}
                  value={value.border.color}
                  mixed={value.borderMixed}
                  disabled={disabled}
                  onChange={(color) => {
                    onChange({
                      ...value,
                      border: { ...value.border, color },
                      borderMixed: false,
                    })
                  }}
                />
              </>
            ) : null}
            <LengthField
              label={t('paragraphDialogBorderRadius')}
              value={value.borderRadius}
              disabled={disabled}
              onChange={(borderRadius) => {
                onChange({ ...value, borderRadius, radiusMixed: false })
              }}
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
                    shadowMixed: false,
                  })
                }}
              />
              {t('paragraphDialogBoxShadow')}
            </label>
            {value.boxShadow ? (
              <ShadowFields
                shadow={value.boxShadow}
                disabled={disabled}
                onChange={(boxShadow) => {
                  onChange({ ...value, boxShadow, shadowMixed: false })
                }}
              />
            ) : null}
          </fieldset>
        ) : null}
        {tab === 'background' ? (
          <fieldset className={styles.group}>
            <legend className={styles.label}>{t('paragraphDialogTabBackground')}</legend>
            <ColorField
              label={t('paragraphDialogBackgroundColor')}
              noneLabel={t('colorNone')}
              value={value.backgroundColor}
              mixed={value.backgroundMixed}
              disabled={disabled}
              onChange={(color) => {
                onChange({ ...value, backgroundColor: color, backgroundMixed: false })
              }}
            />
            <OpacityField
              value={value.opacity}
              disabled={disabled}
              onChange={(opacity) => {
                onChange({ ...value, opacity, opacityMixed: false })
              }}
            />
          </fieldset>
        ) : null}
        {tab === 'backgroundImage' && backgroundImage && onBackgroundImageChange ? (
          <PageBackgroundImageFields
            value={backgroundImage}
            disabled={disabled}
            customImagePicker={customImagePicker}
            onCustomImagePick={onCustomImagePick}
            onChange={onBackgroundImageChange}
          />
        ) : null}
      </div>
    </>
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

function BoxSidesFields({
  legend,
  sides,
  linked,
  disabled,
  allowNegative = false,
  onLinkedChange,
  onSideChange,
}: {
  legend: string
  sides: BoxSides
  linked: boolean
  disabled?: boolean
  allowNegative?: boolean
  onLinkedChange: (linked: boolean) => void
  onSideChange: (side: BoxSide, next: CssLength | null) => void
}) {
  const t = useT()
  const sidesToShow = linked ? (['top'] as const) : BOX_SIDES
  return (
    <fieldset className={styles.nestedGroup}>
      <legend className={styles.subLabel}>{legend}</legend>
      <label className={styles.mark}>
        <input
          type="checkbox"
          checked={linked}
          disabled={disabled}
          onChange={() => onLinkedChange(!linked)}
        />
        {t('paragraphDialogLinkSides')}
      </label>
      <div className={styles.sideGrid}>
        {sidesToShow.map((side) => (
          <LengthField
            key={side}
            label={linked ? legend : t(SIDE_KEYS[side])}
            value={sides[side]}
            disabled={disabled}
            allowNegative={allowNegative}
            onChange={(next) => onSideChange(side, next)}
          />
        ))}
      </div>
    </fieldset>
  )
}

function LineHeightField({
  value,
  disabled,
  onChange,
}: {
  value: LineHeightValue | null
  disabled?: boolean
  onChange: (next: LineHeightValue | null) => void
}) {
  const t = useT()
  const id = useId()
  const mode = lineHeightMode(value)
  const numberValue =
    value?.kind === 'number' ? value.value : value?.kind === 'length' ? value.value : null
  const [draft, setDraft] = useState(() =>
    numberValue === null ? '' : formatFontSizeNumber(numberValue),
  )
  const unit = value?.kind === 'length' ? value.unit : DEFAULT_LENGTH_UNIT

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {t('paragraphDialogLineHeight')}
      </label>
      <div className={styles.lengthRow}>
        <input
          id={id}
          className={styles.lengthInput}
          value={mode === 'normal' ? '' : draft}
          disabled={disabled || mode === 'normal'}
          inputMode="decimal"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const trimmed = draft.trim()
            if (!trimmed) {
              onChange(null)
              return
            }
            if (mode === 'number' || mode === 'empty') {
              const parsed = Number(trimmed.replace(',', '.'))
              if (!Number.isFinite(parsed) || parsed < 0) {
                setDraft(numberValue === null ? '' : formatFontSizeNumber(numberValue))
                return
              }
              onChange({ kind: 'number', value: parsed })
              setDraft(formatFontSizeNumber(parsed))
              return
            }
            const parsed = parseCssLengthInput(trimmed, unit, false)
            if (!parsed) {
              setDraft(numberValue === null ? '' : formatFontSizeNumber(numberValue))
              return
            }
            onChange({ kind: 'length', value: parsed.value, unit: parsed.unit })
            setDraft(formatFontSizeNumber(parsed.value))
          }}
        />
        <select
          className={styles.lengthUnit}
          value={mode === 'length' ? unit : mode}
          disabled={disabled}
          aria-label={t('paragraphDialogLengthUnitAria')}
          onChange={(event) => {
            const next = event.target.value
            if (next === 'empty') {
              onChange(null)
              setDraft('')
              return
            }
            if (next === 'normal') {
              onChange({ kind: 'normal' })
              setDraft('')
              return
            }
            if (next === 'number') {
              const parsed = Number((draft || '1.5').replace(',', '.'))
              const amount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 1.5
              onChange({ kind: 'number', value: amount })
              setDraft(formatFontSizeNumber(amount))
              return
            }
            const nextUnit = next as FontSizeUnit
            const parsed = parseCssLengthInput(draft || '1', nextUnit, false)
            const amount = parsed?.value ?? 1
            onChange({ kind: 'length', value: amount, unit: nextUnit })
            setDraft(formatFontSizeNumber(amount))
          }}
        >
          <option value="empty"></option>
          <option value="normal">{t('paragraphDialogLineHeightNormal')}</option>
          <option value="number">{t('paragraphDialogLineHeightUnitless')}</option>
          {(['pt', 'px', 'em', 'rem', '%'] as const).map((item) => (
            <option key={item} value={item}>
              {t(UNIT_KEYS[item])}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function lineHeightMode(value: LineHeightValue | null): 'empty' | 'normal' | 'number' | 'length' {
  if (!value) return 'empty'
  if (value.kind === 'normal') return 'normal'
  if (value.kind === 'number') return 'number'
  return 'length'
}
