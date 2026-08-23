import { describe, expect, it } from 'vitest'
import {
  PAGE_SEPARATOR,
  PAGE_SURFACE_ATTR,
  emptyPageHtml,
  joinPagesToHtml,
  normalizePages,
  queryPageSurface,
  queryPageSurfaceIndex,
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

  it('queryPageSurface finds a page by data-page-index without scanning all surfaces', () => {
    const container = document.createElement('div')
    const first = document.createElement('div')
    first.setAttribute(PAGE_SURFACE_ATTR, '')
    first.setAttribute('data-page-index', '0')
    const second = document.createElement('div')
    second.setAttribute(PAGE_SURFACE_ATTR, '')
    second.setAttribute('data-page-index', '1')
    container.append(first, second)

    expect(queryPageSurface(container, 1)).toBe(second)
    expect(queryPageSurface(container, 0)).toBe(first)
    expect(queryPageSurface(container, 2)).toBeNull()
  })

  it('queryPageSurfaceIndex resolves index from data-page-index and sibling order', () => {
    const container = document.createElement('div')
    const first = document.createElement('div')
    first.setAttribute(PAGE_SURFACE_ATTR, '')
    first.setAttribute('data-page-index', '0')
    const second = document.createElement('div')
    second.setAttribute(PAGE_SURFACE_ATTR, '')
    container.append(first, second)

    expect(queryPageSurfaceIndex(first)).toBe(0)
    expect(queryPageSurfaceIndex(second)).toBe(1)
  })
})
