import { afterEach, describe, expect, it } from 'vitest'
import {
  applyCustomParagraphInDocument,
  applyParagraphPropertiesInDocument,
  emptyParagraphPropertiesApply,
  paragraphApplyToStyle,
} from './paragraphProperties'

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

describe('applyParagraphPropertiesInDocument', () => {
  it('sets alignment, list, and box styles together', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    const draft = emptyParagraphPropertiesApply()
    draft.align = 'center'
    draft.list = 'ul'
    draft.margin = { ...draft.margin, top: { value: 8, unit: 'pt' } }

    expect(applyParagraphPropertiesInDocument(el, draft)).toBe(true)
    expect(el.querySelector('li')).toHaveStyle({ textAlign: 'center' })
    expect(el.querySelector('li')?.style.marginTop).toBe('8pt')
    expect(el.querySelector('ul')).not.toBeNull()
  })

  it('skips mixed align and list', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    const draft = emptyParagraphPropertiesApply()
    draft.align = 'center'
    draft.alignMixed = true
    draft.list = 'ol'
    draft.listMixed = true

    expect(applyParagraphPropertiesInDocument(el, draft)).toBe(false)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })
})

describe('applyCustomParagraphInDocument', () => {
  it('applies only defined style fields', () => {
    const el = mountVisual('<p style="margin-top: 8pt; background-color: #cc0000">Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyCustomParagraphInDocument(el, {
        align: 'right',
      }),
    ).toBe(true)

    const p = el.querySelector('p')
    expect(p).toHaveStyle({ textAlign: 'right' })
    expect(p?.style.marginTop).toBe('8pt')
    expect(p).toHaveStyle({ backgroundColor: 'rgb(204, 0, 0)' })
  })

  it('applies and clears block background and opacity from a style', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyCustomParagraphInDocument(el, {
        backgroundColor: '#00cc00',
        opacity: 0.5,
      }),
    ).toBe(true)

    const p = el.querySelector('p')
    expect(p).toHaveStyle({ backgroundColor: 'rgb(0, 204, 0)' })
    expect(p?.style.opacity).toBe('0.5')

    expect(
      applyCustomParagraphInDocument(el, {
        backgroundColor: null,
        opacity: null,
      }),
    ).toBe(true)
    expect(p?.style.backgroundColor).toBe('')
    expect(p?.style.opacity).toBe('')
  })

  it('applies and clears page-break fields from a style', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyCustomParagraphInDocument(el, {
        breakInside: 'avoid',
        breakAfter: 'page',
        breakBefore: 'avoid',
      }),
    ).toBe(true)

    const p = el.querySelector('p')
    expect(p?.style.breakInside).toBe('avoid')
    expect(p?.style.breakAfter).toBe('page')
    expect(p?.style.breakBefore).toBe('avoid')

    expect(
      applyCustomParagraphInDocument(el, {
        breakInside: 'auto',
        breakAfter: 'auto',
        breakBefore: 'auto',
      }),
    ).toBe(true)
    expect(p?.style.breakInside).toBe('')
    expect(p?.style.breakAfter).toBe('')
    expect(p?.style.breakBefore).toBe('')
  })
})

describe('paragraphApplyToStyle', () => {
  it('omits mixed groups', () => {
    const draft = emptyParagraphPropertiesApply()
    draft.align = 'center'
    draft.listMixed = true
    draft.marginMixed = true

    expect(paragraphApplyToStyle(draft)).toEqual({
      align: 'center',
      list: undefined,
      margin: undefined,
      padding: draft.padding,
      lineHeight: draft.lineHeight,
      border: draft.border,
      borderRadius: draft.borderRadius,
      boxShadow: draft.boxShadow,
      backgroundColor: draft.backgroundColor,
      opacity: draft.opacity,
      breakInside: draft.breakInside,
      breakAfter: draft.breakAfter,
      breakBefore: draft.breakBefore,
    })
  })
})
