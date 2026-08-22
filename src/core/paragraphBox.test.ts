import { afterEach, describe, expect, it } from 'vitest'
import {
  applyParagraphBoxInDocument,
  emptyParagraphBoxApply,
  parseBoxShadow,
  parseLineHeight,
  parseOpacity,
  queryParagraphBox,
  type ParagraphBoxApply,
} from './paragraphBox'

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

function apply(overrides: Partial<ParagraphBoxApply> = {}): ParagraphBoxApply {
  return { ...emptyParagraphBoxApply(), ...overrides }
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('parseLineHeight', () => {
  it('parses normal, unitless, and length values', () => {
    expect(parseLineHeight('normal')).toEqual({ kind: 'normal' })
    expect(parseLineHeight('1.5')).toEqual({ kind: 'number', value: 1.5 })
    expect(parseLineHeight('24px')).toEqual({ kind: 'length', value: 24, unit: 'px' })
    expect(parseLineHeight('')).toBeNull()
  })
})

describe('parseBoxShadow', () => {
  it('parses offset, blur, spread, color, and inset', () => {
    expect(parseBoxShadow('2px 4px 6px 1px #000000')).toEqual({
      offsetX: { value: 2, unit: 'px' },
      offsetY: { value: 4, unit: 'px' },
      blur: { value: 6, unit: 'px' },
      spread: { value: 1, unit: 'px' },
      color: '#000000',
      inset: false,
    })
    expect(parseBoxShadow('inset 0 2px 4px #cc0000')).toMatchObject({
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 2, unit: 'px' },
      blur: { value: 4, unit: 'px' },
      spread: { value: 0, unit: 'px' },
      color: '#cc0000',
      inset: true,
    })
    expect(parseBoxShadow('none')).toBeNull()
  })
})

describe('parseOpacity', () => {
  it('parses unitless and percent values and clamps to 0–1', () => {
    expect(parseOpacity('0.5')).toBe(0.5)
    expect(parseOpacity('50%')).toBe(0.5)
    expect(parseOpacity('2')).toBe(1)
    expect(parseOpacity('-1')).toBe(0)
    expect(parseOpacity('')).toBeNull()
  })
})

