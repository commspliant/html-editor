import { useId, useState } from 'react'
import type { ImageDialogTab, ImagePropertiesApply } from '../../core/commandTypes'
import {
  BORDER_STYLES,
  BOX_SIDES,
  boxSidesEqual,
  type BorderStyle,
  type BoxSide,
  type BoxSides,
  type CssLength,
  type ParagraphShadow,
} from '../../core/paragraphBox'
import {
  ensureSizeForObjectFit,
  type ImageAlign,
  type ImageSizeMode,
} from '../../core/imageProperties'
import { scaleLockedSize, type ImageSizeLength } from '../../core/imageSize'
import { formatFontSizeNumber } from '../../core/fontSizeUnits'
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { ColorField } from '../format/ColorField'
import { LengthField } from '../format/LengthField'
import { ShadowFields } from '../format/ShadowFields'
import styles from '../format/FontPropertiesDialog.module.css'
import { ImageSizeField } from './ImageSizeField'
import { ImageAdvancedFields } from './ImageAdvancedFields'
import { IMAGE_PROPERTIES_TABS } from './imagePropertiesDialog'

const ALIGN_ICONS: Record<ImageAlign, typeof AlignLeftIcon> = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
}

const ALIGN_VALUES: ImageAlign[] = ['left', 'center', 'right']

const ALIGN_KEYS: Record<ImageAlign, MessageKey> = {
  left: 'commandAlignLeftAria',
  center: 'commandAlignCenterAria',
  right: 'commandAlignRightAria',
}

const SIZE_MODES: ImageSizeMode[] = ['width', 'height', 'lock']

