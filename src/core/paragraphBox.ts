import {
  clearEmptyStyle,
  collectSelectedBlocks,
  ensureSelectedBlocks,
  withRestoredSelection,
} from './blocks'
import {
  clampNonNegativeLength,
  cssLengthsEqual,
  formatCssLength,
  parseCssLength,
  type CssLength,
} from './cssLength'
import { normalizeCssColor } from './inlineColor'
import { formatFontSizeNumber, roundFontSize, type FontSizeUnit } from './fontSizeUnits'
import {
  breakBeforeAfterValuesEqual,
  breakInsideValuesEqual,
  readParagraphBreak,
  writeBreakAfter,
  writeBreakBefore,
  writeBreakInside,
  type BreakBeforeAfterValue,
  type BreakInsideValue,
} from './paragraphBreak'

export type { BreakBeforeAfterValue, BreakInsideValue } from './paragraphBreak'

export type { CssLength }

export const BOX_SIDES = ['top', 'right', 'bottom', 'left'] as const

export type BoxSide = (typeof BOX_SIDES)[number]

export type BoxSides = Record<BoxSide, CssLength | null>

export type LineHeightValue =
  | { kind: 'normal' }
  | { kind: 'number'; value: number }
  | { kind: 'length'; value: number; unit: FontSizeUnit }

export const BORDER_STYLES = [
  'none',
  'solid',
  'dotted',
  'dashed',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
] as const

export type BorderStyle = (typeof BORDER_STYLES)[number]

export type ParagraphBorder = {
  style: BorderStyle
  width: CssLength | null
  color: string | null
}

export type ParagraphShadow = {
  offsetX: CssLength
  offsetY: CssLength
  blur: CssLength
  spread: CssLength
  color: string | null
  inset: boolean
}

export type ParagraphBox = {
  margin: BoxSides
  padding: BoxSides
  lineHeight: LineHeightValue | null
  border: ParagraphBorder
  borderRadius: CssLength | null
  boxShadow: ParagraphShadow | null
  backgroundColor: string | null
  opacity: number | null
  breakInside: BreakInsideValue
  breakAfter: BreakBeforeAfterValue
  breakBefore: BreakBeforeAfterValue
}

export type ParagraphBoxApply = {
  margin: BoxSides
  marginMixed: boolean
  padding: BoxSides
  paddingMixed: boolean
  lineHeight: LineHeightValue | null
  lineHeightMixed: boolean
  border: ParagraphBorder
  borderMixed: boolean
  borderRadius: CssLength | null
  radiusMixed: boolean
  boxShadow: ParagraphShadow | null
  shadowMixed: boolean
  backgroundColor: string | null
  backgroundMixed: boolean
  opacity: number | null
  opacityMixed: boolean
  breakInside: BreakInsideValue
  breakInsideMixed: boolean
  breakAfter: BreakBeforeAfterValue
  breakAfterMixed: boolean
  breakBefore: BreakBeforeAfterValue
  breakBeforeMixed: boolean
}

export const EMPTY_BOX_SIDES: BoxSides = {
  top: null,
  right: null,
  bottom: null,
  left: null,
}

export const EMPTY_BORDER: ParagraphBorder = {
  style: 'none',
  width: null,
  color: null,
}

const BORDER_STYLE_SET = new Set<string>(BORDER_STYLES)

const ZERO_PX: CssLength = { value: 0, unit: 'px' }

export function emptyParagraphBox(): ParagraphBox {
  return {
    margin: { ...EMPTY_BOX_SIDES },
    padding: { ...EMPTY_BOX_SIDES },
    lineHeight: null,
    border: { ...EMPTY_BORDER },
    borderRadius: null,
    boxShadow: null,
    backgroundColor: null,
    opacity: null,
    breakInside: 'auto',
    breakAfter: 'auto',
    breakBefore: 'auto',
  }
}

