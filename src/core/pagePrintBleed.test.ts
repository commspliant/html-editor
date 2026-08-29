import { describe, expect, it } from 'vitest'
import { pageHasBackgroundBleed, prepareDocumentHtmlForOutput } from './pagePrintBleed'

const pageWithBg =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style>' +
  '<div data-page style="width:100%;height:100%;position:relative;isolation:isolate">' +
  '<div data-page-bg style="position:absolute;inset:0;background-image:url(&quot;https://example.com/bg.png&quot;)"></div>' +
  '<p>Hello</p></div>'

const pageWithoutBg =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'

describe('pageHasBackgroundBleed', () => {
  it('returns true when a page background image layer is present', () => {
    expect(pageHasBackgroundBleed(pageWithBg)).toBe(true)
  })

  it('returns false when no background image layer exists', () => {
    expect(pageHasBackgroundBleed(pageWithoutBg)).toBe(false)
  })
})

describe('prepareDocumentHtmlForOutput', () => {
  it('applies @page margins as shell padding when a background image is set', () => {
    const { html, hasBleed } = prepareDocumentHtmlForOutput(pageWithBg)
    expect(hasBleed).toBe(true)

    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    const shell = doc.querySelector('[data-page]') as HTMLElement
    expect(shell.style.paddingTop).toBe('20pt')
    expect(shell.style.paddingRight).toBe('20pt')
    expect(shell.style.paddingBottom).toBe('20pt')
    expect(shell.style.paddingLeft).toBe('20pt')
    expect(shell.style.boxSizing).toBe('border-box')
    expect(shell.style.position).toBe('relative')
  })

  it('leaves pages without a background image unchanged', () => {
    const { html, hasBleed } = prepareDocumentHtmlForOutput(pageWithoutBg)
    expect(hasBleed).toBe(false)

    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    const shell = doc.querySelector('[data-page]')
    expect(shell?.getAttribute('style')).toBeFalsy()
    expect(shell?.querySelector('p')?.textContent).toBe('Hello')
  })

  it('uses the larger of existing shell padding and @page margin per side', () => {
    const html =
      '<style data-page-at-rule>@page { size: A4; margin-top: 12pt; margin-right: 20pt; margin-bottom: 12pt; margin-left: 20pt; }</style>' +
      '<div data-page style="padding-top:24pt;padding-left:8pt">' +
      '<div data-page-bg style="background-image:url(&quot;https://example.com/bg.png&quot;)"></div>' +
      '<p>Hello</p></div>'

    const prepared = prepareDocumentHtmlForOutput(html)
    const doc = new DOMParser().parseFromString(`<body>${prepared.html}</body>`, 'text/html')
    const shell = doc.querySelector('[data-page]') as HTMLElement
    expect(shell.style.paddingTop).toBe('24pt')
    expect(shell.style.paddingLeft).toBe('20pt')
  })
})
