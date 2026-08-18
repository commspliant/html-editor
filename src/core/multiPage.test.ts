import { describe, expect, it } from 'vitest'
import {
  PAGE_SEPARATOR,
  emptyPageHtml,
  joinPagesToHtml,
  normalizePages,
  splitPagesFromHtml,
} from './multiPage'

describe('multiPage', () => {
  it('splits and joins pages with the separator marker', () => {
    const pages = ['<p>One</p>', '<p>Two</p>']
    const joined = joinPagesToHtml(pages)
    expect(joined).toContain(PAGE_SEPARATOR)
    expect(splitPagesFromHtml(joined)).toEqual(pages)
  })

  it('returns a single page when no separator is present', () => {
    expect(splitPagesFromHtml('<p>Only</p>')).toEqual(['<p>Only</p>'])
  })

  it('normalizes empty input to one empty page', () => {
    expect(normalizePages([])).toEqual([emptyPageHtml()])
  })

  it('joins a single page without a separator', () => {
    expect(joinPagesToHtml(['<p>One</p>'])).toBe('<p>One</p>')
  })
})