describe('applyParagraphBoxInDocument', () => {
  it('writes margin, padding, and line-height as inline styles', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyParagraphBoxInDocument(
        el,
        apply({
          margin: {
            top: { value: 8, unit: 'pt' },
            right: { value: 4, unit: 'pt' },
            bottom: { value: 8, unit: 'pt' },
            left: { value: 12, unit: 'pt' },
          },
          padding: {
            top: { value: 2, unit: 'px' },
            right: { value: 2, unit: 'px' },
            bottom: { value: 2, unit: 'px' },
            left: { value: 2, unit: 'px' },
          },
          lineHeight: { kind: 'number', value: 1.5 },
        }),
      ),
    ).toBe(true)

    const p = el.querySelector('p')
    expect(p?.style.marginTop).toBe('8pt')
    expect(p?.style.marginRight).toBe('4pt')
    expect(p?.style.marginBottom).toBe('8pt')
    expect(p?.style.marginLeft).toBe('12pt')
    expect(p?.style.paddingTop).toBe('2px')
    expect(p?.style.lineHeight).toBe('1.5')
  })

  it('writes uniform border, radius, and box-shadow', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyParagraphBoxInDocument(
      el,
      apply({
        border: { style: 'dotted', width: { value: 1, unit: 'px' }, color: '#cc0000' },
        borderRadius: { value: 6, unit: 'px' },
        boxShadow: {
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 4, unit: 'px' },
          blur: { value: 8, unit: 'px' },
          spread: { value: 0, unit: 'px' },
          color: '#000000',
          inset: false,
        },
      }),
    )

    const p = el.querySelector('p')
    expect(p?.style.borderStyle).toBe('dotted')
    expect(p?.style.borderWidth).toBe('1px')
    expect(p).toHaveStyle({ borderColor: 'rgb(204, 0, 0)' })
    expect(p?.style.borderRadius).toBe('6px')
    expect(p?.style.boxShadow).toContain('4px')
  })

  it('clears inline box properties when values are empty', () => {
    const el = mountVisual(
      '<p style="margin-top: 8pt; line-height: 2; border: 1px solid #000; border-radius: 4px; box-shadow: 0 2px 4px #000">Hello</p>',
    )
    selectOffsets(el, 0, 5)

    applyParagraphBoxInDocument(el, apply())

    const p = el.querySelector('p')
    expect(p?.getAttribute('style')).toBeNull()
  })

  it('skips mixed groups', () => {
    const el = mountVisual('<p style="margin-top: 8pt">Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyParagraphBoxInDocument(
        el,
        apply({
          marginMixed: true,
          margin: {
            top: { value: 20, unit: 'pt' },
            right: null,
            bottom: null,
            left: null,
          },
        }),
      ),
    ).toBe(false)
    expect(el.querySelector('p')?.style.marginTop).toBe('8pt')
  })

  it('clamps negative padding to zero', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyParagraphBoxInDocument(
      el,
      apply({
        padding: {
          top: { value: -4, unit: 'px' },
          right: null,
          bottom: null,
          left: null,
        },
      }),
    )

    expect(el.querySelector('p')?.style.paddingTop).toBe('0px')
  })

  it('allows negative margin', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyParagraphBoxInDocument(
      el,
      apply({
        margin: {
          top: null,
          right: null,
          bottom: null,
          left: { value: -8, unit: 'px' },
        },
      }),
    )

    expect(el.querySelector('p')?.style.marginLeft).toBe('-8px')
  })

  it('writes background-color and opacity on the block, not highlight spans', () => {
    const el = mountVisual('<p>Hello <span style="background-color: #ffff00">x</span></p>')
    selectOffsets(el, 0, 5)

    expect(
      applyParagraphBoxInDocument(
        el,
        apply({
          backgroundColor: '#cc0000',
          opacity: 0.5,
        }),
      ),
    ).toBe(true)

    const p = el.querySelector('p')
    const span = el.querySelector('span')
    expect(p).toHaveStyle({ backgroundColor: 'rgb(204, 0, 0)' })
    expect(p?.style.opacity).toBe('0.5')
    expect(span).toHaveStyle({ backgroundColor: 'rgb(255, 255, 0)' })
    expect(span?.style.opacity).toBe('')
  })

  it('clears block background-color and opacity', () => {
    const el = mountVisual('<p style="background-color: #cc0000; opacity: 0.4">Hello</p>')
    selectOffsets(el, 0, 5)

    applyParagraphBoxInDocument(el, apply())

    const p = el.querySelector('p')
    expect(p?.getAttribute('style')).toBeNull()
  })

  it('skips mixed background and opacity', () => {
    const el = mountVisual('<p style="background-color: #cc0000; opacity: 0.4">Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyParagraphBoxInDocument(
        el,
        apply({
          backgroundMixed: true,
          backgroundColor: '#00ff00',
          opacityMixed: true,
          opacity: 1,
        }),
      ),
    ).toBe(false)
    expect(el.querySelector('p')).toHaveStyle({ backgroundColor: 'rgb(204, 0, 0)' })
    expect(el.querySelector('p')?.style.opacity).toBe('0.4')
  })

  it('applies page-break styles with legacy pairing', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyParagraphBoxInDocument(
        el,
        apply({
          breakInside: 'avoid',
          breakAfter: 'page',
          breakBefore: 'avoid',
        }),
      ),
    ).toBe(true)

    const p = el.querySelector('p')
    expect(p?.style.breakInside).toBe('avoid')
    expect(p?.style.pageBreakInside).toBe('avoid')
    expect(p?.style.breakAfter).toBe('page')
    expect(p?.style.pageBreakAfter).toBe('always')
    expect(p?.style.breakBefore).toBe('avoid')
    expect(p?.style.pageBreakBefore).toBe('avoid')
  })

  it('clears page-break styles on auto', () => {
    const el = mountVisual(
      '<p style="break-inside: avoid; break-after: page; break-before: avoid">Hello</p>',
    )
    selectOffsets(el, 0, 5)

    expect(applyParagraphBoxInDocument(el, apply())).toBe(true)
    const p = el.querySelector('p')
    expect(p?.style.breakInside).toBe('')
    expect(p?.style.breakAfter).toBe('')
    expect(p?.style.breakBefore).toBe('')
  })
})

describe('queryParagraphBox', () => {
  it('reads authored inline styles from the caret block', () => {
    const el = mountVisual('<p style="margin-top: 8pt; line-height: 1.5">Hello</p>')
    selectOffsets(el, 2, 2)

    const query = queryParagraphBox(el)
    expect(query.margin.top).toEqual({ value: 8, unit: 'pt' })
    expect(query.lineHeight).toEqual({ kind: 'number', value: 1.5 })
    expect(query.marginMixed).toBe(false)
  })

  it('reports mixed when blocks differ', () => {
    const el = mountVisual(
      '<p style="margin-top: 8pt">One</p><p style="margin-top: 16pt">Two</p>',
    )
    selectOffsets(el, 0, 6)

    const query = queryParagraphBox(el)
    expect(query.marginMixed).toBe(true)
    expect(query.margin.top).toEqual({ value: 8, unit: 'pt' })
  })

  it('reports mixed background-color and opacity when blocks differ', () => {
    const el = mountVisual(
      '<p style="background-color: #cc0000; opacity: 0.4">One</p><p style="background-color: #00cc00; opacity: 0.8">Two</p>',
    )
    selectOffsets(el, 0, 6)

    const query = queryParagraphBox(el)
    expect(query.backgroundMixed).toBe(true)
    expect(query.backgroundColor).toBe('#cc0000')
    expect(query.opacityMixed).toBe(true)
    expect(query.opacity).toBe(0.4)
  })

  it('reads and reports mixed page-break styles', () => {
    const el = mountVisual(
      '<p style="break-inside: avoid; break-after: page">One</p><p style="break-inside: auto; break-after: avoid">Two</p>',
    )
    selectOffsets(el, 0, 6)

    const query = queryParagraphBox(el)
    expect(query.breakInside).toBe('avoid')
    expect(query.breakInsideMixed).toBe(true)
    expect(query.breakAfter).toBe('page')
    expect(query.breakAfterMixed).toBe(true)
    expect(query.breakBefore).toBe('auto')
    expect(query.breakBeforeMixed).toBe(false)
  })
})
