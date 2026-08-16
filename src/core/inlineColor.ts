import {
  isolateNodeInParent,
  isFormattingWrapper,
  isInside,
  restoreTextSelection,
  shouldUnwrapSpan,
  splitRangeBoundaries,
  textNodesInRange,
  unwrapElement,
  wrapTextWithStyle,
} from './inlineRange'

export type InlineColorKind = 'color' | 'backgroundColor'

export type InlineColorQuery = {
  value: string | null
  mixed: boolean
}

/** Outer null = no pending override. `{ value: null }` = pending Automatic / No color. */
export type PendingColor = { value: string | null }

export type PendingInlineColors = {
  color?: PendingColor | null
  backgroundColor?: PendingColor | null
}

function elementFromNode(node: Node): Element | null {
  if (node.nodeType === Node.TEXT_NODE) return node.parentElement
  if (node instanceof Element) return node
  return node.parentElement
}

function parseRgb(raw: string): { r: number; g: number; b: number; a: number } | null {
  const match = raw
    .trim()
    .match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i)
  if (!match) return null
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  const a = match[4] === undefined ? 1 : Number(match[4])
  if (![r, g, b, a].every((n) => Number.isFinite(n))) return null
  return { r, g, b, a }
}

function toHex(r: number, g: number, b: number): string {
  const byte = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

function expandHex(hex: string): string | null {
  const value = hex.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(value)) return value
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  return null
}

const CSS_NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  white: '#ffffff',
  maroon: '#800000',
  red: '#ff0000',
  purple: '#800080',
  fuchsia: '#ff00ff',
  magenta: '#ff00ff',
  green: '#008000',
  lime: '#00ff00',
  olive: '#808000',
  yellow: '#ffff00',
  navy: '#000080',
  blue: '#0000ff',
  teal: '#008080',
  aqua: '#00ffff',
  cyan: '#00ffff',
  orange: '#ffa500',
}

function isAutomaticToken(value: string): boolean {
  const lower = value.trim().toLowerCase()
  return (
    lower === '' ||
    lower === 'transparent' ||
    lower === 'inherit' ||
    lower === 'initial' ||
    lower === 'unset' ||
    lower === 'currentcolor' ||
    lower === 'currentColor'
  )
}

export function normalizeCssColor(raw: string): string | null {
  const value = raw.trim()
  if (!value || isAutomaticToken(value)) return null

  const hex = expandHex(value)
  if (hex) return hex

  const rgb = parseRgb(value)
  if (rgb) {
    if (rgb.a === 0) return null
    return toHex(rgb.r, rgb.g, rgb.b)
  }

  const named = CSS_NAMED_COLORS[value.toLowerCase()]
  if (named) return named

  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#010203'
  try {
    ctx.fillStyle = value
  } catch {
    return null
  }
  const next = String(ctx.fillStyle)
  if (next === '#010203') {
    const asHex = expandHex(value)
    if (asHex === '#010203') return asHex
    const asRgb = parseRgb(value)
    if (asRgb && toHex(asRgb.r, asRgb.g, asRgb.b) === '#010203') return '#010203'
    if (value.trim().toLowerCase() === 'black') return '#000000'
    return null
  }
  if (next.startsWith('#')) return expandHex(next)
  const parsed = parseRgb(next)
  if (!parsed || parsed.a === 0) return null
  return toHex(parsed.r, parsed.g, parsed.b)
}

function authoredColorOnElement(el: HTMLElement, kind: InlineColorKind): string | null {
  const raw = kind === 'color' ? el.style.color : el.style.backgroundColor
  if (!raw) return null
  return normalizeCssColor(raw)
}

export function authoredColorAtNode(
  root: HTMLElement,
  node: Node,
  kind: InlineColorKind,
): string | null {
  let current: Node | null = elementFromNode(node)
  while (current && current !== root && current instanceof HTMLElement) {
    const value = authoredColorOnElement(current, kind)
    if (value) return value
    current = current.parentElement
  }
  return null
}

function elementHasAuthoredColor(el: Element, kind: InlineColorKind): boolean {
  if (!(el instanceof HTMLElement)) return false
  return authoredColorOnElement(el, kind) !== null
}

function removeColorFromElement(el: HTMLElement, kind: InlineColorKind): void {
  if (kind === 'color') {
    el.style.color = ''
    el.style.removeProperty('color')
    return
  }
  el.style.backgroundColor = ''
  el.style.removeProperty('background-color')
}

function applyColorToElement(el: HTMLElement, kind: InlineColorKind, hex: string): void {
  if (kind === 'color') {
    el.style.color = hex
    return
  }
  el.style.backgroundColor = hex
}

