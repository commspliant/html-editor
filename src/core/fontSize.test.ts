import { afterEach, describe, expect, it } from 'vitest'
import { queryInheritedFontSize, setFontSizeInDocument } from './fontSize'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.style.fontSize = '16px'
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

describe('setFontSizeInDocument', () => {
  it('wraps a range with an inline font-size', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setFontSizeInDocument(el, 12, 'pt')).toBe(true)
    expect(el.querySelector('span')).toHaveStyle({ fontSize: '12pt' })
  })

  it('does nothing for a collapsed caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 2, 2)
    expect(setFontSizeInDocument(el, 18, 'px')).toBe(false)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })
})

describe('queryInheritedFontSize', () => {
  it('reads an authored pt size', () => {
    const el = mountVisual('<p><span style="font-size: 14pt">Hello</span></p>')
    selectOffsets(el, 0, 5)
    expect(queryInheritedFontSize(el)).toMatchObject({ value: 14, unit: 'pt', mixed: false })
  })

  it('reports mixed when sizes differ', () => {
    const el = mountVisual(
      '<p><span style="font-size: 12pt">Hi</span><span style="font-size: 18pt"> there</span></p>',
    )
    selectOffsets(el, 0, 8)
    expect(queryInheritedFontSize(el).mixed).toBe(true)
    expect(queryInheritedFontSize(el).value).toBeNull()
  })
})