export function emptyParagraphBoxApply(): ParagraphBoxApply {
  const box = emptyParagraphBox()
  return {
    margin: box.margin,
    marginMixed: false,
    padding: box.padding,
    paddingMixed: false,
    lineHeight: box.lineHeight,
    lineHeightMixed: false,
    border: box.border,
    borderMixed: false,
    borderRadius: box.borderRadius,
    radiusMixed: false,
    boxShadow: box.boxShadow,
    shadowMixed: false,
    backgroundColor: box.backgroundColor,
    backgroundMixed: false,
    opacity: box.opacity,
    opacityMixed: false,
    breakInside: box.breakInside,
    breakInsideMixed: false,
    breakAfter: box.breakAfter,
    breakAfterMixed: false,
    breakBefore: box.breakBefore,
    breakBeforeMixed: false,
  }
}

export function boxSidesEqual(a: BoxSides, b: BoxSides): boolean {
  return BOX_SIDES.every((side) => cssLengthsEqual(a[side], b[side]))
}

export function lineHeightsEqual(
  a: LineHeightValue | null,
  b: LineHeightValue | null,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (a.kind !== b.kind) return false
  if (a.kind === 'normal' || b.kind === 'normal') return true
  if (a.kind === 'number' && b.kind === 'number') return a.value === b.value
  return a.kind === 'length' && b.kind === 'length' && a.value === b.value && a.unit === b.unit
}

export function bordersEqual(a: ParagraphBorder, b: ParagraphBorder): boolean {
  return a.style === b.style && cssLengthsEqual(a.width, b.width) && a.color === b.color
}

export function shadowsEqual(
  a: ParagraphShadow | null,
  b: ParagraphShadow | null,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    cssLengthsEqual(a.offsetX, b.offsetX) &&
    cssLengthsEqual(a.offsetY, b.offsetY) &&
    cssLengthsEqual(a.blur, b.blur) &&
    cssLengthsEqual(a.spread, b.spread) &&
    a.color === b.color &&
    a.inset === b.inset
  )
}

export function paragraphBoxesEqual(a: ParagraphBox, b: ParagraphBox): boolean {
  return (
    boxSidesEqual(a.margin, b.margin) &&
    boxSidesEqual(a.padding, b.padding) &&
    lineHeightsEqual(a.lineHeight, b.lineHeight) &&
    bordersEqual(a.border, b.border) &&
    cssLengthsEqual(a.borderRadius, b.borderRadius) &&
    shadowsEqual(a.boxShadow, b.boxShadow) &&
    a.backgroundColor === b.backgroundColor &&
    a.opacity === b.opacity &&
    breakInsideValuesEqual(a.breakInside, b.breakInside) &&
    breakBeforeAfterValuesEqual(a.breakAfter, b.breakAfter) &&
    breakBeforeAfterValuesEqual(a.breakBefore, b.breakBefore)
  )
}

export function formatLineHeight(value: LineHeightValue): string {
  if (value.kind === 'normal') return 'normal'
  if (value.kind === 'number') return formatFontSizeNumber(value.value)
  return formatCssLength({ value: value.value, unit: value.unit })
}

export function parseOpacity(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.endsWith('%')) {
    const percent = Number(trimmed.slice(0, -1).trim().replace(',', '.'))
    if (!Number.isFinite(percent)) return null
    return clampOpacity(percent / 100)
  }
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return null
  return clampOpacity(value)
}

export function clampOpacity(value: number): number {
  return roundFontSize(Math.min(1, Math.max(0, value)))
}

export function opacityToPercent(value: number): number {
  return roundFontSize(clampOpacity(value) * 100)
}

export function percentToOpacity(percent: number): number {
  return clampOpacity(percent / 100)
}

export function formatOpacity(value: number): string {
  return formatFontSizeNumber(clampOpacity(value))
}

