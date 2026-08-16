import { afterEach, describe, expect, it } from 'vitest'
import { clearFormattingInDocument } from './clearFormatting'

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

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('clearFormattingInDocument', () => {
  it('unwraps mixed character formatting on a range', () => {
    const el = mountVisual(
      '<p><span style="font-weight: 700; color: red; font-size: 18pt;">Hello</span></p>',
    )
    selectOffsets(el, 0, 5)

    expect(clearFormattingInDocument(el)).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('unwraps semantic mark tags', () => {
    const el = mountVisual('<p><strong>Hello</strong></p>')
    selectOffsets(el, 0, 5)

    expect(clearFormattingInDocument(el)).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('returns false and leaves the document when the caret is collapsed', () => {
    const el = mountVisual('<p><span style="font-weight: 700;">Hello</span></p>')
    selectOffsets(el, 2, 2)
    const before = el.innerHTML

    expect(clearFormattingInDocument(el)).toBe(false)
    expect(el.innerHTML).toBe(before)
  })

  it('keeps links and paragraph alignment', () => {
    const el = mountVisual(
      '<p style="text-align: center;"><a href="https://example.com"><span style="font-weight: 700;">Hello</span></a></p>',
    )
    selectOffsets(el, 0, 5)

    expect(clearFormattingInDocument(el)).toBe(true)
    expect(el.innerHTML).toBe(
      '<p style="text-align: center;"><a href="https://example.com">Hello</a></p>',
    )
  })
})
