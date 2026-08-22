import { afterEach, describe, expect, it } from 'vitest'
import { insertPageBreakInDocument } from './pageBreak'

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

function selectNodeStart(node: Node) {
  const range = document.createRange()
  range.setStart(node, 0)
  range.collapse(true)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function caretIsIn(el: Element): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const node = sel.getRangeAt(0).startContainer
  return el === node || el.contains(node)
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('insertPageBreakInDocument', () => {
  it('splits a paragraph at the caret and writes inline break styles', () => {
    const el = mountVisual('<p>HelloWorld</p>')
    selectOffsets(el, 5, 5)

    expect(insertPageBreakInDocument(el)).toBe(true)

    const pageBreak = el.querySelector('div')
    expect(pageBreak).not.toBeNull()
    expect(pageBreak?.style.breakAfter).toBe('page')
    expect(pageBreak?.style.pageBreakAfter).toBe('always')
    expect(pageBreak?.style.margin).toMatch(/^1\.5em 0/)
    expect(pageBreak?.style.borderTop).toMatch(/2px dashed/)
    const paragraphs = [...el.querySelectorAll('p')]
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.textContent).toBe('Hello')
    expect(paragraphs[1]?.textContent).toBe('World')
    expect(paragraphs[0]?.nextElementSibling).toBe(pageBreak)
    expect(pageBreak?.nextElementSibling).toBe(paragraphs[1])
    expect(caretIsIn(paragraphs[1]!)).toBe(true)
  })

  it('keeps empty halves when inserting into an empty paragraph', () => {
    const el = mountVisual('<p><br></p>')
    selectNodeStart(el.querySelector('p')!)

    expect(insertPageBreakInDocument(el)).toBe(true)

    const pageBreak = el.querySelector('div')
    const paragraphs = [...el.querySelectorAll('p')]
    expect(pageBreak).not.toBeNull()
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.nextElementSibling).toBe(pageBreak)
    expect(pageBreak?.nextElementSibling).toBe(paragraphs[1])
    expect(caretIsIn(paragraphs[1]!)).toBe(true)
  })

  it('inserts inside a table cell without leaving the cell', () => {
    const el = mountVisual('<table><tbody><tr><td>HelloWorld</td></tr></tbody></table>')
    selectOffsets(el, 5, 5)

    expect(insertPageBreakInDocument(el)).toBe(true)

    const cell = el.querySelector('td')
    const pageBreak = cell?.querySelector('div')
    expect(pageBreak).not.toBeNull()
    expect(el.querySelector('table')?.contains(pageBreak!)).toBe(true)
    expect(pageBreak?.parentElement).toBe(cell)
  })

  it('splits a paragraph inside a table cell', () => {
    const el = mountVisual('<table><tbody><tr><td><p>HelloWorld</p></td></tr></tbody></table>')
    selectOffsets(el, 5, 5)

    expect(insertPageBreakInDocument(el)).toBe(true)

    const cell = el.querySelector('td')
    const pageBreak = cell?.querySelector('div')
    const paragraphs = [...(cell?.querySelectorAll('p') ?? [])]
    expect(pageBreak).not.toBeNull()
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.textContent).toBe('Hello')
    expect(paragraphs[1]?.textContent).toBe('World')
    expect(paragraphs[0]?.nextElementSibling).toBe(pageBreak)
  })

  it('does not insert when the selection is outside the root', () => {
    const el = mountVisual('<p>Hello</p>')
    const other = mountVisual('<p>Other</p>')
    selectOffsets(other, 0, 0)

    expect(insertPageBreakInDocument(el)).toBe(false)
    expect(el.querySelector('div')).toBeNull()
  })
})
