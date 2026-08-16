import { afterEach, describe, expect, it } from 'vitest'
import { canOutdentInDocument, indentInDocument, INDENT_STEP_PX, outdentInDocument } from './indent'

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

describe('indentInDocument', () => {
  it('adds a 40px left margin on a paragraph', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(indentInDocument(el)).toBe(true)
    expect(el.querySelector('p')).toHaveStyle({ marginLeft: `${INDENT_STEP_PX}px` })
  })

  it('steps margin by 40px each time', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    indentInDocument(el)
    indentInDocument(el)

    expect(el.querySelector('p')).toHaveStyle({ marginLeft: `${INDENT_STEP_PX * 2}px` })
  })

  it('nests a list item under the previous sibling', () => {
    const el = mountVisual('<ul><li>A</li><li>B</li></ul>')
    selectOffsets(el, 1, 2)

    expect(indentInDocument(el)).toBe(true)
    expect(el.innerHTML).toBe('<ul><li>A<ul><li>B</li></ul></li></ul>')
  })

  it('does not nest the first list item', () => {
    const el = mountVisual('<ul><li>A</li><li>B</li></ul>')
    selectOffsets(el, 0, 1)

    expect(indentInDocument(el)).toBe(false)
    expect(el.innerHTML).toBe('<ul><li>A</li><li>B</li></ul>')
  })
})

describe('outdentInDocument', () => {
  it('removes a 40px step and drops the property at 0', () => {
    const el = mountVisual(`<p style="margin-left: ${INDENT_STEP_PX}px">Hello</p>`)
    selectOffsets(el, 0, 5)

    expect(outdentInDocument(el)).toBe(true)
    expect(el.querySelector('p')?.getAttribute('style')).toBeNull()
  })

  it('clamps at zero', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(outdentInDocument(el)).toBe(false)
    expect(el.querySelector('p')?.getAttribute('style')).toBeNull()
  })

  it('unnests a nested list item', () => {
    const el = mountVisual('<ul><li>A<ul><li>B</li></ul></li></ul>')
    selectOffsets(el, 1, 2)

    expect(outdentInDocument(el)).toBe(true)
    expect(el.innerHTML).toBe('<ul><li>A</li><li>B</li></ul>')
  })

  it('unwraps a top-level list item to a paragraph and splits the list', () => {
    const el = mountVisual('<ul><li>A</li><li>B</li><li>C</li></ul>')
    selectOffsets(el, 1, 2)

    expect(outdentInDocument(el)).toBe(true)
    expect(el.innerHTML).toBe('<ul><li>A</li></ul><p>B</p><ul><li>C</li></ul>')
  })
})

describe('canOutdentInDocument', () => {
  it('is false on an unindented paragraph', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(canOutdentInDocument(el)).toBe(false)
  })

  it('is true on an indented paragraph', () => {
    const el = mountVisual(`<p style="margin-left: ${INDENT_STEP_PX}px">Hello</p>`)
    selectOffsets(el, 0, 5)
    expect(canOutdentInDocument(el)).toBe(true)
  })

  it('is true inside a list item', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 0, 5)
    expect(canOutdentInDocument(el)).toBe(true)
  })
})
