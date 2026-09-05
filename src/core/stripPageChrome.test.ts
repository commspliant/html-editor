import { describe, expect, it } from 'vitest'
import { stripPageChromeFromPageHtml } from './stripPageChrome'

const samplePageHtml =
  '<style data-page-at-rule="">@page { size: A4 portrait; margin: 72pt; }</style>' +
  '<div data-page style="width: 100%; height: auto;">' +
  '<p>sfasdfsd</p><p>fsdad</p><p>fsadffsad</p><p>fasdfds sa asd</p><p>&nbsp;sad</p>' +
  '</div>'

describe('stripPageChromeFromPageHtml', () => {
  it('removes @page style and unwraps the data-page shell', () => {
    const stripped = stripPageChromeFromPageHtml(samplePageHtml)
    expect(stripped).not.toContain('data-page-at-rule')
    expect(stripped).not.toContain('data-page')
    expect(stripped).toContain('<p>sfasdfsd</p>')
    expect(stripped).toContain('<p>&nbsp;sad</p>')
  })

  it('removes page background layers', () => {
    const html =
      '<style data-page-at-rule>@page { size: A4; }</style>' +
      '<div data-page><div data-page-bg style="background-image:url(&quot;https://example.com/bg.png&quot;)"></div><p>Hello</p></div>'
    const stripped = stripPageChromeFromPageHtml(html)
    expect(stripped).not.toContain('data-page-bg')
    expect(stripped).toBe('<p>Hello</p>')
  })

  it('leaves plain content unchanged', () => {
    const html = '<p>Hello</p>'
    expect(stripPageChromeFromPageHtml(html)).toBe(html)
  })
})