export function parseLineHeight(raw: string): LineHeightValue | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.toLowerCase() === 'normal') return { kind: 'normal' }
  if (/^[+]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) {
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value < 0) return null
    return { kind: 'number', value: roundFontSize(value) }
  }
  const length = parseCssLength(trimmed)
  if (!length || length.value < 0) return null
  return { kind: 'length', value: length.value, unit: length.unit }
}

function splitOutsideParens(raw: string, separator: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  for (const ch of raw) {
    if (ch === '(') {
      depth += 1
      current += ch
      continue
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1)
      current += ch
      continue
    }
    if (ch === separator && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function tokenizeShadow(raw: string): string[] {
  const tokens: string[] = []
  let current = ''
  let depth = 0
  for (const ch of raw) {
    if (ch === '(') {
      depth += 1
      current += ch
      continue
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1)
      current += ch
      continue
    }
    if (/\s/.test(ch) && depth === 0) {
      if (current) tokens.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current) tokens.push(current)
  return tokens
}

export function formatBoxShadow(shadow: ParagraphShadow): string {
  const parts = [
    formatCssLength(shadow.offsetX),
    formatCssLength(shadow.offsetY),
    formatCssLength(shadow.blur),
    formatCssLength(shadow.spread),
  ]
  if (shadow.color) parts.push(shadow.color)
  const body = parts.join(' ')
  return shadow.inset ? `inset ${body}` : body
}

export function parseBoxShadow(raw: string): ParagraphShadow | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.toLowerCase() === 'none') return null
  const first = splitOutsideParens(trimmed, ',')[0]
  if (!first) return null
  const tokens = tokenizeShadow(first)
  let inset = false
  let color: string | null = null
  const lengths: CssLength[] = []
  for (const token of tokens) {
    if (token.toLowerCase() === 'inset') {
      inset = true
      continue
    }
    const length = parseCssLength(token)
    if (length) {
      lengths.push(length)
      continue
    }
    const parsedColor = normalizeCssColor(token)
    if (parsedColor) {
      color = parsedColor
      continue
    }
    return null
  }
  if (lengths.length < 2 || lengths.length > 4) return null
  return {
    offsetX: lengths[0],
    offsetY: lengths[1],
    blur: lengths[2] ?? ZERO_PX,
    spread: lengths[3] ?? ZERO_PX,
    color,
    inset,
  }
}

function readLengthProperty(el: HTMLElement, property: string): CssLength | null {
  return parseCssLength(el.style.getPropertyValue(property))
}

function writeLengthProperty(
  el: HTMLElement,
  property: string,
  length: CssLength | null,
  nonNegative: boolean,
): boolean {
  const next = length && nonNegative ? clampNonNegativeLength(length) : length
  const css = next ? formatCssLength(next) : ''
  const current = el.style.getPropertyValue(property)
  if (current === css) return false
  if (css) el.style.setProperty(property, css)
  else el.style.removeProperty(property)
  return true
}

function readBoxSides(el: HTMLElement, kind: 'margin' | 'padding'): BoxSides {
  return {
    top: readLengthProperty(el, `${kind}-top`),
    right: readLengthProperty(el, `${kind}-right`),
    bottom: readLengthProperty(el, `${kind}-bottom`),
    left: readLengthProperty(el, `${kind}-left`),
  }
}

function writeBoxSides(
  el: HTMLElement,
  kind: 'margin' | 'padding',
  sides: BoxSides,
  nonNegative: boolean,
): boolean {
  let changed = false
  for (const side of BOX_SIDES) {
    if (writeLengthProperty(el, `${kind}-${side}`, sides[side], nonNegative)) changed = true
  }
  return changed
}

function parseBorderStyle(raw: string): BorderStyle {
  const value = raw.trim().toLowerCase()
  if (BORDER_STYLE_SET.has(value)) return value as BorderStyle
  return 'none'
}