function unwrapColorFromText(root: HTMLElement, text: Text, kind: InlineColorKind): void {
  let node: Node = text
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent) || !elementHasAuthoredColor(parent, kind)) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    if (elementHasAuthoredColor(parent, kind)) {
      removeColorFromElement(parent as HTMLElement, kind)
      if (shouldUnwrapSpan(parent as HTMLElement)) {
        unwrapElement(parent)
        continue
      }
    }
    node = parent
  }
}

function currentRange(root: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null
  return range
}

export function queryInheritedInlineColor(
  root: HTMLElement,
  kind: InlineColorKind,
): InlineColorQuery {
  const range = currentRange(root)
  if (!range) return { value: null, mixed: false }

  const texts = range.collapsed
    ? []
    : textNodesInRange(range).filter((node) => node.data.length > 0)
  const nodes: Node[] = texts.length > 0 ? texts : [range.startContainer]
  const values = nodes.map((node) => authoredColorAtNode(root, node, kind))
  const first = values[0] ?? null
  const allSame = values.every((item) => item === first)
  if (allSame) return { value: first, mixed: false }
  return { value: null, mixed: true }
}

export function setInlineColorInDocument(
  root: HTMLElement,
  kind: InlineColorKind,
  value: string | null,
): boolean {
  const range = currentRange(root)
  if (!range || range.collapsed) return false

  const hex = value === null ? null : normalizeCssColor(value)
  if (value !== null && hex === null) return false

  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  for (const text of texts) {
    const current = authoredColorAtNode(root, text, kind)
    if (hex === null) {
      if (current === null) continue
      unwrapColorFromText(root, text, kind)
      continue
    }
    if (current === hex) continue
    wrapTextWithStyle(text, (el) => {
      applyColorToElement(el, kind, hex)
    })
  }
  restoreTextSelection(texts)
  return true
}

export function applyPendingInlineColor(
  span: HTMLElement,
  kind: InlineColorKind,
  pending: PendingColor,
): void {
  if (pending.value === null) {
    removeColorFromElement(span, kind)
    return
  }
  const hex = normalizeCssColor(pending.value)
  if (!hex) return
  applyColorToElement(span, kind, hex)
}

export function hasPendingInlineColors(pending?: PendingInlineColors | null): boolean {
  return Boolean(pending?.color || pending?.backgroundColor)
}

function splitTextAtCaret(range: Range): void {
  const node = range.startContainer
  const offset = range.startOffset
  if (node.nodeType !== Node.TEXT_NODE) return
  const text = node as Text
  if (offset <= 0 || offset >= text.length) return
  const after = text.splitText(offset)
  range.setStart(after, 0)
  range.collapse(true)
}

function insertCaretSpacer(range: Range): Node {
  let insertAt: Node =
    range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0
      ? range.startContainer
      : range.startContainer.childNodes[range.startOffset] ??
        range.startContainer.lastChild ??
        range.startContainer

  if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
    const spacer = document.createTextNode('')
    range.startContainer.parentNode?.insertBefore(
      spacer,
      (range.startContainer as Text).nextSibling,
    )
    return spacer
  }
  if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
    const spacer = document.createTextNode('')
    range.startContainer.parentNode?.insertBefore(spacer, range.startContainer)
    return spacer
  }
  const spacer = document.createTextNode('')
  if (insertAt && insertAt !== range.startContainer) {
    insertAt.parentNode?.insertBefore(spacer, insertAt)
  } else {
    range.startContainer.appendChild(spacer)
  }
  return spacer
}

export function peelInlineColorFromNode(
  root: HTMLElement,
  start: Node,
  kinds: InlineColorKind[],
): Node {
  let node: Node = start
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent) || !kinds.some((kind) => elementHasAuthoredColor(parent, kind))) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    for (const kind of kinds) {
      if (!elementHasAuthoredColor(parent, kind)) continue
      removeColorFromElement(parent as HTMLElement, kind)
    }
    if (shouldUnwrapSpan(parent as HTMLElement)) {
      unwrapElement(parent)
      continue
    }
    node = parent.isConnected ? parent : start
  }
  return start
}

export function breakOutOfInlineColor(
  root: HTMLElement,
  range: Range,
  kinds: InlineColorKind[],
): Node {
  splitTextAtCaret(range)
  const insertAt = insertCaretSpacer(range)
  return peelInlineColorFromNode(root, insertAt, kinds)
}

export function pendingClearKinds(
  root: HTMLElement,
  node: Node,
  pending?: PendingInlineColors | null,
): InlineColorKind[] {
  const kinds: InlineColorKind[] = []
  if (pending?.color && pending.color.value === null && authoredColorAtNode(root, node, 'color')) {
    kinds.push('color')
  }
  if (
    pending?.backgroundColor &&
    pending.backgroundColor.value === null &&
    authoredColorAtNode(root, node, 'backgroundColor')
  ) {
    kinds.push('backgroundColor')
  }
  return kinds
}

