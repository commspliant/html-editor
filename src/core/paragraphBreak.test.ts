import { afterEach, describe, expect, it } from 'vitest'
import {
  parseBreakBeforeAfter,
  parseBreakInside,
  readParagraphBreak,
  writeBreakAfter,
  writeBreakBefore,
  writeBreakInside,
} from './paragraphBreak'

function mountParagraph(style = '') {
  const el = document.createElement('p')
  if (style) el.setAttribute('style', style)
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('parseBreakInside', () => {
  it('parses avoid and defaults to auto', () => {
    expect(parseBreakInside('avoid')).toBe('avoid')
    expect(parseBreakInside('AVOID')).toBe('avoid')
    expect(parseBreakInside('')).toBe('auto')
    expect(parseBreakInside('auto')).toBe('auto')
  })
})

describe('parseBreakBeforeAfter', () => {
  it('parses avoid, page, always, and defaults to auto', () => {
    expect(parseBreakBeforeAfter('avoid')).toBe('avoid')
    expect(parseBreakBeforeAfter('page')).toBe('page')
    expect(parseBreakBeforeAfter('always')).toBe('page')
    expect(parseBreakBeforeAfter('')).toBe('auto')
  })
})

describe('readParagraphBreak', () => {
  it('reads modern and legacy properties', () => {
    const modern = mountParagraph('break-inside: avoid; break-after: page; break-before: avoid')
    expect(readParagraphBreak(modern)).toEqual({
      breakInside: 'avoid',
      breakAfter: 'page',
      breakBefore: 'avoid',
    })

    const legacy = mountParagraph(
      'page-break-inside: avoid; page-break-after: always; page-break-before: avoid',
    )
    expect(readParagraphBreak(legacy)).toEqual({
      breakInside: 'avoid',
      breakAfter: 'page',
      breakBefore: 'avoid',
    })
  })
})

describe('writeBreakInside', () => {
  it('writes avoid with legacy pairing and clears on auto', () => {
    const el = mountParagraph()
    expect(writeBreakInside(el, 'avoid')).toBe(true)
    expect(el.style.breakInside).toBe('avoid')
    expect(el.style.pageBreakInside).toBe('avoid')
    expect(writeBreakInside(el, 'avoid')).toBe(false)

    expect(writeBreakInside(el, 'auto')).toBe(true)
    expect(el.style.breakInside).toBe('')
    expect(el.style.pageBreakInside).toBe('')
  })
})

describe('writeBreakAfter', () => {
  it('writes avoid and page with legacy pairing and clears on auto', () => {
    const el = mountParagraph()
    expect(writeBreakAfter(el, 'avoid')).toBe(true)
    expect(el.style.breakAfter).toBe('avoid')
    expect(el.style.pageBreakAfter).toBe('avoid')

    expect(writeBreakAfter(el, 'page')).toBe(true)
    expect(el.style.breakAfter).toBe('page')
    expect(el.style.pageBreakAfter).toBe('always')

    expect(writeBreakAfter(el, 'auto')).toBe(true)
    expect(el.style.breakAfter).toBe('')
    expect(el.style.pageBreakAfter).toBe('')
  })
})

describe('writeBreakBefore', () => {
  it('writes avoid and page with legacy pairing and clears on auto', () => {
    const el = mountParagraph()
    expect(writeBreakBefore(el, 'page')).toBe(true)
    expect(el.style.breakBefore).toBe('page')
    expect(el.style.pageBreakBefore).toBe('always')

    expect(writeBreakBefore(el, 'avoid')).toBe(true)
    expect(el.style.breakBefore).toBe('avoid')
    expect(el.style.pageBreakBefore).toBe('avoid')

    expect(writeBreakBefore(el, 'auto')).toBe(true)
    expect(el.style.breakBefore).toBe('')
    expect(el.style.pageBreakBefore).toBe('')
  })
})
