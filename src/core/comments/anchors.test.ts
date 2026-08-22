import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import {
  applyCommentAnchor,
  applyImageCommentAnchor,
  applyTextCommentAnchor,
  setCommentHighlightsVisible,
  snapshotCommentAnchor,
  syncCommentAnchorsToDom,
  threadIdAtSelection,
} from './anchors'
import { COMMENT_ANCHOR_CLASS, COMMENT_THREAD_ATTR } from './constants'
import type { CommentThread } from '../../types'
import type { SelectionSnapshot } from '../selection'

function visualSnapshot(
  root: HTMLElement,
  start: number,
  end: number,
  text: string,
): SelectionSnapshot {
  const range = document.createRange()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let remainingStart = start
  let remainingEnd = end
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    const node = current as Text
    const len = node.textContent?.length ?? 0
    if (!startNode && remainingStart <= len) {
      startNode = node
      startOffset = remainingStart
    }
    if (!endNode && remainingEnd <= len) {
      endNode = node
      endOffset = remainingEnd
      break
    }
    remainingStart -= len
    remainingEnd -= len
  }
  if (!startNode || !endNode) throw new Error('invalid offsets')
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  return {
    mode: 'visual',
    text,
    collapsed: start === end,
    start,
    end,
    visualRange: range,
  }
}

describe('comment anchors', () => {
  let root: HTMLDivElement

  beforeEach(() => {
    root = document.createElement('div')
    root.contentEditable = 'true'
    document.body.appendChild(root)
  })

  afterEach(() => {
    root.remove()
  })

  it('wraps selected text with thread attribute', () => {
    root.innerHTML = '<p>Hello world</p>'
    const snapshot = visualSnapshot(root, 0, 5, 'Hello')
    expect(applyCommentAnchor(root, 'cmt_test', snapshot)).toBe(true)
    expect(root.querySelector(`[${COMMENT_THREAD_ATTR}="cmt_test"]`)).not.toBeNull()
    expect(root.textContent).toBe('Hello world')
  })

  it('sets thread attribute on selected image', () => {
    root.innerHTML = '<p><img src="a.jpg" alt=""></p>'
    const img = root.querySelector('img')!
    const range = document.createRange()
    range.selectNode(img)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    const snapshot: SelectionSnapshot = {
      mode: 'visual',
      text: '',
      collapsed: true,
      start: 0,
      end: 0,
      visualRange: range,
    }
    applyImageCommentAnchor(img, 'cmt_img')
    expect(img.getAttribute(COMMENT_THREAD_ATTR)).toBe('cmt_img')
    expect(threadIdAtSelection(root, snapshot)).toBe('cmt_img')
  })

  it('snapshots text anchor metadata', () => {
    root.innerHTML = '<p>Price was £150 last week.</p>'
    const snapshot = visualSnapshot(root, 10, 15, '£150')
    const anchor = snapshotCommentAnchor(root, snapshot)
    expect(anchor).toMatchObject({ type: 'text', text: '£150' })
  })

  it('syncs anchors from thread metadata', () => {
    root.innerHTML = '<p>Price was £150 last week.</p>'
    const threads: CommentThread[] = [
      {
        id: 'cmt_sync',
        anchor: {
          type: 'text',
          text: '£150',
          start: 10,
          end: 15,
          prefix: 'Price was ',
          suffix: ' last week.',
        },
        messages: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    syncCommentAnchorsToDom(root, threads)
    expect(root.querySelector(`[${COMMENT_THREAD_ATTR}="cmt_sync"]`)).not.toBeNull()
  })

  it('toggles highlight class without removing attribute', () => {
    root.innerHTML = '<p><span data-comment-thread="cmt_1">Hi</span></p>'
    setCommentHighlightsVisible(root, true)
    const span = root.querySelector('span')!
    expect(span.classList.contains(COMMENT_ANCHOR_CLASS)).toBe(true)
    setCommentHighlightsVisible(root, false)
    expect(span.classList.contains(COMMENT_ANCHOR_CLASS)).toBe(false)
    expect(span.hasAttribute(COMMENT_THREAD_ATTR)).toBe(true)
  })
})
