import { afterEach, describe, expect, it } from 'vitest'
import { queryList, setListInDocument, toggleListInDocument } from './lists'

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

describe('toggleListInDocument', () => {
  it('wraps a paragraph in a bullet list', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(toggleListInDocument(el, 'ul')).toBe(true)
    expect(el.innerHTML).toBe('<ul><li>Hello</li></ul>')
  })

  it('wraps a paragraph in a numbered list', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(toggleListInDocument(el, 'ol')).toBe(true)
    expect(el.innerHTML).toBe('<ol><li>Hello</li></ol>')
  })

  it('wraps multiple paragraphs as one list', () => {
    const el = mountVisual('<p>One</p><p>Two</p>')
    selectOffsets(el, 0, 6)

    toggleListInDocument(el, 'ul')

    expect(el.innerHTML).toBe('<ul><li>One</li><li>Two</li></ul>')
  })

  it('keeps inline marks inside the list item', () => {
    const el = mountVisual('<p><strong>Hi</strong></p>')
    selectOffsets(el, 0, 2)

    toggleListInDocument(el, 'ul')

    expect(el.innerHTML).toBe('<ul><li><strong>Hi</strong></li></ul>')
  })

  it('unwraps a bullet list back to paragraphs', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 0, 5)

    expect(toggleListInDocument(el, 'ul')).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('converts a bullet list to a numbered list', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 0, 5)

    expect(toggleListInDocument(el, 'ol')).toBe(true)
    expect(el.innerHTML).toBe('<ol><li>Hello</li></ol>')
  })

  it('does not wrap table cells', () => {
    const el = mountVisual('<table><tr><td>Hello</td></tr></table>')
    selectOffsets(el, 0, 5)

    expect(toggleListInDocument(el, 'ul')).toBe(false)
    expect(el.querySelector('td')?.innerHTML).toBe('Hello')
  })
})

describe('setListInDocument', () => {
  it('wraps a paragraph without toggling off an existing list', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setListInDocument(el, 'ul')).toBe(true)
    expect(el.innerHTML).toBe('<ul><li>Hello</li></ul>')
    expect(setListInDocument(el, 'ul')).toBe(false)
    expect(el.innerHTML).toBe('<ul><li>Hello</li></ul>')
  })

  it('unwraps a list when type is null', () => {
    const el = mountVisual('<ol><li>Hello</li></ol>')
    selectOffsets(el, 0, 5)

    expect(setListInDocument(el, null)).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })
})

describe('queryList', () => {
  it('returns no list on a paragraph', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(queryList(el)).toEqual({ type: null, mixed: false })
  })

  it('reads a bullet list at the caret', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 2, 2)
    expect(queryList(el)).toEqual({ type: 'ul', mixed: false })
  })

  it('reports mixed when list types differ', () => {
    const el = mountVisual('<ul><li>One</li></ul><ol><li>Two</li></ol>')
    selectOffsets(el, 0, 6)
    expect(queryList(el)).toEqual({ type: null, mixed: true })
  })
})
