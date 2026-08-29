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

export type FontFace = {
  /** Label in the font picker */
  name: string
  /** CSS font-family value written to inline style */
  family: string
  /** Stylesheet URL (Google Fonts CSS, or a host CSS file with @font-face). */
  css?: string
}

export type FontFamilyQuery = {
  value: string | null
  mixed: boolean
}

/** Outer null = no pending override. `{ value: null }` = pending Default. */
export type PendingFontFamily = { value: string | null } | null

export const FONT_STYLESHEET_ATTR = 'data-wysiwyg-font'

export const WEB_SAFE_FONTS: readonly FontFace[] = [
  { name: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { name: 'Arial Black', family: "'Arial Black', Gadget, sans-serif" },
  { name: 'Comic Sans MS', family: "'Comic Sans MS', Textile, cursive" },
  { name: 'Courier New', family: "'Courier New', Courier, monospace" },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Impact', family: 'Impact, Charcoal, sans-serif' },
  { name: 'Lucida Console', family: "'Lucida Console', Monaco, monospace" },
  { name: 'Lucida Sans Unicode', family: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" },
  { name: 'Palatino Linotype', family: "'Palatino Linotype', Palatino, serif" },
  { name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif' },
  { name: 'Times New Roman', family: "'Times New Roman', Times, serif" },
  { name: 'Trebuchet MS', family: "'Trebuchet MS', Helvetica, sans-serif" },
  { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
]

export function normalizeFontFamily(value: string): string {
  return value
    .split(',')
    .map((part) => part.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean)
    .join(',')
}

export function fontFamiliesEqual(a: string | null, b: string | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return normalizeFontFamily(a) === normalizeFontFamily(b)
}

export function mergeFontFaces(customFonts: readonly FontFace[] = []): FontFace[] {
  const merged: FontFace[] = []
  const seen = new Set<string>()
  for (const font of [...WEB_SAFE_FONTS, ...customFonts]) {
    const family = font.family.trim()
    if (!family) continue
    const key = normalizeFontFamily(family)
    if (seen.has(key)) continue
    seen.add(key)
    const css = font.css?.trim()
    merged.push({
      name: font.name.trim() || family,
      family,
      ...(css ? { css } : {}),
    })
  }
  return merged
}

export function matchFontFace(
  family: string | null,
  fonts: readonly FontFace[],
): FontFace | null {
  if (!family) return null
  return fonts.find((font) => fontFamiliesEqual(font.family, family)) ?? null
}

export function isAllowedFontStylesheetUrl(href: string): boolean {
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function uniqueHrefs(hrefs: readonly string[]): string[] {
  const seen = new Set<string>()
  const next: string[] = []
  for (const href of hrefs) {
    const trimmed = href.trim()
    if (!trimmed || !isAllowedFontStylesheetUrl(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    next.push(trimmed)
  }
  return next
}

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

const FONT_LINK_RE = new RegExp(`<link\\b[^>]*\\b${FONT_STYLESHEET_ATTR}\\b[^>]*>`, 'gi')

export function extractFontStylesheets(html: string): { hrefs: string[]; body: string } {
  if (!html.includes(FONT_STYLESHEET_ATTR)) {
    return { hrefs: [], body: html }
  }
  const hrefs: string[] = []
  const body = html.replace(FONT_LINK_RE, (tag) => {
    const href =
      tag.match(/\bhref\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bhref\s*=\s*'([^']*)'/i)?.[1]
    if (href) hrefs.push(decodeHtmlAttr(href))
    return ''
  })
  return { hrefs: uniqueHrefs(hrefs), body }
}

export function prependFontStylesheets(body: string, hrefs: readonly string[]): string {
  const unique = uniqueHrefs(hrefs)
  if (unique.length === 0) return body
  const tags = unique
    .map(
      (href) =>
        `<link rel="stylesheet" href="${escapeAttr(href)}" ${FONT_STYLESHEET_ATTR}="">`,
    )
    .join('')
  return `${tags}${body}`
}

function authoredFontFamilyOnElement(el: HTMLElement): string | null {
  const raw = el.style.fontFamily.trim()
  return raw || null
}

const FONT_FAMILY_PARSE_CACHE_MAX = 32
const fontFamilyParseCache = new Map<string, boolean>()

function fontFamilyParseCacheKey(html: string, family: string): string {
  return `${normalizeFontFamily(family)}\0${html}`
}

function readFontFamilyParseCache(html: string, family: string): boolean | undefined {
  return fontFamilyParseCache.get(fontFamilyParseCacheKey(html, family))
}

function writeFontFamilyParseCache(html: string, family: string, result: boolean): void {
  const key = fontFamilyParseCacheKey(html, family)
  if (fontFamilyParseCache.size >= FONT_FAMILY_PARSE_CACHE_MAX) {
    const oldest = fontFamilyParseCache.keys().next().value
    if (oldest !== undefined) {
      fontFamilyParseCache.delete(oldest)
    }
  }
  fontFamilyParseCache.set(key, result)
}

export function clearFontFamilyParseCache(): void {
  fontFamilyParseCache.clear()
}

function fontFamilyUsedInElementTree(root: HTMLElement, needle: string): boolean {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let current: Node | null = walker.currentNode
  while (current) {
    if (current instanceof HTMLElement) {
      const authored = authoredFontFamilyOnElement(current)
      if (authored && normalizeFontFamily(authored) === needle) return true
    }
    current = walker.nextNode()
  }
  return false
}

export function fontFamilyUsedInRoot(root: HTMLElement, family: string): boolean {
  const needle = normalizeFontFamily(family)
  if (!needle) return false
  return fontFamilyUsedInElementTree(root, needle)
}

export function fontFamilyUsedInHtml(html: string, family: string): boolean {
  const needle = normalizeFontFamily(family)
  if (!needle) return false
  const cached = readFontFamilyParseCache(html, family)
  if (cached !== undefined) return cached
  // Fast check: the HTML must mention "font-family" or "face" AND contain the primary family name
  const lower = html.toLowerCase()
  if (!lower.includes('font-family') && !lower.includes('face=')) {
    writeFontFamilyParseCache(html, family, false)
    return false
  }
  const primaryName = needle.split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
  if (primaryName && !lower.includes(primaryName)) {
    writeFontFamilyParseCache(html, family, false)
    return false
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const result = fontFamilyUsedInElementTree(doc.body, needle)
  writeFontFamilyParseCache(html, family, result)
  return result
}

export type CollectDocumentFontStylesheetsOptions = {
  liveRoot?: HTMLElement
}

export function collectDocumentFontStylesheets(
  bodyHtml: string,
  previousHtml: string,
  customFonts: readonly FontFace[] = [],
  options?: CollectDocumentFontStylesheetsOptions,
): string[] {
  const previous = extractFontStylesheets(previousHtml).hrefs
  const used = customFonts
    .filter((font) => {
      if (!font.css) return false
      if (options?.liveRoot) {
        return fontFamilyUsedInRoot(options.liveRoot, font.family)
      }
      return fontFamilyUsedInHtml(bodyHtml, font.family)
    })
    .map((font) => font.css ?? '')
  return uniqueHrefs([...previous, ...used])
}

export function collectPreviewFontStylesheets(
  html: string,
  customFonts: readonly FontFace[] = [],
): string[] {
  const fromHtml = extractFontStylesheets(html).hrefs
  const fromCustom = customFonts.map((font) => font.css ?? '')
  return uniqueHrefs([...fromHtml, ...fromCustom])
}

function elementFromNode(node: Node): Element | null {
  if (node.nodeType === Node.TEXT_NODE) return node.parentElement
  if (node instanceof Element) return node
  return node.parentElement
}

export function authoredFontFamilyAtNode(root: HTMLElement, node: Node): string | null {
  let current: Node | null = elementFromNode(node)
  while (current && current !== root && current instanceof HTMLElement) {
    const value = authoredFontFamilyOnElement(current)
    if (value) return value
    current = current.parentElement
  }
  return null
}

function elementHasAuthoredFontFamily(el: Element): boolean {
  return el instanceof HTMLElement && authoredFontFamilyOnElement(el) !== null
}

function removeFontFamilyFromElement(el: HTMLElement): void {
  el.style.fontFamily = ''
  el.style.removeProperty('font-family')
}

function unwrapFontFamilyFromText(root: HTMLElement, text: Text): void {
  let node: Node = text
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent) || !elementHasAuthoredFontFamily(parent)) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    if (elementHasAuthoredFontFamily(parent)) {
      removeFontFamilyFromElement(parent as HTMLElement)
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

export function queryInheritedFontFamily(root: HTMLElement): FontFamilyQuery {
  const range = currentRange(root)
  if (!range) return { value: null, mixed: false }

  const texts = range.collapsed
    ? []
    : textNodesInRange(range).filter((node) => node.data.length > 0)
  const nodes: Node[] = texts.length > 0 ? texts : [range.startContainer]
  const values = nodes.map((node) => authoredFontFamilyAtNode(root, node))
  const first = values[0] ?? null
  const allSame = values.every((item) => fontFamiliesEqual(item, first))
  if (allSame) return { value: first, mixed: false }
  return { value: null, mixed: true }
}

export function setFontFamilyInDocument(root: HTMLElement, family: string | null): boolean {
  const range = currentRange(root)
  if (!range || range.collapsed) return false

  const next = family?.trim() ? family.trim() : null
  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  for (const text of texts) {
    const current = authoredFontFamilyAtNode(root, text)
    if (next === null) {
      if (current === null) continue
      unwrapFontFamilyFromText(root, text)
      continue
    }
    if (fontFamiliesEqual(current, next)) continue
    wrapTextWithStyle(text, (el) => {
      el.style.fontFamily = next
    })
  }
  restoreTextSelection(texts)
  return true
}

export function applyPendingFontFamily(span: HTMLElement, pending: PendingFontFamily): void {
  if (!pending) return
  if (pending.value === null) {
    removeFontFamilyFromElement(span)
    return
  }
  span.style.fontFamily = pending.value
}

export function hasPendingFontFamily(pending?: PendingFontFamily): boolean {
  return pending != null
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

export function peelFontFamilyFromNode(root: HTMLElement, start: Node): Node {
  let node: Node = start
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent) || !elementHasAuthoredFontFamily(parent)) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    removeFontFamilyFromElement(parent as HTMLElement)
    if (shouldUnwrapSpan(parent as HTMLElement)) {
      unwrapElement(parent)
      continue
    }
    node = parent.isConnected ? parent : start
  }
  return start
}

export function breakOutOfFontFamily(root: HTMLElement, range: Range): Node {
  splitTextAtCaret(range)
  const insertAt = insertCaretSpacer(range)
  return peelFontFamilyFromNode(root, insertAt)
}

export function pendingClearsFontFamily(
  root: HTMLElement,
  node: Node,
  pending?: PendingFontFamily,
): boolean {
  return Boolean(pending && pending.value === null && authoredFontFamilyAtNode(root, node))
}
