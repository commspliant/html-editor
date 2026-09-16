import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_TRUNCATED_COMMENT,
  MAX_EDITOR_HTML_CHARS,
  MAX_EDITOR_PAGE_COUNT,
  PAGE_SEPARATOR,
  PAGE_SURFACE_ATTR,
  clampDocumentPages,
  closestPageSurface,
  emptyPageHtml,
  joinPagesToHtml,
  mergePagesWithStructuralSharing,
  normalizePages,
  pagesArraysEqual,
  queryPageSurface,
  queryPageSurfaceIndex,
  splitPagesFromHtml,
  updatePageAt,
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

  it('closestPageSurface walks up from a nested node to the page surface', () => {
    const container = document.createElement('div')
    const surface = document.createElement('div')
    surface.setAttribute(PAGE_SURFACE_ATTR, '')
    const paragraph = document.createElement('p')
    const text = document.createTextNode('Hello')
    paragraph.append(text)
    surface.append(paragraph)
    container.append(surface)

    expect(closestPageSurface(text)).toBe(surface)
    expect(closestPageSurface(paragraph)).toBe(surface)
    expect(closestPageSurface(surface)).toBe(surface)
    expect(closestPageSurface(null)).toBeNull()
  })

  it('updatePageAt reuses the pages array when content is unchanged', () => {
    const pages = ['<p>One</p>', '<p>Two</p>']
    const result = updatePageAt(pages, 0, '<p>One</p>')
    expect(result.changed).toBe(false)
    expect(result.pages).toBe(pages)
  })

  it('mergePagesWithStructuralSharing keeps stable references for unchanged pages', () => {
    const current = ['<p>One</p>', '<p>Two</p>']
    const next = ['<p>One</p>', '<p>Two edited</p>']
    const merged = mergePagesWithStructuralSharing(current, next)
    expect(merged.changed).toBe(true)
    expect(merged.changedIndices).toEqual([1])
    expect(merged.pages[0]).toBe(current[0])
    expect(merged.pages[1]).toBe(next[1])
  })

  it('pagesArraysEqual compares slot content', () => {
    const a = ['<p>One</p>', '<p>Two</p>']
    const b = ['<p>One</p>', '<p>Two</p>']
    expect(pagesArraysEqual(a, b)).toBe(true)
    expect(pagesArraysEqual(a, ['<p>One</p>', '<p>Three</p>'])).toBe(false)
    expect(pagesArraysEqual(a, a)).toBe(true)
  })

  it('splitPagesFromHtml does not clamp oversized input (WE-024)', () => {
    const pages = Array.from({ length: MAX_EDITOR_PAGE_COUNT + 2 }, (_, i) => `<p>${i}</p>`)
    const joined = joinPagesToHtml(pages)
    expect(splitPagesFromHtml(joined)).toHaveLength(MAX_EDITOR_PAGE_COUNT + 2)
  })

  it('clampDocumentPages drops extra pages and marks the remainder (WE-024)', () => {
    const pages = Array.from({ length: MAX_EDITOR_PAGE_COUNT + 3 }, (_, i) => `<p>${i}</p>`)
    const clamped = clampDocumentPages(pages)
    expect(clamped.truncated).toBe(true)
    expect(clamped.pages).toHaveLength(MAX_EDITOR_PAGE_COUNT)
    expect(clamped.pages.at(-1)).toContain(DOCUMENT_TRUNCATED_COMMENT)
    expect(clamped.pages[0]).toBe('<p>0</p>')
  })

  it('clampDocumentPages drops trailing pages that exceed the HTML budget (WE-024)', () => {
    const huge = 'x'.repeat(MAX_EDITOR_HTML_CHARS - 10)
    const clamped = clampDocumentPages([huge, '<p>drop-me</p>', '<p>also</p>'])
    expect(clamped.truncated).toBe(true)
    expect(clamped.pages).toHaveLength(1)
    expect(clamped.pages[0]).toContain(DOCUMENT_TRUNCATED_COMMENT)
    expect(clamped.pages.join('')).not.toContain('drop-me')
  })

  it('clampDocumentPages is a no-op under the documented limits (WE-024)', () => {
    const pages = ['<p>One</p>', '<p>Two</p>']
    expect(clampDocumentPages(pages)).toEqual({ pages: ['<p>One</p>', '<p>Two</p>'], truncated: false })
  })
})
