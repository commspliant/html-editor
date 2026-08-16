import {
  isInside,
  restoreTextSelection,
  splitRangeBoundaries,
  textNodesInRange,
  unwrapElement,
} from './inlineRange'

export type LinkHoverMode = 'color' | 'html'

export type LinkAttrs = {
  href: string
  title: string
  targetBlank: boolean
  textDecorationNone: boolean
  hoverMode: LinkHoverMode
  hoverColor: string | null
  hoverHtml: string
}

export const LINK_HOVER_HTML_ATTR = 'data-hover-html'

const BLANK_REL = 'noopener noreferrer'

const HOVER_HTML_OVER =
  "var n=this._hoverBox;if(!n){n=document.createElement('div');n.style.cssText='position:absolute;z-index:2147483646;background:#fff;border:1px solid #c8c8c8;border-radius:4px;padding:0.35rem 0.5rem;color:#222;max-width:18rem';this._hoverBox=n}n.innerHTML=this.getAttribute('data-hover-html')||'';var r=this.getBoundingClientRect();n.style.left=r.left+window.scrollX+'px';n.style.top=r.bottom+4+window.scrollY+'px';document.body.appendChild(n)"

const HOVER_HTML_OUT = 'this._hoverBox&&this._hoverBox.remove()'

const SAFE_CSS_COLOR =
  /^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|0?\.\d+|1))?\s*\))$/

export function defaultLinkAttrs(overrides: Partial<LinkAttrs> = {}): LinkAttrs {
  return {
    href: '',
    title: '',
    targetBlank: false,
    textDecorationNone: false,
    hoverMode: 'color',
    hoverColor: null,
    hoverHtml: '',
    ...overrides,
  }
}

function isHrefAnchor(el: Element): el is HTMLAnchorElement {
  return el.tagName.toLowerCase() === 'a' && el.hasAttribute('href')
}

export function closestHrefAnchor(root: HTMLElement, node: Node | null): HTMLAnchorElement | null {
  let current: Node | null = node
  while (current && current !== root) {
    if (current instanceof Element && isHrefAnchor(current)) return current
    current = current.parentNode
  }
  return null
}

function isSafeCssColor(color: string): boolean {
  return SAFE_CSS_COLOR.test(color)
}

function parseHoverColor(anchor: HTMLAnchorElement): string | null {
  const over = anchor.getAttribute('onmouseover') ?? ''
  const match = /this\.style\.color\s*=\s*'([^']+)'/.exec(over)
  const color = match?.[1]?.trim() ?? ''
  return color && isSafeCssColor(color) ? color : null
}

function hasTextDecorationNone(anchor: HTMLAnchorElement): boolean {
  const value = `${anchor.style.textDecoration} ${anchor.style.textDecorationLine}`.toLowerCase()
  return /\bnone\b/.test(value)
}

function readLinkAttrs(anchor: HTMLAnchorElement): LinkAttrs {
  const hoverHtml = anchor.getAttribute(LINK_HOVER_HTML_ATTR) ?? ''
  const hoverColor = parseHoverColor(anchor)
  return {
    href: anchor.getAttribute('href') ?? '',
    title: anchor.getAttribute('title') ?? '',
    targetBlank: anchor.getAttribute('target') === '_blank',
    textDecorationNone: hasTextDecorationNone(anchor),
    hoverMode: hoverHtml.trim() ? 'html' : 'color',
    hoverColor,
    hoverHtml,
  }
}

export function queryLinkAtSelection(root: HTMLElement): LinkAttrs | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null
  const anchor = closestHrefAnchor(root, range.commonAncestorContainer)
  return anchor ? readLinkAttrs(anchor) : null
}

export function isLinkActive(root: HTMLElement): boolean {
  return queryLinkAtSelection(root) !== null
}

function clearHover(anchor: HTMLAnchorElement): void {
  anchor.removeAttribute('onmouseover')
  anchor.removeAttribute('onmouseout')
  anchor.removeAttribute(LINK_HOVER_HTML_ATTR)
}

function applyHover(anchor: HTMLAnchorElement, attrs: LinkAttrs): void {
  clearHover(anchor)
  if (attrs.hoverMode === 'html') {
    const html = attrs.hoverHtml.trim()
    if (!html) return
    anchor.setAttribute(LINK_HOVER_HTML_ATTR, html)
    anchor.setAttribute('onmouseover', HOVER_HTML_OVER)
    anchor.setAttribute('onmouseout', HOVER_HTML_OUT)
    return
  }
  const color = attrs.hoverColor?.trim() ?? ''
  if (!color || !isSafeCssColor(color)) return
  anchor.setAttribute('onmouseover', `this.style.color='${color}'`)
  anchor.setAttribute('onmouseout', "this.style.color=''")
}

export function applyLinkAttrs(anchor: HTMLAnchorElement, attrs: LinkAttrs): void {
  const next = defaultLinkAttrs(attrs)
  anchor.setAttribute('href', next.href)
  const title = next.title.trim()
  if (title) anchor.setAttribute('title', title)
  else anchor.removeAttribute('title')
  if (next.targetBlank) {
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', BLANK_REL)
  } else {
    anchor.removeAttribute('target')
    anchor.removeAttribute('rel')
  }
  if (next.textDecorationNone) {
    anchor.style.textDecoration = 'none'
  } else {
    if (hasTextDecorationNone(anchor)) {
      anchor.style.removeProperty('text-decoration')
      anchor.style.removeProperty('text-decoration-line')
    }
  }
  applyHover(anchor, next)
}

function unwrapHrefAnchorsIntersecting(root: HTMLElement, texts: Text[]): void {
  const seen = new Set<HTMLAnchorElement>()
  for (const text of texts) {
    const anchor = closestHrefAnchor(root, text)
    if (anchor && !seen.has(anchor)) seen.add(anchor)
  }
  for (const anchor of seen) unwrapElement(anchor)
}

function wrapRangeInLink(root: HTMLElement, range: Range, attrs: LinkAttrs): boolean {
  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  unwrapHrefAnchorsIntersecting(root, texts)
  if (texts.length > 0) restoreTextSelection(texts)

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const live = sel.getRangeAt(0)
  splitRangeBoundaries(live)

  const anchor = document.createElement('a')
  applyLinkAttrs(anchor, attrs)
  try {
    live.surroundContents(anchor)
    return true
  } catch {
    const frag = live.extractContents()
    if (!frag.hasChildNodes()) return false
    anchor.appendChild(frag)
    live.insertNode(anchor)
    return true
  }
}

function insertLinkAtCaret(range: Range, attrs: LinkAttrs): boolean {
  const anchor = document.createElement('a')
  applyLinkAttrs(anchor, attrs)
  anchor.textContent = attrs.href
  range.insertNode(anchor)
  range.setStartAfter(anchor)
  range.collapse(true)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  return true
}

export function applyLinkInDocument(root: HTMLElement, attrs: LinkAttrs): boolean {
  const href = attrs.href.trim()
  if (!href) return false
  const next = defaultLinkAttrs({ ...attrs, href })

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  const startAnchor = closestHrefAnchor(root, range.startContainer)
  const endAnchor = closestHrefAnchor(root, range.endContainer)
  if (startAnchor && startAnchor === endAnchor) {
    applyLinkAttrs(startAnchor, next)
    return true
  }

  if (range.collapsed) return insertLinkAtCaret(range, next)
  return wrapRangeInLink(root, range, next)
}
