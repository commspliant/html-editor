import { formatFontSizeNumber, roundFontSize } from './fontSizeUnits'

export type ImageSizeUnit = 'pt' | 'px' | 'em' | 'rem' | '%' | 'pc'

export type ImageSizeLength = {
  value: number
  unit: ImageSizeUnit
}

export const IMAGE_SIZE_UNITS: ImageSizeUnit[] = ['%', 'px', 'pt', 'pc', 'em', 'rem']

export const DEFAULT_IMAGE_SIZE_UNIT: ImageSizeUnit = '%'

export const IMAGE_SIZE_PRESETS: Record<ImageSizeUnit, readonly number[]> = {
  '%': [25, 50, 75, 100, 125, 150, 200],
  px: [50, 100, 150, 200, 300, 400, 600, 800],
  pt: [36, 48, 72, 96, 144, 192, 288],
  pc: [3, 4, 6, 8, 12, 16, 24],
  em: [2, 4, 6, 8, 12, 16, 24],
  rem: [2, 4, 6, 8, 12, 16, 24],
}

export const IMAGE_SIZE_LIMITS: Record<ImageSizeUnit, { min: number; max: number }> = {
  '%': { min: 1, max: 1000 },
  px: { min: 1, max: 4000 },
  pt: { min: 1, max: 3000 },
  pc: { min: 0.1, max: 250 },
  em: { min: 0.1, max: 200 },
  rem: { min: 0.1, max: 200 },
}

const SELECTABLE = new Set<string>(IMAGE_SIZE_UNITS)

const SIZE_PATTERN =
  /^([+]?(?:\d+(?:\.\d+)?|\.\d+))\s*(pt|px|em|rem|%|pc)$/i

export function isImageSizeUnit(unit: string): unit is ImageSizeUnit {
  return SELECTABLE.has(unit)
}

export function formatImageSize(length: ImageSizeLength): string {
  return `${formatFontSizeNumber(length.value)}${length.unit}`
}

export function imageSizeLengthsEqual(
  a: ImageSizeLength | null,
  b: ImageSizeLength | null,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.value === b.value && a.unit === b.unit
}

export function parseImageSize(raw: string): ImageSizeLength | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.toLowerCase() === 'auto') return null
  const match = trimmed.match(SIZE_PATTERN)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value) || value <= 0) return null
  const unit = match[2] === '%' ? '%' : match[2].toLowerCase()
  if (!isImageSizeUnit(unit)) return null
  return clampImageSize(value, unit)
}

export function parseImageSizeInput(
  raw: string,
  fallbackUnit: ImageSizeUnit,
): ImageSizeLength | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parseImageSize(trimmed)
  if (parsed) return parsed
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return null
  return clampImageSize(value, fallbackUnit)
}

export function clampImageSize(value: number, unit: ImageSizeUnit): ImageSizeLength | null {
  if (!Number.isFinite(value) || value <= 0) return null
  const { min, max } = IMAGE_SIZE_LIMITS[unit]
  return { value: roundFontSize(Math.min(max, Math.max(min, value))), unit }
}

export function scaleLockedSize(
  changed: 'width' | 'height',
  length: ImageSizeLength,
  aspectRatio: number,
): { width: ImageSizeLength; height: ImageSizeLength } {
  const aspect = aspectRatio > 0 ? aspectRatio : 1
  if (changed === 'width') {
    const height = clampImageSize(length.value / aspect, length.unit) ?? length
    return { width: length, height }
  }
  const width = clampImageSize(length.value * aspect, length.unit) ?? length
  return { width, height: length }
}
