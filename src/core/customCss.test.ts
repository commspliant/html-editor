import { afterEach, describe, expect, it } from 'vitest'
import {
  applyPendingCustomCss,
  compressCustomCss,
  formatCustomCssForDisplay,
  mergeCssDeclarations,
  parseCssDeclarations,
  queryCustomCssAtSelection,
  serializeCssDeclarations,
  setCustomCssInDocument,
} from './customCss'
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

function collapseAt(el: HTMLElement, offset: number) {
  selectOffsets(el, offset, offset)
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('parseCssDeclarations', () => {
  it('parses multiple declarations', () => {
    expect(parseCssDeclarations('color: red; font-size: 12px')).toEqual({
      color: 'red',
      'font-size': '12px',
    })
  })

  it('normalizes property names to lowercase', () => {
    expect(parseCssDeclarations('Color: blue')).toEqual({ color: 'blue' })
  })
})

describe('mergeCssDeclarations', () => {
  it('overrides matching properties and keeps others', () => {
    const existing = { color: 'red', 'font-size': '12px' }
    const overrides = { color: 'blue', 'font-weight': 'bold' }
    expect(mergeCssDeclarations(existing, overrides)).toEqual({
      color: 'blue',
      'font-size': '12px',
      'font-weight': 'bold',
    })
  })

  it('removes properties when override value is empty', () => {
    const existing = { color: 'red', 'font-size': '12px' }
    expect(mergeCssDeclarations(existing, { color: '' })).toEqual({
      'font-size': '12px',
    })
  })
})

describe('formatCustomCssForDisplay', () => {
  it('splits declarations onto separate lines', () => {
    expect(formatCustomCssForDisplay('color: red; font-size: 12px')).toBe(
      'color: red;\nfont-size: 12px;',
    )
  })
})

describe('compressCustomCss', () => {
  it('compresses multiline input to one row', () => {
    expect(compressCustomCss('color: red;\nfont-size: 12px')).toBe('color: red; font-size: 12px')
  })
})

describe('serializeCssDeclarations', () => {
  it('joins declarations with semicolons', () => {
    expect(serializeCssDeclarations({ color: 'red', 'font-size': '12px' })).toBe(
      'color: red; font-size: 12px',
    )
  })
})

describe('queryCustomCssAtSelection', () => {
  it('reads css from selected text', () => {
    const el = mountVisual('<p><span style="color: red">Hello</span></p>')
    selectOffsets(el, 0, 5)
    expect(queryCustomCssAtSelection(el)).toEqual({ value: 'color: red;', mixed: false })
  })

  it('reports mixed when styles differ', () => {
    const el = mountVisual(
      '<p><span style="color: red">A</span><span style="color: blue">B</span></p>',
    )
    selectOffsets(el, 0, 2)
    expect(queryCustomCssAtSelection(el)).toEqual({ value: null, mixed: true })
  })
})

describe('setCustomCssInDocument', () => {
  it('merges css onto selected text', () => {
    const el = mountVisual('<p><span style="color: red">Hello</span></p>')
    selectOffsets(el, 0, 5)
    setCustomCssInDocument(el, 'font-weight: bold')
    const span = el.querySelector('span')
    expect(span?.style.color).toBe('red')
    expect(span?.style.fontWeight).toBe('bold')
  })

  it('wraps unstyled selection', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    setCustomCssInDocument(el, 'color: green')
    expect(el.querySelector('span')).toHaveStyle({ color: 'rgb(0, 128, 0)' })
  })

  it('returns false for empty css', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(setCustomCssInDocument(el, '   ')).toBe(false)
  })

  it('returns false for collapsed selection', () => {
    const el = mountVisual('<p>Hello</p>')
    collapseAt(el, 2)
    expect(setCustomCssInDocument(el, 'color: red')).toBe(false)
  })

  it('removes a property via empty declaration', () => {
    const el = mountVisual('<p><span style="color: red; font-size: 12px">Hello</span></p>')
    selectOffsets(el, 0, 5)
    setCustomCssInDocument(el, 'color:')
    const span = el.querySelector('span')
    expect(span?.style.color).toBe('')
    expect(span?.style.fontSize).toBe('12px')
  })
})

describe('applyPendingCustomCss', () => {
  it('merges css onto a span', () => {
    const span = document.createElement('span')
    span.style.color = 'red'
    applyPendingCustomCss(span, 'font-weight: bold')
    expect(span.style.fontWeight).toBe('bold')
    expect(span.style.color).toBe('red')
  })
})

describe('applyPendingFontMarksOnInsert with custom css', () => {
  it('applies pending custom css at caret', () => {
    const el = mountVisual('<p>Hello</p>')
    collapseAt(el, 5)
    applyPendingFontMarksOnInsert(el, '!', {}, null, null, null, 'letter-spacing: 2px')
    const span = el.querySelector('span')
    expect(span?.textContent).toBe('!')
    expect(span?.style.letterSpacing).toBe('2px')
  })
})
