import { afterEach, describe, expect, it } from 'vitest'
import {
  applyCopiedFormat,
  selectionRangesEqual,
  snapshotFormatFromRoot,
  type CopiedFormat,
} from './formatBrush'
import type { SelectionSnapshot } from './selection'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function selectOffsets(el: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remainingStart = start
  let remainingEnd = end
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.data.length
    if (!startNode && remainingStart <= len) {
      startNode = text
      startOffset = remainingStart
    }
    if (!startNode) remainingStart -= len
    if (!endNode && remainingEnd <= len) {
      endNode = text
      endOffset = remainingEnd
      break
    }
    remainingEnd -= len
  }
  if (!startNode || !endNode) {
    throw new Error('could not map offsets to text nodes')
  }
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function snapshot(start: number, end: number, collapsed = start === end): SelectionSnapshot {
  return {
    mode: 'visual',
    text: collapsed ? '' : 'x',
    collapsed,
    start,
    end,
    visualRange: null,
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('selectionRangesEqual', () => {
  it('compares start, end, and collapsed', () => {
    expect(selectionRangesEqual(snapshot(0, 5), snapshot(0, 5))).toBe(true)
    expect(selectionRangesEqual(snapshot(0, 5), snapshot(1, 5))).toBe(false)
    expect(selectionRangesEqual(snapshot(2, 2, true), snapshot(2, 2, true))).toBe(true)
    expect(selectionRangesEqual(snapshot(2, 2, true), snapshot(0, 5))).toBe(false)
  })
})

describe('snapshotFormatFromRoot', () => {
  it('reads bold and color from a uniform selection', () => {
    const el = mountVisual(
      '<p><span style="font-weight: 700; color: #ff0000;">Hello</span></p>',
    )
    selectOffsets(el, 0, 5)

    const copied = snapshotFormatFromRoot(el)
    expect(copied.marks.bold).toBe(true)
    expect(copied.fontColor).toBe('#ff0000')
    expect(copied.fontColorMixed).toBe(false)
  })

  it('marks mixed font colors when the selection spans different values', () => {
    const el = mountVisual(
      '<p><span style="color: red;">A</span><span style="color: blue;">B</span></p>',
    )
    selectOffsets(el, 0, 2)

    const copied = snapshotFormatFromRoot(el)
    expect(copied.fontColorMixed).toBe(true)
  })
})

describe('applyCopiedFormat', () => {
  it('applies bold and color to plain target text', () => {
    const el = mountVisual(
      '<p><span style="font-weight: 700; color: #ff0000;">Source</span></p><p>Target</p>',
    )
    selectOffsets(el, 0, 6)
    const copied = snapshotFormatFromRoot(el)

    selectOffsets(el, 6, 12)
    applyCopiedFormat(el, copied)

    expect(el.innerHTML).toContain('font-weight: 700')
    expect(el.innerHTML).toContain('#ff0000')
    expect(el.textContent).toBe('SourceTarget')
  })
})
