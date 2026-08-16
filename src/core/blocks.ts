import { isFormattingWrapper, isInside, textNodesInRange } from './inlineRange'
import { contentRoot, isPageShell } from './page'
import { rangeFromOffsets } from './selection'

export const ALIGNABLE_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'div',
  'li',
  'blockquote',
])

const TABLE_STRUCTURE_TAGS = new Set(['table', 'thead', 'tbody', 'tr', 'td', 'th'])
const SKIP_WRAP_TAGS = new Set([...TABLE_STRUCTURE_TAGS, 'ul', 'ol', 'li', 'pre'])

export function tagName(el: Element): string {
  return el.tagName.toLowerCase()
}

export function elementFromNode(node: Node): Element | null {
  if (node.nodeType === Node.TEXT_NODE) return node.parentElement
  if (node instanceof Element) return node
  return node.parentElement
}

export function isListContainer(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && (tagName(node) === 'ul' || tagName(node) === 'ol')
}

export function isListItem(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && tagName(node) === 'li'
}

export function currentRange(root: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null
  return range
}

export function nodesForRange(range: Range): Node[] {
  const texts = range.collapsed
    ? []
    : textNodesInRange(range).filter((node) => node.data.length > 0)
  return texts.length > 0 ? texts : [range.startContainer]
}

export function textOffsetFromRoot(root: HTMLElement, node: Node, offset: number): number {
  if (node.nodeType === Node.TEXT_NODE) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let length = 0
    let current: Node | null
    while ((current = walker.nextNode())) {
      if (current === node) return length + offset
      length += current.textContent?.length ?? 0
    }
    return length
  }

  let prefix = 0
  const children = node.childNodes
  for (let i = 0; i < offset && i < children.length; i += 1) {
    prefix += children[i].textContent?.length ?? 0
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let length = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    if (node.contains(current)) return length + prefix
    const position = node.compareDocumentPosition(current)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return length + prefix
    length += current.textContent?.length ?? 0
  }
  return length + prefix
}

export function restoreOffsets(root: HTMLElement, start: number, end: number): void {
  const range = rangeFromOffsets(root, start, end)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

export function withRestoredSelection(root: HTMLElement, mutate: () => boolean): boolean {
  const range = currentRange(root)
  if (!range) return false
  const start = textOffsetFromRoot(root, range.startContainer, range.startOffset)
  const end = textOffsetFromRoot(root, range.endContainer, range.endOffset)
  const from = Math.min(start, end)
  const to = Math.max(start, end)
  const changed = mutate()
  restoreOffsets(root, from, to)
  return changed
}

export function renameElement(el: HTMLElement, tag: string): HTMLElement {
  if (tagName(el) === tag) return el
  const next = document.createElement(tag)
  for (const attr of [...el.attributes]) {
    next.setAttribute(attr.name, attr.value)
  }
  while (el.firstChild) {
    next.appendChild(el.firstChild)
  }
  el.replaceWith(next)
  return next
}

export function clearEmptyStyle(el: HTMLElement): void {
  if (!el.getAttribute('style')?.trim()) {
    el.removeAttribute('style')
  }
}

export function nearestAlignable(root: HTMLElement, node: Node): HTMLElement | null {
  let current = elementFromNode(node)
  while (current && current !== root) {
    if (isPageShell(current, root)) {
      current = current.parentElement
      continue
    }
    const tag = tagName(current)
    if (ALIGNABLE_TAGS.has(tag) && current instanceof HTMLElement) return current
    if (TABLE_STRUCTURE_TAGS.has(tag) || tag === 'pre') return null
    current = current.parentElement
  }
  return null
}

export function collectSelectedBlocks(root: HTMLElement): HTMLElement[] {
  const range = currentRange(root)
  if (!range) return []
  const seen = new Set<HTMLElement>()
  const blocks: HTMLElement[] = []
  for (const node of nodesForRange(range)) {
    const block = nearestAlignable(root, node)
    if (block && !seen.has(block)) {
      seen.add(block)
      blocks.push(block)
    }
  }
  return blocks
}

function isPhrasingNode(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) return true
  if (!(node instanceof Element)) return true
  const tag = tagName(node)
  if (ALIGNABLE_TAGS.has(tag) || SKIP_WRAP_TAGS.has(tag)) return false
  return isFormattingWrapper(node) || tag === 'br' || tag === 'a' || tag === 'img' || tag === 'span'
}

