import { afterEach, describe, expect, it } from 'vitest'
import {
  applyPendingFontMarksOnInsert,
  emptyFontMarkState,
  mergePendingFontMarks,
  queryInheritedFontMarks,
  toggleFontMarkInDocument,
  togglePendingFontMark,
} from './marks'

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

describe('toggleFontMarkInDocument', () => {
  it('wraps a range in a bold inline style', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(toggleFontMarkInDocument(el, 'bold')).toBe(true)
    expect(el.innerHTML).toBe('<p><span style="font-weight: 700;">Hello</span></p>')
  })

  it('unwraps a bold span', () => {
    const el = mountVisual('<p><span style="font-weight: 700">Hello</span></p>')
    selectOffsets(el, 0, 5)

    expect(toggleFontMarkInDocument(el, 'bold')).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('treats strong as bold and unwraps it', () => {
    const el = mountVisual('<p><strong>Hello</strong></p>')
    selectOffsets(el, 0, 5)

    expect(queryInheritedFontMarks(el).bold).toBe(true)
    expect(toggleFontMarkInDocument(el, 'bold')).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('wraps italic with font-style', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    toggleFontMarkInDocument(el, 'italic')
    expect(el.innerHTML).toBe('<p><span style="font-style: italic;">Hello</span></p>')
  })

  it('merges underline onto an existing strikethrough span', () => {
    const el = mountVisual('<p><span style="text-decoration-line: line-through">Hello</span></p>')
    selectOffsets(el, 0, 5)

    toggleFontMarkInDocument(el, 'underline')
    const span = el.querySelector('span') as HTMLElement
    expect(span.style.textDecorationLine).toContain('line-through')
    expect(span.style.textDecorationLine).toContain('underline')
  })

  it('removes only underline from a combined decoration', () => {
    const el = mountVisual(
      '<p><span style="text-decoration-line: underline line-through">Hello</span></p>',
    )
    selectOffsets(el, 0, 5)

    toggleFontMarkInDocument(el, 'underline')
    const span = el.querySelector('span') as HTMLElement
    expect(span.style.textDecorationLine).toBe('line-through')
    expect(span.style.fontWeight).toBe('')
  })

  it('applies a mark to a partial word without wrapping the rest', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 1, 4)

    toggleFontMarkInDocument(el, 'bold')
    expect(el.innerHTML).toBe('<p>H<span style="font-weight: 700;">ell</span>o</p>')
  })

  it('does nothing for a collapsed caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 2, 2)

    expect(toggleFontMarkInDocument(el, 'bold')).toBe(false)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })
})

describe('queryInheritedFontMarks', () => {
  it('detects semantic italic and underline tags', () => {
    const el = mountVisual('<p><em>Hi</em> <u>there</u></p>')
    selectOffsets(el, 0, 2)
    expect(queryInheritedFontMarks(el)).toMatchObject({ italic: true, underline: false })

    selectOffsets(el, 3, 8)
    expect(queryInheritedFontMarks(el)).toMatchObject({ italic: false, underline: true })
  })

  it('requires the whole range to carry the mark', () => {
    const el = mountVisual('<p><strong>Hi</strong> there</p>')
    selectOffsets(el, 0, 8)
    expect(queryInheritedFontMarks(el).bold).toBe(false)
  })
})

describe('pending font marks', () => {
  it('toggles an override and clears it when it matches inherited', () => {
    const inherited = { ...emptyFontMarkState(), bold: true }
    const pending = togglePendingFontMark({}, inherited, 'bold')
    expect(pending).toEqual({ bold: false })
    expect(togglePendingFontMark(pending, inherited, 'bold')).toEqual({})
  })

  it('merges pending overrides onto inherited state', () => {
    const inherited = { ...emptyFontMarkState(), italic: true }
    expect(mergePendingFontMarks(inherited, { bold: true, italic: false })).toEqual({
      bold: true,
      italic: false,
      underline: false,
      strikethrough: false,
    })
  })

  it('wraps inserted text with pending additive marks', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    applyPendingFontMarksOnInsert(el, '!', { bold: true })
    expect(el.innerHTML).toBe('<p>Hi<span style="font-weight: 700;">!</span></p>')
  })

  it('wraps inserted text with a pending font size', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    applyPendingFontMarksOnInsert(el, '!', {}, { value: 18, unit: 'pt' })
    expect(el.querySelector('span')).toHaveStyle({ fontSize: '18pt' })
  })

  it('wraps inserted text with a pending font family', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    applyPendingFontMarksOnInsert(el, '!', {}, null, null, { value: 'Georgia, serif' })
    expect(el.querySelector('span')).toHaveStyle({ fontFamily: 'Georgia, serif' })
  })

  it('leaves the caret inside the styled span so further typing keeps the format', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    applyPendingFontMarksOnInsert(el, '!', { bold: true })
    const span = el.querySelector('span')
    const sel = window.getSelection()
    expect(span).not.toBeNull()
    expect(span?.contains(sel?.anchorNode ?? null)).toBe(true)

    const text = span?.firstChild as Text
    text.insertData(text.length, '?')
    expect(span).toHaveTextContent('!?')
    expect(span).toHaveStyle({ fontWeight: '700' })
  })
})
