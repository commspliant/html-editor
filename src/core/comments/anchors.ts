import { imageAtSelection } from '../imageProperties'
import { isInside, splitRangeBoundaries } from '../inlineRange'
import type { SelectionSnapshot } from '../selection'
import type { CommentAnchor, CommentThread } from '../../types'
import { COMMENT_ANCHOR_CLASS, COMMENT_THREAD_ATTR } from './constants'

const CONTEXT_CHARS = 20

function closestCommentThreadElement(node: Node | null, root: HTMLElement): HTMLElement | null {
  if (!node) return null
  const el = node instanceof Element ? node : node.parentElement
  if (!el) return null
  const marked = el.closest(`[${COMMENT_THREAD_ATTR}]`)
  if (marked instanceof HTMLElement && isInside(root, marked)) return marked
  return null
}

function rangeFromOffsets(root: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let remainingStart = Math.max(0, start)
  let remainingEnd = Math.max(start, end)
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let current: Node | null

  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.textContent?.length ?? 0
    if (!startNode && remainingStart <= len) {
      startNode = text
      startOffset = remainingStart
    }
    if (!endNode && remainingEnd <= len) {
      endNode = text
      endOffset = remainingEnd
      break
    }
    remainingStart -= len
    remainingEnd -= len
  }

  if (!startNode || !endNode) return null
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

function readContextText(root: HTMLElement, start: number, end: number): { prefix: string; suffix: string } {
  const text = root.textContent ?? ''
  const prefix = text.slice(Math.max(0, start - CONTEXT_CHARS), start)
  const suffix = text.slice(end, end + CONTEXT_CHARS)
  return { prefix, suffix }
}

export function snapshotCommentAnchor(root: HTMLElement, snapshot: SelectionSnapshot): CommentAnchor | null {
  if (snapshot.mode !== 'visual') return null

  const img = imageAtSelection(root)
  if (img) {
    return {
      type: 'image',
      elementId: img.id || undefined,
      src: img.getAttribute('src') ?? undefined,
    }
  }

  if (snapshot.collapsed && !snapshot.text) return null

  const { prefix, suffix } = readContextText(root, snapshot.start, snapshot.end)
  return {
    type: 'text',
    text: snapshot.text,
    start: snapshot.start,
    end: snapshot.end,
    prefix,
    suffix,
  }
}

export function threadIdAtSelection(root: HTMLElement, snapshot: SelectionSnapshot): string | null {
  if (snapshot.mode !== 'visual') return null

  const img = imageAtSelection(root)
  if (img?.hasAttribute(COMMENT_THREAD_ATTR)) {
    return img.getAttribute(COMMENT_THREAD_ATTR) ?? null
  }

  if (snapshot.visualRange) {
    const startMarked = closestCommentThreadElement(snapshot.visualRange.startContainer, root)
    if (startMarked) return startMarked.getAttribute(COMMENT_THREAD_ATTR) ?? null
    const endMarked = closestCommentThreadElement(snapshot.visualRange.endContainer, root)
    if (endMarked) return endMarked.getAttribute(COMMENT_THREAD_ATTR) ?? null
  }

  return null
}

export function applyTextCommentAnchor(root: HTMLElement, threadId: string, range: Range): boolean {
  if (!isInside(root, range.commonAncestorContainer)) return false
  splitRangeBoundaries(range)
  const span = document.createElement('span')
  span.setAttribute(COMMENT_THREAD_ATTR, threadId)
  try {
    range.surroundContents(span)
    return true
  } catch {
    const text = range.toString()
    if (!text) return false
    const replacement = document.createElement('span')
    replacement.setAttribute(COMMENT_THREAD_ATTR, threadId)
    replacement.textContent = text
    range.deleteContents()
    range.insertNode(replacement)
    return true
  }
}

export function applyImageCommentAnchor(img: HTMLImageElement, threadId: string): void {
  img.setAttribute(COMMENT_THREAD_ATTR, threadId)
}