const SIZE_MODE_KEYS: Record<ImageSizeMode, MessageKey> = {
  width: 'imagePropertiesSizeWidth',
  height: 'imagePropertiesSizeHeight',
  lock: 'imagePropertiesSizeLock',
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

const DEFAULT_BORDER_WIDTH: CssLength = { value: 1, unit: 'pt' }

const DEFAULT_SHADOW: ParagraphShadow = {
  offsetX: { value: 0, unit: 'px' },
  offsetY: { value: 4, unit: 'px' },
  blur: { value: 8, unit: 'px' },
  spread: { value: 0, unit: 'px' },
  color: '#000000',
  inset: false,
}

export type ImagePropertiesFieldsProps = {
  tab: ImageDialogTab
  value: ImagePropertiesApply
  aspectRatio: number
  disabled?: boolean
  onTabChange: (tab: ImageDialogTab) => void
  onChange: (next: ImagePropertiesApply) => void
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

export function ImagePropertiesFields({
  tab,
  value,
  aspectRatio,
  disabled,
  onTabChange,
  onChange,
}: ImagePropertiesFieldsProps) {
  const t = useT()
  const borderStyleId = useId()
  const rotateId = useId()
  const hoverId = useId()
  const [marginLinked, setMarginLinked] = useState(() =>
    boxSidesEqual(value.margin, setAllSides(value.margin.top)),
  )
  const centerAlign = value.align === 'center'

  const changeSize = (side: 'width' | 'height', next: ImageSizeLength | null) => {
    if (value.sizeMode === 'lock' && next) {
      const locked = scaleLockedSize(side, next, aspectRatio)
      onChange({ ...value, width: locked.width, height: locked.height })
      return
    }
    onChange({ ...value, [side]: next })
  }

  const changeSizeMode = (sizeMode: ImageSizeMode) => {
    if (sizeMode === 'width') {
      onChange({ ...value, sizeMode, height: null })
      return
    }
    if (sizeMode === 'height') {
      onChange({ ...value, sizeMode, width: null })
      return
    }
    if (value.width) {
      const locked = scaleLockedSize('width', value.width, aspectRatio)
      onChange({ ...value, sizeMode, width: locked.width, height: locked.height })
      return
    }
    if (value.height) {
      const locked = scaleLockedSize('height', value.height, aspectRatio)
      onChange({ ...value, sizeMode, width: locked.width, height: locked.height })
      return
    }
    onChange({ ...value, sizeMode })
  }

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label={t('imagePropertiesDialogTitle')}>
        {IMAGE_PROPERTIES_TABS.map((item) => (
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
          <fieldset className={styles.group}>
            <legend className={styles.label}>{t('imagePropertiesSize')}</legend>
            <div className={styles.iconRow} role="radiogroup" aria-label={t('imagePropertiesSizeMode')}>
              {SIZE_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={styles.action}
                  role="radio"
                  aria-checked={value.sizeMode === mode}
                  disabled={disabled}
                  onClick={() => changeSizeMode(mode)}
                >
                  {t(SIZE_MODE_KEYS[mode])}
                </button>
              ))}
            </div>
            <ImageSizeField
              label={t('imagePropertiesWidth')}
              inputAria={t('imagePropertiesWidthAria')}
              value={value.width}
              disabled={disabled || value.sizeMode === 'height'}
              onChange={(width) => changeSize('width', width)}
            />
            <ImageSizeField
              label={t('imagePropertiesHeight')}
              inputAria={t('imagePropertiesHeightAria')}
              value={value.height}
              disabled={disabled || value.sizeMode === 'width'}
              onChange={(height) => changeSize('height', height)}
            />
          </fieldset>
        ) : null}
        {tab === 'alignment' ? (
          <fieldset className={styles.group}>
            <legend className={styles.label}>{t('paragraphDialogAlignment')}</legend>
            <div className={styles.iconRow} role="radiogroup" aria-label={t('paragraphDialogAlignment')}>
              {ALIGN_VALUES.map((align) => {
                const Icon = ALIGN_ICONS[align]
                return (
                  <button
                    key={align}
                    type="button"
                    className={styles.iconButton}
                    role="radio"
                    aria-checked={value.align === align}
                    aria-label={t(ALIGN_KEYS[align])}
                    disabled={disabled}
                    onClick={() => {
                      onChange({ ...value, align: value.align === align ? null : align })
                    }}
                  >
                    <Icon />
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : null}
        {tab === 'border' ? (
          <>
            <fieldset className={styles.group}>
              <legend className={styles.label}>{t('paragraphDialogMargin')}</legend>
              <label className={styles.mark}>
                <input
                  type="checkbox"
                  checked={marginLinked}
                  disabled={disabled || centerAlign}
                  onChange={() => {
                    const next = !marginLinked
                    setMarginLinked(next)
                    if (next) {
                      onChange({ ...value, margin: setAllSides(firstDefinedSide(value.margin)) })
                    }
                  }}
                />
                {t('paragraphDialogLinkSides')}
              </label>
              <div className={styles.sideGrid}>
                {(marginLinked ? (['top'] as const) : BOX_SIDES).map((side) => (
                  <LengthField
                    key={side}
                    label={marginLinked ? t('paragraphDialogMargin') : t(SIDE_KEYS[side])}
                    value={value.margin[side]}
                    disabled={disabled || (centerAlign && (side === 'left' || side === 'right'))}
                    allowNegative
                    onChange={(next) => {
                      const sides = marginLinked
                        ? setAllSides(next)
                        : { ...value.margin, [side]: next }
                      onChange({ ...value, margin: sides })
                    }}
                  />
                ))}
              </div>
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
                    onChange={(width) => {
                      onChange({ ...value, border: { ...value.border, width } })
                    }}
                  />
                  <ColorField
                    label={t('paragraphDialogBorderColor')}
                    noneLabel={t('colorNone')}
                    value={value.border.color}
                    disabled={disabled}
                    onChange={(color) => {
                      onChange({ ...value, border: { ...value.border, color } })
                    }}
                  />
                </>
              ) : null}
              <LengthField
                label={t('paragraphDialogBorderRadius')}
                value={value.borderRadius}
                disabled={disabled}
                onChange={(borderRadius) => {
                  onChange({ ...value, borderRadius })
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
                    onChange({ ...value, boxShadow })
                  }}
                />
              ) : null}
            </fieldset>
          </>
        ) : null}
        {tab === 'advanced' ? (
          <>
            <ImageAdvancedFields
              value={{
                opacity: value.opacity,
                fit: value.objectFit,
                position: value.objectPosition,
              }}
              disabled={disabled}
              onChange={(next) => {
                onChange(
                  ensureSizeForObjectFit(
                    {
                      ...value,
                      opacity: next.opacity,
                      objectFit: next.fit,
                      objectPosition: next.position,
                    },
                    aspectRatio,
                  ),
                )
              }}
            />
            <fieldset className={styles.group}>
              <legend className={styles.label}>{t('imagePropertiesRotation')}</legend>
              <div className={styles.field}>
                <div className={styles.lengthRow}>
                  <input
                    id={rotateId}
                    className={styles.lengthInput}
                    value={value.rotateDeg === null ? '' : formatFontSizeNumber(value.rotateDeg)}
                    disabled={disabled}
                    inputMode="decimal"
                    aria-label={t('imagePropertiesRotation')}
                    onChange={(event) => {
                      const raw = event.target.value.trim()
                      if (!raw) {
                        onChange({ ...value, rotateDeg: null })
                        return
                      }
                      const parsed = Number(raw.replace(',', '.'))
                      if (!Number.isFinite(parsed)) return
                      onChange({ ...value, rotateDeg: parsed })
                    }}
                  />
                  <span className={styles.lengthUnit} aria-hidden="true">
                    {t('imagePropertiesRotationUnit')}
                  </span>
                </div>
              </div>
            </fieldset>
          </>
        ) : null}
        {tab === 'hover' ? (
          <fieldset className={styles.group}>
            <legend className={styles.label}>{t('imagePropertiesTabHover')}</legend>
            <p className={styles.emptyHint}>{t('imagePropertiesHoverHelp')}</p>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={hoverId}>
                {t('imagePropertiesHoverCss')}
              </label>
              <textarea
                id={hoverId}
                className={styles.textarea}
                value={value.hoverCss}
                disabled={disabled}
                spellCheck={false}
                aria-label={t('imagePropertiesHoverCssAria')}
                onChange={(event) => {
                  onChange({ ...value, hoverCss: event.target.value })
                }}
              />
            </div>
          </fieldset>
        ) : null}
      </div>
    </>
  )
}
