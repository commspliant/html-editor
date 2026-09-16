import { describe, expect, it } from 'vitest'
import { PAGE_SEPARATOR, joinPagesToHtml } from './multiPage'
import { XSS_MULTI_PAGE_HTML, XSS_PAYLOADS } from './__fixtures__/xss-payloads'
import { sanitizeDocumentHtml, sanitizePageHtml } from './sanitizeHtml'

function expectNoXssSinks(html: string) {
  expect(html).not.toMatch(/<script\b/i)
  expect(html).not.toMatch(/\bon\w+\s*=/i)
  expect(html).not.toMatch(/javascript\s*:/i)
  expect(html).not.toMatch(/vbscript\s*:/i)
  expect(html).not.toMatch(/data\s*:\s*text\s*\/\s*html/i)
}

describe('sanitizePageHtml', () => {
  it('removes script tags and preserves other markup', () => {
    expect(sanitizePageHtml(XSS_PAYLOADS.scriptTag)).toBe('<p>Hello</p>')
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

  it('strips entity-encoded javascript hrefs (WE-002)', () => {
    for (const html of [
      XSS_PAYLOADS.entityEncodedJavascriptHref,
      XSS_PAYLOADS.hexEntityEncodedJavascriptHref,
      XSS_PAYLOADS.nestedEntityEncodedJavascriptHref,
    ]) {
      const result = sanitizePageHtml(html)
      expectNoXssSinks(result)
      expect(result).toContain('Link')
    }
  })

  it('strips onclick, onerror, and onmouseover (WE-001)', () => {
    expect(sanitizePageHtml(XSS_PAYLOADS.onclick)).not.toMatch(/\bonclick\b/i)
    expect(sanitizePageHtml(XSS_PAYLOADS.onclick)).toContain('Click')

    expect(sanitizePageHtml(XSS_PAYLOADS.onerror)).not.toMatch(/\bonerror\b/i)
    expect(sanitizePageHtml(XSS_PAYLOADS.onmouseover)).not.toMatch(/\bonmouseover\b/i)
    expect(sanitizePageHtml(XSS_PAYLOADS.onmouseover)).toContain('Hover')
  })

  it('does not preserve onclick on buttons', () => {
    const html = '<button onclick="alert(1)">Go</button>'
    const result = sanitizePageHtml(html)
    expect(result).not.toMatch(/\bonclick\b/i)
    expect(result).not.toMatch(/<button\b/i)
  })

  it('removes iframe, object, embed, form, input, and button (WE-007)', () => {
    const iframe = sanitizePageHtml(XSS_PAYLOADS.iframeSrcdoc)
    expect(iframe).not.toMatch(/<iframe\b/i)
    expect(iframe).not.toMatch(/\bsrcdoc\b/i)
    expect(iframe).toContain('Keep')

    const objects = sanitizePageHtml(XSS_PAYLOADS.objectEmbed)
    expect(objects).not.toMatch(/<object\b/i)
    expect(objects).not.toMatch(/<embed\b/i)
    expect(objects).toContain('Keep')

    const form = sanitizePageHtml(XSS_PAYLOADS.formInputButton)
    expect(form).not.toMatch(/<form\b/i)
    expect(form).not.toMatch(/<input\b/i)
    expect(form).not.toMatch(/<button\b/i)
    expect(form).toContain('Keep')
  })

  it('strips svg onload handlers', () => {
    const result = sanitizePageHtml(XSS_PAYLOADS.svgOnload)
    expect(result).not.toMatch(/\bonload\b/i)
    expect(result).toContain('Keep')
  })

  it('strips style @import while keeping other markup', () => {
    const result = sanitizePageHtml(XSS_PAYLOADS.styleImport)
    expect(result).not.toMatch(/@import/i)
    expect(result).toContain('Hi')
  })

  it('blocks data:image/svg+xml and file: URIs while allowing blob: (session images)', () => {
    const svg = sanitizePageHtml('<img src="data:image/svg+xml,<svg onload=alert(1)>" alt="x">')
    expect(svg).not.toMatch(/data\s*:\s*image\s*\/\s*svg\s*\+\s*xml/i)

    const file = sanitizePageHtml('<a href="file:///etc/passwd">Link</a>')
    expect(file).not.toMatch(/file\s*:/i)
    expect(file).toContain('Link')

    const blob = sanitizePageHtml('<img src="blob:https://example.com/11111111-1111-1111-1111-111111111111" alt="ok">')
    expect(blob).toContain('blob:')
    expect(blob).toContain('ok')
  })

  it('blocks vbscript: and data:text/html URIs (WE-008)', () => {
    const vbscript = sanitizePageHtml(XSS_PAYLOADS.vbscriptHref)
    expect(vbscript).not.toMatch(/vbscript\s*:/i)
    expect(vbscript).toContain('Link')

    const dataHtml = sanitizePageHtml(XSS_PAYLOADS.dataTextHtmlHref)
    expect(dataHtml).not.toMatch(/data\s*:\s*text\s*\/\s*html/i)
    expect(dataHtml).toContain('Link')
  })

  it('removes javascript: from style attributes', () => {
    const html = '<p style="color: red; background: url(javascript:alert(1))">Hi</p>'
    const result = sanitizePageHtml(html)
    expect(result).not.toContain('javascript:')
    expect(result).toContain('color: red')
  })

  it('preserves tables and safe inline styles needed for email', () => {
    const result = sanitizePageHtml(XSS_PAYLOADS.emailTable)
    expect(result).toMatch(/<table\b/i)
    expect(result).toMatch(/<td\b/i)
    expect(result).toContain('Cell')
    expect(result).toMatch(/style=/i)
    expect(result).toMatch(/color:\s*red/i)
  })

  it('is idempotent', () => {
    const html =
      '<p onclick="alert(1)">Hi</p><script>x</script><a href="javascript:alert(1)">x</a>' +
      XSS_PAYLOADS.iframeSrcdoc
    const once = sanitizePageHtml(html)
    expectNoXssSinks(once)
    expect(sanitizePageHtml(once)).toBe(once)
  })
})

describe('sanitizeDocumentHtml', () => {
  it('preserves multi-page separators', () => {
    const joined = joinPagesToHtml(['<p>One<script>x</script></p>', '<p>Two</p>'])
    const result = sanitizeDocumentHtml(joined)
    expect(result).toContain(PAGE_SEPARATOR)
    expect(result).not.toContain('<script')
    expect(result).toContain('<p>One</p>')
    expect(result).toContain('<p>Two</p>')
  })

  it('sanitizes script tags across PAGE_SEPARATOR joined HTML', () => {
    const result = sanitizeDocumentHtml(XSS_MULTI_PAGE_HTML)
    expect(result).toContain(PAGE_SEPARATOR)
    expectNoXssSinks(result)
    expect(result).toContain('Safe')
    expect(result).toContain('Two')
  })
})