export function applyCommentAnchor(
  root: HTMLElement,
  threadId: string,
  snapshot: SelectionSnapshot,
): boolean {
  const img = imageAtSelection(root)
  if (img) {
    applyImageCommentAnchor(img, threadId)
    return true
  }
  if (!snapshot.visualRange) return false
  return applyTextCommentAnchor(root, threadId, snapshot.visualRange)
}

function findImageAnchor(root: HTMLElement, anchor: CommentAnchor): HTMLImageElement | null {
  if (anchor.type !== 'image') return null
  for (const img of root.querySelectorAll('img')) {
    if (anchor.elementId && img.id === anchor.elementId) return img
    if (anchor.src && img.getAttribute('src') === anchor.src) return img
  }
  return null
}

function applyTextAnchorFromMetadata(root: HTMLElement, threadId: string, anchor: CommentAnchor): boolean {
  if (anchor.type !== 'text') return false
  if (anchor.start !== undefined && anchor.end !== undefined) {
    const range = rangeFromOffsets(root, anchor.start, anchor.end)
    if (range && range.toString() === anchor.text) {
      return applyTextCommentAnchor(root, threadId, range)
    }
  }
  const text = root.textContent ?? ''
  const needle = anchor.text
  if (!needle) return false
  let index = 0
  while (index <= text.length) {
    const found = text.indexOf(needle, index)
    if (found === -1) return false
    const end = found + needle.length
    const prefix = text.slice(Math.max(0, found - CONTEXT_CHARS), found)
    const suffix = text.slice(end, end + CONTEXT_CHARS)
    if (anchor.prefix !== undefined && prefix !== anchor.prefix) {
      index = found + 1
      continue
    }
    if (anchor.suffix !== undefined && suffix !== anchor.suffix) {
      index = found + 1
      continue
    }
    const range = rangeFromOffsets(root, found, end)
    if (!range) return false
    return applyTextCommentAnchor(root, threadId, range)
  }
  return false
}

export function syncCommentAnchorsToDom(root: HTMLElement, threads: readonly CommentThread[]): void {
  for (const thread of threads) {
    const existing = root.querySelector(`[${COMMENT_THREAD_ATTR}="${thread.id}"]`)
    if (existing) continue
    if (thread.anchor.type === 'image') {
      const img = findImageAnchor(root, thread.anchor)
      if (img) applyImageCommentAnchor(img, thread.id)
      continue
    }
    applyTextAnchorFromMetadata(root, thread.id, thread.anchor)
  }
}

export function setCommentHighlightsVisible(root: HTMLElement, visible: boolean): void {
  for (const el of root.querySelectorAll(`[${COMMENT_THREAD_ATTR}]`)) {
    if (el instanceof HTMLElement) {
      if (visible) {
        el.classList.add(COMMENT_ANCHOR_CLASS)
      } else {
        el.classList.remove(COMMENT_ANCHOR_CLASS)
      }
    }
  }
}

export function commentThreadElementAtPoint(
  root: HTMLElement,
  target: Node | null,
): HTMLElement | null {
  if (!target) return null
  const el = target instanceof Element ? target : target.parentElement
  if (!el) return null
  const marked = el.closest(`[${COMMENT_THREAD_ATTR}]`)
  if (marked instanceof HTMLElement && isInside(root, marked)) return marked
  return null
}

export function selectCommentThreadAnchor(root: HTMLElement, threadId: string): boolean {
  const el = root.querySelector(`[${COMMENT_THREAD_ATTR}="${threadId}"]`)
  if (!(el instanceof HTMLElement)) return false

  const sel = window.getSelection()
  if (!sel) return false

  const range = document.createRange()
  if (el instanceof HTMLImageElement) {
    range.selectNode(el)
  } else {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const firstText = walker.nextNode()
    if (firstText instanceof Text) {
      range.setStart(firstText, 0)
      range.collapse(true)
    } else {
      range.selectNodeContents(el)
      range.collapse(true)
    }
  }
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}