function readBorder(el: HTMLElement): ParagraphBorder {
  const style = parseBorderStyle(el.style.borderStyle || el.style.borderTopStyle)
  const width = readLengthProperty(el, 'border-width') ?? readLengthProperty(el, 'border-top-width')
  const colorRaw = el.style.borderColor || el.style.borderTopColor
  const color = colorRaw ? normalizeCssColor(colorRaw) : null
  return { style, width, color }
}

function writeBorder(el: HTMLElement, border: ParagraphBorder): boolean {
  const current = readBorder(el)
  const next: ParagraphBorder =
    border.style === 'none'
      ? { style: 'none', width: null, color: null }
      : {
          style: border.style,
          width: border.width ? clampNonNegativeLength(border.width) : null,
          color: border.color,
        }
  if (bordersEqual(current, next)) return false
  if (next.style === 'none') {
    el.style.removeProperty('border')
    el.style.removeProperty('border-style')
    el.style.removeProperty('border-width')
    el.style.removeProperty('border-color')
    return true
  }
  el.style.borderStyle = next.style
  if (next.width) el.style.borderWidth = formatCssLength(next.width)
  else el.style.removeProperty('border-width')
  if (next.color) el.style.borderColor = next.color
  else el.style.removeProperty('border-color')
  return true
}

function readRadius(el: HTMLElement): CssLength | null {
  const raw = el.style.borderRadius.trim()
  if (!raw) return null
  const first = raw.split(/\s+/)[0]
  return parseCssLength(first)
}

function writeRadius(el: HTMLElement, radius: CssLength | null): boolean {
  const next = radius ? clampNonNegativeLength(radius) : null
  const current = readRadius(el)
  if (cssLengthsEqual(current, next)) return false
  if (next) el.style.borderRadius = formatCssLength(next)
  else el.style.removeProperty('border-radius')
  return true
}

function readShadow(el: HTMLElement): ParagraphShadow | null {
  return parseBoxShadow(el.style.boxShadow)
}

function writeShadow(el: HTMLElement, shadow: ParagraphShadow | null): boolean {
  const current = readShadow(el)
  const next = shadow
    ? {
        ...shadow,
        blur: clampNonNegativeLength(shadow.blur),
      }
    : null
  if (shadowsEqual(current, next)) return false
  if (next) el.style.boxShadow = formatBoxShadow(next)
  else el.style.removeProperty('box-shadow')
  return true
}

function readLineHeight(el: HTMLElement): LineHeightValue | null {
  return parseLineHeight(el.style.lineHeight)
}

function writeLineHeight(el: HTMLElement, value: LineHeightValue | null): boolean {
  const current = readLineHeight(el)
  if (lineHeightsEqual(current, value)) return false
  if (!value) el.style.removeProperty('line-height')
  else el.style.lineHeight = formatLineHeight(value)
  return true
}

function readBackgroundColor(el: HTMLElement): string | null {
  const raw = el.style.backgroundColor
  if (!raw) return null
  return normalizeCssColor(raw)
}

function writeBackgroundColor(el: HTMLElement, color: string | null): boolean {
  const next = color ? normalizeCssColor(color) : null
  const current = readBackgroundColor(el)
  if (current === next) return false
  if (next) el.style.backgroundColor = next
  else el.style.removeProperty('background-color')
  return true
}

function readOpacity(el: HTMLElement): number | null {
  return parseOpacity(el.style.opacity)
}

function writeOpacity(el: HTMLElement, value: number | null): boolean {
  const current = readOpacity(el)
  const next = value === null ? null : clampOpacity(value)
  if (current === next) return false
  if (next === null) el.style.removeProperty('opacity')
  else el.style.opacity = formatOpacity(next)
  return true
}

