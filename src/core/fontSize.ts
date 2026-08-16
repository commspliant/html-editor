import {
  isInside,
  restoreTextSelection,
  splitRangeBoundaries,
  textNodesInRange,
  wrapTextWithStyle,
} from './inlineRange'
import {
  clampFontSize,
  DEFAULT_FONT_SIZE_UNIT,
  formatFontSize,
  isFontSizeUnit,
  parseFontSize,
  pxToUnit,
  type FontSizeUnit,
} from './fontSizeUnits'

export type { FontSizeUnit }
export type { ParsedFontSize } from './fontSizeUnits'

export type FontSizeValue = {
  value: number
  unit: FontSizeUnit
}

export type FontSizeQuery = {
  value: number | null
  unit: FontSizeUnit
  mixed: boolean
}

export type PendingFontSize = FontSizeValue | null

function elementFromNode(node: Node): Element | null {
  if (node.nodeType === Node.TEXT_NODE) return node.parentElement
  if (node instanceof Element) return node
  return node.parentElement
}

function authoredFontSize(el: HTMLElement): FontSizeValue | null {
  const raw = el.style.fontSize
  if (!raw) return null
  const parsed = parseFontSize(raw)
  if (!parsed || !isFontSizeUnit(parsed.unit)) return null
  return { value: parsed.value, unit: parsed.unit }
}

export function authoredFontSizeAtNode(root: HTMLElement, node: Node): FontSizeValue | null {
  let current: Node | null = elementFromNode(node)
  while (current && current !== root && current instanceof HTMLElement) {
    const value = authoredFontSize(current)
    if (value) return value
    current = current.parentElement
  }
  return null
}

function computedPxAtNode(node: Node, root: HTMLElement): number {
  const el = elementFromNode(node) ?? root
  const px = parseFloat(getComputedStyle(el).fontSize)
  return Number.isFinite(px) && px > 0 ? px : 16
}

export function emBasePx(root: HTMLElement, node: Node): number {
  let el: Element | null = elementFromNode(node)
  while (el && el !== root) {
    const html = el as HTMLElement
    if (html.style.fontSize) {
      const parent = el.parentElement ?? root
      const px = parseFloat(getComputedStyle(parent).fontSize)
      return Number.isFinite(px) && px > 0 ? px : 16
    }
    el = el.parentElement
  }
  const parent = (elementFromNode(node)?.parentElement ?? root) as HTMLElement
  const px = parseFloat(getComputedStyle(parent).fontSize)
  return Number.isFinite(px) && px > 0 ? px : 16
}

export function rootFontPx(root: HTMLElement): number {
  const px = parseFloat(getComputedStyle(root).fontSize)
  return Number.isFinite(px) && px > 0 ? px : 16
}

export function fontSizeValuesEqual(a: FontSizeValue | null, b: FontSizeValue | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.value === b.value && a.unit === b.unit
}

function emptyQuery(unit: FontSizeUnit = DEFAULT_FONT_SIZE_UNIT): FontSizeQuery {
  return { value: null, unit, mixed: false }
}

export function queryInheritedFontSize(
  root: HTMLElement,
  preferredUnit: FontSizeUnit = DEFAULT_FONT_SIZE_UNIT,
): FontSizeQuery {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return emptyQuery(preferredUnit)
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return emptyQuery(preferredUnit)

  const texts = range.collapsed
    ? []
    : textNodesInRange(range).filter((node) => node.data.length > 0)
  const nodes: Node[] = texts.length > 0 ? texts : [range.startContainer]

  const authored = nodes.map((node) => authoredFontSizeAtNode(root, node))
  const firstAuthored = authored[0]
  const allSameAuthored = authored.every((item) => fontSizeValuesEqual(item, firstAuthored))

  if (allSameAuthored && firstAuthored) {
    return { value: firstAuthored.value, unit: firstAuthored.unit, mixed: false }
  }

  if (authored.every((item) => item === null)) {
    const pxValues = nodes.map((node) => computedPxAtNode(node, root))
    const firstPx = pxValues[0]
    if (pxValues.every((px) => Math.abs(px - firstPx) < 0.05)) {
      const parentPx = emBasePx(root, nodes[0])
      const rootPx = rootFontPx(root)
      return {
        value: pxToUnit(firstPx, preferredUnit, parentPx, rootPx),
        unit: preferredUnit,
        mixed: false,
      }
    }
    return { value: null, unit: preferredUnit, mixed: true }
  }

  return { value: null, unit: preferredUnit, mixed: true }
}

export function queryFontSizeMetrics(root: HTMLElement, node: Node): { parentPx: number; rootPx: number } {
  return {
    parentPx: emBasePx(root, node),
    rootPx: rootFontPx(root),
  }
}

function currentRange(root: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null
  return range
}

export function setFontSizeInDocument(
  root: HTMLElement,
  value: number,
  unit: FontSizeUnit,
): boolean {
  const clamped = clampFontSize(value, unit)
  if (!clamped) return false
  const range = currentRange(root)
  if (!range || range.collapsed) return false

  const css = formatFontSize(clamped.value, clamped.unit)
  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  for (const text of texts) {
    const current = authoredFontSizeAtNode(root, text)
    if (current && current.value === clamped.value && current.unit === clamped.unit) continue
    wrapTextWithStyle(text, (el) => {
      el.style.fontSize = css
    })
  }
  restoreTextSelection(texts)
  return true
}

export function applyPendingFontSize(
  span: HTMLElement,
  pending: FontSizeValue,
): void {
  span.style.fontSize = formatFontSize(pending.value, pending.unit)
}
