import { describe, expect, it } from 'vitest'
import { PAGE_SEPARATOR, joinPagesToHtml } from './multiPage'
import { sanitizeDocumentHtml, sanitizePageHtml } from './sanitizeHtml'

describe('sanitizePageHtml', () => {
  it('removes script tags and preserves other markup', () => {
    const html = '<p>Hello</p><script>alert(1)</script>'
    expect(sanitizePageHtml(html)).toBe('<p>Hello</p>')
  })

  it('removes multiline script tags case-insensitively', () => {
    const html = '<p>Hi</p><SCRIPT type="text/javascript">\nalert(1)\n</SCRIPT>'
    expect(sanitizePageHtml(html)).toBe('<p>Hi</p>')
  })

  it('removes javascript: href attributes', () => {
    const html = '<a href="javascript:alert(1)">Link</a>'
    const result = sanitizePageHtml(html)
    expect(result).not.toContain('javascript:')
    expect(result).toContain('Link')
  })

  it('removes javascript: from style attributes', () => {
    const html = '<p style="color: red; background: url(javascript:alert(1))">Hi</p>'
    const result = sanitizePageHtml(html)
    expect(result).not.toContain('javascript:')
    expect(result).toContain('color: red')
  })

  it('preserves onclick handlers', () => {
    const html = '<button onclick="alert(1)">Go</button>'
    expect(sanitizePageHtml(html)).toContain('onclick')
  })

  it('is idempotent', () => {
    const html = '<p>Hi</p><script>x</script><a href="javascript:alert(1)">x</a>'
    const once = sanitizePageHtml(html)
    expect(sanitizePageHtml(once)).toBe(once)
  })
})

describe('sanitizeDocumentHtml', () => {
  it('preserves multi-page separators', () => {
    const joined = joinPagesToHtml([
      '<p>One<script>x</script></p>',
      '<p>Two</p>',
    ])
    const result = sanitizeDocumentHtml(joined)
    expect(result).toContain(PAGE_SEPARATOR)
    expect(result).not.toContain('<script')
    expect(result).toContain('<p>One</p>')
    expect(result).toContain('<p>Two</p>')
  })
})
