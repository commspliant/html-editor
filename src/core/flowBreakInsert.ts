import { elementFromNode, tagName } from './blocks'
import {
  isolateNodeInParent,
  isFormattingWrapper,
  isInside,
  unwrapElement,
} from './inlineRange'

const SPLIT_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const FLOW_STOP_TAGS = new Set(['td', 'th', 'li', 'blockquote', 'pre', 'table', 'thead', 'tbody', 'tr'])

export function insertFlowBreakInDocument(root: HTMLElement, element: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  if (!range.collapsed) range.deleteContents()

  const block = nearestSplitBlock(root, range.startContainer)
  if (block) {
    const after = splitBlockAtRange(block, range)
    block.parentNode?.insertBefore(element, after)
    placeCaretAfterBreak(element)
    return true
  }

  range.insertNode(element)
  liftOutOfPhrasing(root, element)
  ensureFollowingBlock(element)
  placeCaretAfterBreak(element)
  return true
}

function nearestSplitBlock(root: HTMLElement, node: Node): HTMLElement | null {
  let current = elementFromNode(node)
  while (current && current !== root) {
    const tag = tagName(current)
    if (SPLIT_TAGS.has(tag) && current instanceof HTMLElement) return current
    if (FLOW_STOP_TAGS.has(tag)) return null
    current = current.parentElement
  }
  return null
}

function splitBlockAtRange(block: HTMLElement, range: Range): HTMLElement {
  const afterRange = document.createRange()
  afterRange.setStart(range.startContainer, range.startOffset)
  afterRange.setEnd(block, block.childNodes.length)
  const extracted = afterRange.extractContents()
  const after = block.cloneNode(false) as HTMLElement
  after.appendChild(extracted)
  ensureBlockHasContent(block)
  ensureBlockHasContent(after)
  block.parentNode?.insertBefore(after, block.nextSibling)
  return after
}

function liftOutOfPhrasing(root: HTMLElement, element: HTMLElement): void {
  while (true) {
    const parent = element.parentElement
    if (!parent || parent === root) return
    if (!isPhrasingElement(parent)) return
    isolateNodeInParent(parent, element)
    unwrapElement(parent)
  }
}

function isPhrasingElement(el: Element): boolean {
  const tag = tagName(el)
  return isFormattingWrapper(el) || tag === 'a'
}

function ensureBlockHasContent(el: HTMLElement): void {
  if (!isEmptyBlock(el)) return
  el.appendChild(document.createElement('br'))
}

function isEmptyBlock(el: HTMLElement): boolean {
  if (el.childNodes.length === 0) return true
  if (el.childNodes.length === 1 && el.firstChild?.nodeName === 'BR') return true
  return (el.textContent ?? '').trim().length === 0 && el.querySelector('img, table, ul, ol, hr') === null
}

function ensureFollowingBlock(element: HTMLElement): void {
  if (element.nextSibling) return
  const p = document.createElement('p')
  p.appendChild(document.createElement('br'))
  element.parentNode?.insertBefore(p, element.nextSibling)
}

function placeCaretAfterBreak(element: HTMLElement): void {
  const next = element.nextSibling
  const range = document.createRange()
  if (next instanceof HTMLElement) {
    range.setStart(next, 0)
    range.collapse(true)
  } else if (next) {
    range.setStart(next, 0)
    range.collapse(true)
  } else {
    range.setStartAfter(element)
    range.collapse(true)
  }
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}
