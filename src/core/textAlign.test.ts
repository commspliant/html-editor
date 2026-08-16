import { afterEach, describe, expect, it } from 'vitest'
import { queryTextAlign, setTextAlignInDocument } from './textAlign'

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

describe('setTextAlignInDocument', () => {
  it('sets text-align on a paragraph', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setTextAlignInDocument(el, 'center')).toBe(true)
    expect(el.querySelector('p')).toHaveStyle({ textAlign: 'center' })
  })

  it('sets justified alignment', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setTextAlignInDocument(el, 'justify')).toBe(true)
    expect(el.querySelector('p')).toHaveStyle({ textAlign: 'justify' })
  })

  it('keeps other inline styles on the block', () => {
    const el = mountVisual('<p style="color: red">Hello</p>')
    selectOffsets(el, 0, 5)

    setTextAlignInDocument(el, 'right')

    const p = el.querySelector('p')
    expect(p).toHaveStyle({ textAlign: 'right', color: 'rgb(255, 0, 0)' })
  })

  it('aligns every paragraph in a multi-block selection', () => {
    const el = mountVisual('<p>One</p><p>Two</p>')
    selectOffsets(el, 0, 6)

    setTextAlignInDocument(el, 'center')

    const paragraphs = el.querySelectorAll('p')
    expect(paragraphs[0]).toHaveStyle({ textAlign: 'center' })
    expect(paragraphs[1]).toHaveStyle({ textAlign: 'center' })
  })

  it('aligns a list item', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 0, 5)

    setTextAlignInDocument(el, 'center')

    expect(el.querySelector('li')).toHaveStyle({ textAlign: 'center' })
    expect(el.querySelector('ul')?.getAttribute('style')).toBeNull()
  })

  it('does not align table cells', () => {
    const el = mountVisual('<table><tr><td>Hello</td></tr></table>')
    selectOffsets(el, 0, 5)

    expect(setTextAlignInDocument(el, 'center')).toBe(false)
    expect(el.querySelector('td')?.getAttribute('style')).toBeNull()
  })

  it('is a no-op when the block already has that alignment', () => {
    const el = mountVisual('<p style="text-align: center">Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setTextAlignInDocument(el, 'center')).toBe(false)
  })
})

describe('queryTextAlign', () => {
  it('treats missing alignment as left', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(queryTextAlign(el)).toEqual({ align: 'left', mixed: false })
  })

  it('reads center from the caret block', () => {
    const el = mountVisual('<p style="text-align: center">Hello</p>')
    selectOffsets(el, 2, 2)
    expect(queryTextAlign(el)).toEqual({ align: 'center', mixed: false })
  })

  it('reports mixed when blocks differ', () => {
    const el = mountVisual('<p style="text-align: left">One</p><p style="text-align: center">Two</p>')
    selectOffsets(el, 0, 6)
    expect(queryTextAlign(el)).toEqual({ align: null, mixed: true })
  })
})
