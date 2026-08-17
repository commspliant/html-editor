import { afterEach, describe, expect, it } from 'vitest'
import { insertHorizontalRuleInDocument } from './horizontalRule'

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

describe('insertHorizontalRuleInDocument', () => {
  it('splits a paragraph at the caret and writes inline styles', () => {
    const el = mountVisual('<p>HelloWorld</p>')
    selectOffsets(el, 5, 5)

    expect(insertHorizontalRuleInDocument(el)).toBe(true)

    const hr = el.querySelector('hr')
    expect(hr).not.toBeNull()
    expect(hr?.style.margin).toMatch(/^1em 0/)
    expect(hr?.style.borderTop).toMatch(/1px solid/)
    const paragraphs = [...el.querySelectorAll('p')]
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.textContent).toBe('Hello')
    expect(paragraphs[1]?.textContent).toBe('World')
    expect(paragraphs[0]?.nextElementSibling).toBe(hr)
    expect(hr?.nextElementSibling).toBe(paragraphs[1])
    expect(caretIsIn(paragraphs[1]!)).toBe(true)
  })

  it('keeps empty halves when inserting into an empty paragraph', () => {
    const el = mountVisual('<p><br></p>')
    selectNodeStart(el.querySelector('p')!)

    expect(insertHorizontalRuleInDocument(el)).toBe(true)

    const hr = el.querySelector('hr')
    const paragraphs = [...el.querySelectorAll('p')]
    expect(hr).not.toBeNull()
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.nextElementSibling).toBe(hr)
    expect(hr?.nextElementSibling).toBe(paragraphs[1])
    expect(caretIsIn(paragraphs[1]!)).toBe(true)
  })

  it('inserts inside a table cell without leaving the cell', () => {
    const el = mountVisual('<table><tbody><tr><td>HelloWorld</td></tr></tbody></table>')
    selectOffsets(el, 5, 5)

    expect(insertHorizontalRuleInDocument(el)).toBe(true)

    const cell = el.querySelector('td')
    const hr = cell?.querySelector('hr')
    expect(hr).not.toBeNull()
    expect(el.querySelector('table')?.contains(hr!)).toBe(true)
    expect(hr?.parentElement).toBe(cell)
  })

  it('splits a paragraph inside a table cell', () => {
    const el = mountVisual('<table><tbody><tr><td><p>HelloWorld</p></td></tr></tbody></table>')
    selectOffsets(el, 5, 5)

    expect(insertHorizontalRuleInDocument(el)).toBe(true)

    const cell = el.querySelector('td')
    const hr = cell?.querySelector('hr')
    const paragraphs = [...(cell?.querySelectorAll('p') ?? [])]
    expect(hr).not.toBeNull()
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.textContent).toBe('Hello')
    expect(paragraphs[1]?.textContent).toBe('World')
    expect(paragraphs[0]?.nextElementSibling).toBe(hr)
  })

  it('does not insert when the selection is outside the root', () => {
    const el = mountVisual('<p>Hello</p>')
    const other = mountVisual('<p>Other</p>')
    selectOffsets(other, 0, 0)

    expect(insertHorizontalRuleInDocument(el)).toBe(false)
    expect(el.querySelector('hr')).toBeNull()
  })
})
