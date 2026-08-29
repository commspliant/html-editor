import { describe, expect, it } from 'vitest'
import {
  buildStandalonePrintDocument,
  extractEditorFragmentFromHtml,
} from './documentStyles'

const pageWithContainBg =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style>' +
  '<div data-page style="width:100%;height:100%;position:relative;isolation:isolate">' +
  '<div data-page-bg style="position:absolute;inset:0;background-image:url(&quot;https://example.com/bg.png&quot;);background-size:contain;background-position:center;background-repeat:no-repeat"></div>' +
  '<p>Hello</p></div>'

describe('buildStandalonePrintDocument', () => {
  it('wraps content in a full html document with embedded styles and no script', () => {
    const doc = buildStandalonePrintDocument('<p>Hello</p>')

    expect(doc).toMatch(/^<!DOCTYPE html>/i)
    expect(doc).toContain('<html lang="en">')
    expect(doc).toContain('<style>')
    expect(doc).toContain('<body>')
    expect(doc).toContain('<p>Hello</p>')
    expect(doc).not.toContain('<script')
  })

  it('applies explicit page dimensions for background bleed pages', () => {
    const doc = buildStandalonePrintDocument(pageWithContainBg)

    expect(doc).toContain('min-height: 297mm')
    expect(doc).toContain('width: 210mm')
    expect(doc).toContain('height: auto')
    expect(doc).toContain('padding: 20pt')
    expect(doc).toContain('background-size: contain')
    expect(doc).toContain('margin: 0 !important')
  })

  it('wraps multi-page documents with print page break wrappers', () => {
    const joined =
      '<p>One</p>\n<!-- wysiwyg-page-separator -->\n<p>Two</p>'
    const doc = buildStandalonePrintDocument(joined)

    expect(doc).toContain('data-wysiwyg-print-page')
    expect(doc).toContain('break-after: page')
    expect(doc).toContain('<p>One</p>')
    expect(doc).toContain('<p>Two</p>')
  })
})

describe('extractEditorFragmentFromHtml', () => {
  it('returns fragments unchanged', () => {
    const fragment = '<p>Hello</p>'
    expect(extractEditorFragmentFromHtml(fragment)).toBe(fragment)
  })

  it('extracts body content from standalone documents', () => {
    const standalone = buildStandalonePrintDocument(pageWithContainBg)
    const fragment = extractEditorFragmentFromHtml(standalone)

    expect(fragment).toContain('data-page')
    expect(fragment).toContain('data-page-bg')
    expect(fragment).not.toContain('<!DOCTYPE html>')
    expect(fragment).not.toContain('<html')
  })
})
