import {
  FONT_SIZE_UNITS,
  formatFontSizeNumber,
  isFontSizeUnit,
  roundFontSize,
  type FontSizeUnit,
} from './fontSizeUnits'

export type CssLength = {
  value: number
  unit: FontSizeUnit
}

export const DEFAULT_LENGTH_UNIT: FontSizeUnit = 'pt'

const LENGTH_PATTERN =
  /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(pt|px|em|rem|%)$/i
const UNITLESS_ZERO = /^[+-]?0(?:\.0+)?$/

export function formatCssLength(length: CssLength): string {
  return `${formatFontSizeNumber(length.value)}${length.unit}`
}

export function parseCssLength(raw: string): CssLength | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (UNITLESS_ZERO.test(trimmed)) return { value: 0, unit: 'px' }
  const match = trimmed.match(LENGTH_PATTERN)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  const unit = match[2] === '%' ? '%' : match[2].toLowerCase()
  if (!isFontSizeUnit(unit)) return null
  return { value: roundFontSize(value), unit }
}

export function parseCssLengthInput(
  raw: string,
  fallbackUnit: FontSizeUnit,
  allowNegative: boolean,
): CssLength | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parseCssLength(trimmed)
  if (parsed) {
    if (!allowNegative && parsed.value < 0) return { ...parsed, value: 0 }
    return parsed
  }
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return null
  if (!allowNegative && value < 0) return { value: 0, unit: fallbackUnit }
  return { value: roundFontSize(value), unit: fallbackUnit }
}

export function clampNonNegativeLength(length: CssLength): CssLength {
  if (length.value >= 0) return length
  return { value: 0, unit: length.unit }
}

export function cssLengthsEqual(a: CssLength | null, b: CssLength | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.value === b.value && a.unit === b.unit
}

export { FONT_SIZE_UNITS as CSS_LENGTH_UNITS }