export function readParagraphBox(el: HTMLElement): ParagraphBox {
  const breaks = readParagraphBreak(el)
  return {
    margin: readBoxSides(el, 'margin'),
    padding: readBoxSides(el, 'padding'),
    lineHeight: readLineHeight(el),
    border: readBorder(el),
    borderRadius: readRadius(el),
    boxShadow: readShadow(el),
    backgroundColor: readBackgroundColor(el),
    opacity: readOpacity(el),
    breakInside: breaks.breakInside,
    breakAfter: breaks.breakAfter,
    breakBefore: breaks.breakBefore,
  }
}

export function writeParagraphBox(el: HTMLElement, draft: ParagraphBoxApply): boolean {
  let changed = false
  if (!draft.marginMixed && writeBoxSides(el, 'margin', draft.margin, false)) changed = true
  if (!draft.paddingMixed && writeBoxSides(el, 'padding', draft.padding, true)) changed = true
  if (!draft.lineHeightMixed && writeLineHeight(el, draft.lineHeight)) changed = true
  if (!draft.borderMixed && writeBorder(el, draft.border)) changed = true
  if (!draft.radiusMixed && writeRadius(el, draft.borderRadius)) changed = true
  if (!draft.shadowMixed && writeShadow(el, draft.boxShadow)) changed = true
  if (!draft.backgroundMixed && writeBackgroundColor(el, draft.backgroundColor)) changed = true
  if (!draft.opacityMixed && writeOpacity(el, draft.opacity)) changed = true
  if (!draft.breakInsideMixed && writeBreakInside(el, draft.breakInside)) changed = true
  if (!draft.breakAfterMixed && writeBreakAfter(el, draft.breakAfter)) changed = true
  if (!draft.breakBeforeMixed && writeBreakBefore(el, draft.breakBefore)) changed = true
  if (changed) clearEmptyStyle(el)
  return changed
}

export function queryParagraphBox(root: HTMLElement): ParagraphBoxApply {
  const empty = emptyParagraphBoxApply()
  const blocks = collectSelectedBlocks(root)
  if (blocks.length === 0) {
    return empty
  }
  const boxes = blocks.map(readParagraphBox)
  const first = boxes[0]
  return {
    margin: first.margin,
    marginMixed: boxes.some((box) => !boxSidesEqual(box.margin, first.margin)),
    padding: first.padding,
    paddingMixed: boxes.some((box) => !boxSidesEqual(box.padding, first.padding)),
    lineHeight: first.lineHeight,
    lineHeightMixed: boxes.some((box) => !lineHeightsEqual(box.lineHeight, first.lineHeight)),
    border: first.border,
    borderMixed: boxes.some((box) => !bordersEqual(box.border, first.border)),
    borderRadius: first.borderRadius,
    radiusMixed: boxes.some((box) => !cssLengthsEqual(box.borderRadius, first.borderRadius)),
    boxShadow: first.boxShadow,
    shadowMixed: boxes.some((box) => !shadowsEqual(box.boxShadow, first.boxShadow)),
    backgroundColor: first.backgroundColor,
    backgroundMixed: boxes.some((box) => box.backgroundColor !== first.backgroundColor),
    opacity: first.opacity,
    opacityMixed: boxes.some((box) => box.opacity !== first.opacity),
    breakInside: first.breakInside,
    breakInsideMixed: boxes.some((box) => !breakInsideValuesEqual(box.breakInside, first.breakInside)),
    breakAfter: first.breakAfter,
    breakAfterMixed: boxes.some(
      (box) => !breakBeforeAfterValuesEqual(box.breakAfter, first.breakAfter),
    ),
    breakBefore: first.breakBefore,
    breakBeforeMixed: boxes.some(
      (box) => !breakBeforeAfterValuesEqual(box.breakBefore, first.breakBefore),
    ),
  }
}

export function applyParagraphBoxInDocument(
  root: HTMLElement,
  draft: ParagraphBoxApply,
): boolean {
  return withRestoredSelection(root, () => {
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false
    let changed = false
    for (const block of blocks) {
      if (writeParagraphBox(block, draft)) changed = true
    }
    return changed
  })
}
