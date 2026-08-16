import { afterEach, describe, expect, it } from 'vitest'
import {
  applyPendingInlineColor,
  normalizeCssColor,
  queryInheritedInlineColor,
  setInlineColorInDocument,
} from './inlineColor'
import { applyPendingFontMarksOnInsert } from './marks'

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

describe('normalizeCssColor', () => {
  it('normalizes hex, rgb, and named colors', () => {
    expect(normalizeCssColor('#Cc0000')).toBe('#cc0000')
    expect(normalizeCssColor('#f00')).toBe('#ff0000')
    expect(normalizeCssColor('rgb(204, 0, 0)')).toBe('#cc0000')
    expect(normalizeCssColor('red')).toBe('#ff0000')
  })

  it('treats transparent as no color', () => {
    expect(normalizeCssColor('transparent')).toBeNull()
    expect(normalizeCssColor('')).toBeNull()
  })
})

describe('setInlineColorInDocument', () => {
  it('wraps a range with an inline color', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setInlineColorInDocument(el, 'color', '#cc0000')).toBe(true)
    expect(el.querySelector('span')).toHaveStyle({ color: 'rgb(204, 0, 0)' })
  })

  it('wraps a range with a highlight background', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setInlineColorInDocument(el, 'backgroundColor', '#ffff00')).toBe(true)
    expect(el.querySelector('span')).toHaveStyle({ backgroundColor: 'rgb(255, 255, 0)' })
  })

  it('does nothing for a collapsed caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 2, 2)
    expect(setInlineColorInDocument(el, 'color', '#cc0000')).toBe(false)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('clears an authored color from a formatting span', () => {
    const el = mountVisual('<p><span style="color: #cc0000">Hello</span></p>')
    selectOffsets(el, 0, 5)

    expect(setInlineColorInDocument(el, 'color', null)).toBe(true)
    expect(el.querySelector('span')).toBeNull()
    expect(el.textContent).toBe('Hello')
  })
})

describe('queryInheritedInlineColor', () => {
  it('reads an authored color', () => {
    const el = mountVisual('<p><span style="color: #cc0000">Hello</span></p>')
    selectOffsets(el, 0, 5)
    expect(queryInheritedInlineColor(el, 'color')).toEqual({ value: '#cc0000', mixed: false })
  })

  it('reports mixed when colors differ', () => {
    const el = mountVisual(
      '<p><span style="color: #cc0000">Hi</span><span style="color: #0000cc"> there</span></p>',
    )
    selectOffsets(el, 0, 8)
    expect(queryInheritedInlineColor(el, 'color')).toEqual({ value: null, mixed: true })
  })

  it('reports no color when none is authored', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(queryInheritedInlineColor(el, 'color')).toEqual({ value: null, mixed: false })
  })
})

describe('pending inline color', () => {
  it('wraps inserted text with a pending font color', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    applyPendingFontMarksOnInsert(el, '!', {}, null, { color: { value: '#cc0000' } })
    expect(el.querySelector('span')).toHaveStyle({ color: 'rgb(204, 0, 0)' })
  })

  it('applies a pending highlight on a span', () => {
    const span = document.createElement('span')
    applyPendingInlineColor(span, 'backgroundColor', { value: '#ffff00' })
    expect(span).toHaveStyle({ backgroundColor: 'rgb(255, 255, 0)' })
  })
})
