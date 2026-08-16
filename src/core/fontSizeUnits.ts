export type FontSizeUnit = 'pt' | 'px' | 'em' | 'rem' | '%'

export const FONT_SIZE_UNITS: FontSizeUnit[] = ['pt', 'px', 'em', 'rem', '%']

export const DEFAULT_FONT_SIZE_UNIT: FontSizeUnit = 'pt'

export const FONT_SIZE_PRESETS: Record<FontSizeUnit, readonly number[]> = {
  pt: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
  px: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
  em: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3],
  rem: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3],
  '%': [50, 75, 100, 125, 150, 200, 250, 300],
}

export const FONT_SIZE_LIMITS: Record<FontSizeUnit, { min: number; max: number }> = {
  pt: { min: 1, max: 400 },
  px: { min: 1, max: 400 },
  em: { min: 0.1, max: 20 },
  rem: { min: 0.1, max: 20 },
  '%': { min: 1, max: 1000 },
}

const SELECTABLE = new Set<string>(FONT_SIZE_UNITS)

const SIZE_PATTERN =
  /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(pt|px|em|rem|%|pc|cm|mm|in|ex|ch|q|vw|vh|vmin|vmax)$/i

export type ParsedFontSize = {
  value: number
  unit: string
}

export function isFontSizeUnit(unit: string): unit is FontSizeUnit {
  return SELECTABLE.has(unit)
}

export function roundFontSize(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatFontSizeNumber(value: number): string {
  const rounded = roundFontSize(value)
  if (Number.isInteger(rounded)) return String(rounded)
  return String(rounded)
}

export function formatFontSize(value: number, unit: FontSizeUnit): string {
  return `${formatFontSizeNumber(value)}${unit}`
}

export function parseFontSize(raw: string): ParsedFontSize | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const match = trimmed.match(SIZE_PATTERN)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  const unit = match[2] === '%' ? '%' : match[2].toLowerCase()
  return { value, unit }
}

export function parseFontSizeInput(
  raw: string,
  fallbackUnit: FontSizeUnit,
): { value: number; unit: FontSizeUnit } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parseFontSize(trimmed)
  if (parsed) {
    if (!isFontSizeUnit(parsed.unit)) return null
    return clampFontSize(parsed.value, parsed.unit)
  }
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return null
  return clampFontSize(value, fallbackUnit)
}

export function clampFontSize(
  value: number,
  unit: FontSizeUnit,
): { value: number; unit: FontSizeUnit } | null {
  if (!Number.isFinite(value) || value <= 0) return null
  const { min, max } = FONT_SIZE_LIMITS[unit]
  return { value: roundFontSize(Math.min(max, Math.max(min, value))), unit }
}

export function pxToUnit(
  px: number,
  unit: FontSizeUnit,
  parentPx: number,
  rootPx: number,
): number {
  const safeParent = parentPx > 0 ? parentPx : 16
  const safeRoot = rootPx > 0 ? rootPx : 16
  switch (unit) {
    case 'px':
      return roundFontSize(px)
    case 'pt':
      return roundFontSize(px * 0.75)
    case 'em':
      return roundFontSize(px / safeParent)
    case 'rem':
      return roundFontSize(px / safeRoot)
    case '%':
      return roundFontSize((px / safeParent) * 100)
  }
}

export function unitToPx(
  value: number,
  unit: FontSizeUnit,
  parentPx: number,
  rootPx: number,
): number {
  const safeParent = parentPx > 0 ? parentPx : 16
  const safeRoot = rootPx > 0 ? rootPx : 16
  switch (unit) {
    case 'px':
      return value
    case 'pt':
      return value * (4 / 3)
    case 'em':
      return value * safeParent
    case 'rem':
      return value * safeRoot
    case '%':
      return (value / 100) * safeParent
  }
}

export function convertFontSize(
  value: number,
  from: FontSizeUnit,
  to: FontSizeUnit,
  parentPx: number,
  rootPx: number,
): number {
  if (from === to) return roundFontSize(value)
  const px = unitToPx(value, from, parentPx, rootPx)
  return pxToUnit(px, to, parentPx, rootPx)
}