function isInsideSkipWrap(root: HTMLElement, node: Node): boolean {
  let current = elementFromNode(node)
  while (current && current !== root) {
    if (SKIP_WRAP_TAGS.has(tagName(current))) return true
    current = current.parentElement
  }
  return false
}

function childOfRoot(root: HTMLElement, node: Node): Node | null {
  let current: Node | null = node
  while (current && current.parentNode !== root) {
    current = current.parentNode
  }
  return current && current.parentNode === root ? current : null
}

function phrasingRunAround(root: HTMLElement, child: Node): Node[] {
  const siblings = [...root.childNodes]
  const index = siblings.indexOf(child as ChildNode)
  if (index < 0) return [child]
  let start = index
  let end = index
  while (start > 0 && isPhrasingNode(siblings[start - 1])) start -= 1
  while (end < siblings.length - 1 && isPhrasingNode(siblings[end + 1])) end += 1
  return siblings.slice(start, end + 1)
}

function caretChildInWrapRoot(
  wrapRoot: HTMLElement,
  visualRoot: HTMLElement,
  range: Range,
): Node | null {
  if (range.startContainer === wrapRoot) {
    return (
      wrapRoot.childNodes[Math.min(range.startOffset, Math.max(0, wrapRoot.childNodes.length - 1))] ??
      wrapRoot.firstChild
    )
  }
  if (range.startContainer === visualRoot && wrapRoot !== visualRoot) {
    return wrapRoot.firstChild
  }
  return childOfRoot(wrapRoot, range.startContainer)
}

export function wrapLoosePhrasing(root: HTMLElement, range: Range): HTMLElement | null {
  const wrapRoot = contentRoot(root)
  if (isInsideSkipWrap(root, range.startContainer)) return null

  if (!wrapRoot.firstChild) {
    const el = document.createElement('p')
    el.appendChild(document.createElement('br'))
    wrapRoot.appendChild(el)
    return el
  }

  const caretChild = caretChildInWrapRoot(wrapRoot, root, range)

  if (!caretChild || (caretChild instanceof Element && SKIP_WRAP_TAGS.has(tagName(caretChild)))) {
    return null
  }
  if (caretChild instanceof HTMLElement && ALIGNABLE_TAGS.has(tagName(caretChild))) return null
  if (!isPhrasingNode(caretChild)) return null

  const run = phrasingRunAround(wrapRoot, caretChild)
  const el = document.createElement('p')
  wrapRoot.insertBefore(el, run[0])
  for (const node of run) el.appendChild(node)
  return el
}

export function ensureSelectedBlocks(root: HTMLElement): HTMLElement[] {
  const blocks = collectSelectedBlocks(root)
  if (blocks.length > 0) return blocks
  const range = currentRange(root)
  if (!range) return []
  const wrapped = wrapLoosePhrasing(root, range)
  return wrapped ? [wrapped] : []
}

export function parentList(li: HTMLElement): HTMLElement | null {
  const parent = li.parentElement
  return parent && isListContainer(parent) ? parent : null
}

export function groupConsecutiveSiblings(blocks: HTMLElement[]): HTMLElement[][] {
  if (blocks.length === 0) return []
  const runs: HTMLElement[][] = [[blocks[0]]]
  for (let i = 1; i < blocks.length; i += 1) {
    const prev = blocks[i - 1]
    const next = blocks[i]
    if (prev.parentNode === next.parentNode && areAdjacentSiblings(prev, next)) {
      runs[runs.length - 1].push(next)
    } else {
      runs.push([next])
    }
  }
  return runs
}

function areAdjacentSiblings(a: HTMLElement, b: HTMLElement): boolean {
  let node: Node | null = a.nextSibling
  while (node) {
    if (node === b) return true
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      node = node.nextSibling
      continue
    }
    return false
  }
  return false
}
