import { currentRange } from './blocks'
import {
  restoreTextSelection,
  shouldUnwrapSpan,
  splitRangeBoundaries,
  textNodesInRange,
  unwrapElement,
  wrapTextWithStyle,
} from './inlineRange'

export type CustomCssQuery = {
  value: string | null
  mixed: boolean
}

function elementFromNode(node: Node): Element | null {
  if (node.nodeType === Node.TEXT_NODE) return node.parentElement
  if (node instanceof Element) return node
  return node.parentElement
}

function normalizePropertyName(name: string): string {
  return name.trim().toLowerCase()
}

export function parseCssDeclarations(cssText: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const part of cssText.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const colon = trimmed.indexOf(':')
    if (colon <= 0) continue
    const prop = normalizePropertyName(trimmed.slice(0, colon))
    const value = trimmed.slice(colon + 1).trim()
    if (prop) result[prop] = value
  }
  return result
}

export function serializeCssDeclarations(declarations: Record<string, string>): string {
  return Object.entries(declarations)
    .filter(([prop]) => prop.trim())
    .map(([prop, value]) => `${prop}: ${value}`)
    .join('; ')
}

export function mergeCssDeclarations(
  existing: Record<string, string>,
  overrides: Record<string, string>,
): Record<string, string> {
  const merged = { ...existing }
  for (const [prop, value] of Object.entries(overrides)) {
    if (!value.trim()) {
      delete merged[prop]
    } else {
      merged[prop] = value
    }
  }
  return merged
}

export function formatCustomCssForDisplay(cssText: string): string {
  const trimmed = cssText.trim()
  if (!trimmed) return ''
  const parts = trimmed
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  return parts.map((part) => `${part};`).join('\n')
}

export function compressCustomCss(input: string): string {
  const declarations = parseCssDeclarations(input)
  return serializeCssDeclarations(declarations)
}

export function authoredCustomCssAtNode(root: HTMLElement, node: Node): string {
  let current: Node | null = elementFromNode(node)
  while (current && current !== root && current instanceof HTMLElement) {
    const cssText = current.style.cssText.trim()
    if (cssText) return cssText
    current = current.parentElement
  }
  return ''
}

export function queryCustomCssAtSelection(root: HTMLElement): CustomCssQuery {
  const range = currentRange(root)
  if (!range) return { value: null, mixed: false }

  const texts = range.collapsed
    ? []
    : textNodesInRange(range).filter((node) => node.data.length > 0)
  const nodes: Node[] = texts.length > 0 ? texts : [range.startContainer]
  const values = nodes.map((node) => authoredCustomCssAtNode(root, node))
  const normalized = values.map((value) => value.trim())
  const first = normalized[0] ?? ''
  const allSame = normalized.every((item) => item === first)
  if (allSame) return { value: first || null, mixed: false }
  return { value: null, mixed: true }
}

function applyMergedCss(el: HTMLElement, overrides: string): void {
  const existing = parseCssDeclarations(el.style.cssText)
  const over = parseCssDeclarations(overrides)
  const merged = mergeCssDeclarations(existing, over)
  const cssText = serializeCssDeclarations(merged)
  if (cssText) {
    el.style.cssText = cssText
  } else {
    el.removeAttribute('style')
  }
}

export function setCustomCssInDocument(root: HTMLElement, css: string): boolean {
  const overrides = compressCustomCss(css)
  if (!overrides) return false

  const range = currentRange(root)
  if (!range || range.collapsed) return false

  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  if (texts.length === 0) return false

  for (const text of texts) {
    wrapTextWithStyle(text, (el) => {
      applyMergedCss(el, overrides)
      if (shouldUnwrapSpan(el)) unwrapElement(el)
    })
  }
  restoreTextSelection(texts)
  return true
}

export function applyPendingCustomCss(span: HTMLElement, css: string): void {
  const overrides = compressCustomCss(css)
  if (!overrides) return
  applyMergedCss(span, overrides)
}

export function hasPendingCustomCss(css: string | null | undefined): boolean {
  return Boolean(css && compressCustomCss(css))
}
