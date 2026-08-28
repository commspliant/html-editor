import type { CssLength } from './cssLength'
import { roundFontSize } from './fontSizeUnits'

export const CSS_PX_PER_INCH = 96
export const MM_PER_INCH = 25.4
export const CSS_PX_PER_MM = CSS_PX_PER_INCH / MM_PER_INCH
export const CSS_PX_PER_CM = CSS_PX_PER_MM * 10
export const POINTS_PER_INCH = 72

export type RulerUnit = 'in' | 'cm' | 'mm' | 'pt' | 'px'

export type RulerTick = {
  positionPx: number
  unitValue: number
  major: boolean
  label?: string
  height: number
}

const EXTENDED_LENGTH_PATTERN =
  /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(in|cm|mm|pt|px|em|rem|%)$/i

export function parseFlexibleCssLength(raw: string): { value: number; unit: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^[+-]?0(?:\.0+)?$/.test(trimmed)) return { value: 0, unit: 'px' }
  const match = trimmed.match(EXTENDED_LENGTH_PATTERN)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  return { value: roundFontSize(value), unit: match[2].toLowerCase() }
}

/** Convert a length in CSS pixels to any supported CSS length unit string or number */
export function pxToUnit(px: number, unit: RulerUnit): number {
  switch (unit) {
    case 'in':
      return px / CSS_PX_PER_INCH
    case 'cm':
      return px / CSS_PX_PER_CM
    case 'mm':
      return px / CSS_PX_PER_MM
    case 'pt':
      return (px / CSS_PX_PER_INCH) * POINTS_PER_INCH
    case 'px':
    default:
      return px
  }
}

/** Convert a value in given unit to CSS pixels */
export function unitToPx(value: number, unit: RulerUnit | string): number {
  switch (unit) {
    case 'in':
      return value * CSS_PX_PER_INCH
    case 'cm':
      return value * CSS_PX_PER_CM
    case 'mm':
      return value * CSS_PX_PER_MM
    case 'pt':
      return (value / POINTS_PER_INCH) * CSS_PX_PER_INCH
    case 'em':
    case 'rem':
      return value * 16 // standard baseline
    case 'px':
    default:
      return value
  }
}

/** Parse any CssLength or string length into CSS pixels */
export function parseLengthToPx(length: CssLength | string | null | undefined, fallbackPx = 0): number {
  if (!length) return fallbackPx
  const parsed = typeof length === 'string' ? parseFlexibleCssLength(length) : length
  if (!parsed || !Number.isFinite(parsed.value)) return fallbackPx
  return unitToPx(parsed.value, parsed.unit)
}

/** Format pixels to a clean CSS length object in the target unit */
export function pxToCssLength(px: number, unit: RulerUnit = 'in'): CssLength {
  const val = pxToUnit(px, unit)
  const rounded = Math.round(val * 1000) / 1000
  return { value: rounded, unit: unit as CssLength['unit'] }
}

/** Convert document px to pt for @page margin storage (round-trips parseCssLength). */
export function pxToMarginCssLength(px: number): CssLength {
  const pt = pxToUnit(px, 'pt')
  return { value: Math.round(pt * 1000) / 1000, unit: 'pt' }
}

/** Format a measurement for live tooltip display (e.g. 1.25 in or 3.2 cm) */
export function formatMeasurement(px: number, unit: RulerUnit = 'in'): string {
  const val = pxToUnit(px, unit)
  const precision = unit === 'in' ? 2 : unit === 'cm' ? 1 : 0
  return `${val.toFixed(precision)} ${unit}`
}

/** Snap a pixel position to standard intervals (0.125in or 2.5mm) unless altKey is pressed */
export function snapRulerPosition(
  px: number,
  unit: RulerUnit = 'in',
  altKey = false,
  originPx = 0,
): number {
  if (altKey) return px

  const relativePx = px - originPx
  const stepUnit = unit === 'in' ? 0.125 : unit === 'cm' ? 0.25 : unit === 'mm' ? 2.5 : 10
  const stepPx = unitToPx(stepUnit, unit)
  if (stepPx <= 0) return px

  const snappedRelativePx = Math.round(relativePx / stepPx) * stepPx
  return originPx + snappedRelativePx
}

/** Generate tick marks for a ruler of a given pixel length */
export function generateRulerTicks(
  totalLengthPx: number,
  zeroOffsetPx: number,
  unit: RulerUnit = 'in',
): RulerTick[] {
  const ticks: RulerTick[] = []
  if (totalLengthPx <= 0) return ticks

  const isInch = unit === 'in'
  const stepUnit = isInch ? 0.125 : 0.1
  const stepPx = unitToPx(stepUnit, unit)

  if (stepPx <= 0) return ticks

  const minUnit = -pxToUnit(zeroOffsetPx, unit)
  const maxUnit = pxToUnit(totalLengthPx - zeroOffsetPx, unit)

  const startStep = Math.floor(minUnit / stepUnit)
  const endStep = Math.ceil(maxUnit / stepUnit)

  for (let s = startStep; s <= endStep; s++) {
    const curUnit = s * stepUnit
    const posPx = zeroOffsetPx + unitToPx(curUnit, unit)

    if (posPx < 0 || posPx > totalLengthPx) continue

    const wholeUnit = Math.round(curUnit)
    const isMajor = Math.abs(curUnit - wholeUnit) < 0.001
    const isHalf = isInch ? Math.abs(curUnit - (Math.floor(curUnit) + 0.5)) < 0.001 : false
    const isQuarter = isInch ? (Math.abs(curUnit - (Math.floor(curUnit) + 0.25)) < 0.001 || Math.abs(curUnit - (Math.floor(curUnit) + 0.75)) < 0.001) : false

    let height = 4
    if (isMajor) height = 10
    else if (isHalf) height = 7
    else if (isQuarter) height = 5

    const tick: RulerTick = {
      positionPx: Math.round(posPx),
      unitValue: curUnit,
      major: isMajor,
      height,
    }

    if (isMajor && curUnit >= 0) {
      tick.label = String(Math.abs(wholeUnit))
    }

    ticks.push(tick)
  }

  return ticks
}
