import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { printHtml, printPagesHtml } from './printHtml'

type PrintWindow = {
  print: ReturnType<typeof vi.fn>
  focus: ReturnType<typeof vi.fn>
  addEventListener: (type: string, handler: EventListener) => void
}

function mockPrintIframe(options?: { doc?: Document | null; win?: PrintWindow | null }) {
  const iframe = document.createElement('iframe')
  const listeners: Record<string, EventListener> = {}
  const print = vi.fn()
  const focus = vi.fn()
  const fakeDoc = options && 'doc' in options ? options.doc : document.implementation.createHTMLDocument('')
  const fakeWin: PrintWindow | null =
    options && 'win' in options
      ? options.win
      : {
          print,
          focus,
          addEventListener: (type, handler) => {
            listeners[type] = handler
          },
        }

  Object.defineProperty(iframe, 'contentDocument', {
    configurable: true,
    get: () => fakeDoc,
  })
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    get: () => fakeWin,
  })

  const nativeCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag, elementOptions) => {
    if (String(tag).toLowerCase() === 'iframe') return iframe
    return nativeCreate(tag, elementOptions)
  })

  return { iframe, fakeDoc, print, focus, listeners }
}

describe('printHtml', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.querySelectorAll('[data-wysiwyg-print]').forEach((el) => el.remove())
  })

  it('prints the html fragment from a hidden iframe', () => {
    const { iframe, fakeDoc, print } = mockPrintIframe()

    printHtml('<p>Hello</p>')

    expect(iframe.getAttribute('aria-hidden')).toBe('true')
    expect(iframe.getAttribute('data-wysiwyg-print')).toBe('')
    expect(fakeDoc?.querySelector('style')?.textContent).toContain('@page')
    expect(fakeDoc?.querySelector('style')?.textContent).toContain('blockquote')
    expect(fakeDoc?.querySelector('style')?.textContent).toContain('print-color-adjust')
    expect(fakeDoc?.querySelector('style')?.textContent).toContain('[data-page-bg]')
    expect(fakeDoc?.title).toBe('\u200B')
    expect(fakeDoc?.body.innerHTML).toBe('<p>Hello</p>')
    expect(print).toHaveBeenCalledTimes(1)
    expect(document.body.contains(iframe)).toBe(true)
  })

  it('moves document font stylesheets into the print iframe head', () => {
    const { fakeDoc } = mockPrintIframe()
    const href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap'

    printHtml(`<link rel="stylesheet" href="${href}" data-wysiwyg-font=""><p>Hello</p>`)

    expect(fakeDoc?.head.querySelector(`link[href="${href}"]`)).not.toBeNull()
    expect(fakeDoc?.body.innerHTML).toBe('<p>Hello</p>')
  })

  it('does not let a closing body tag in the fragment break the print document', () => {
    const { fakeDoc } = mockPrintIframe()

    printHtml('<p>Break</p></body>')

    expect(fakeDoc?.querySelector('style')?.textContent).toContain('blockquote')
    expect(fakeDoc?.body.textContent).toContain('Break')
  })

  it('removes the iframe after print with a timeout fallback', () => {
    const { iframe } = mockPrintIframe()

    printHtml('<p>Doc</p>')
    expect(document.body.contains(iframe)).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(document.body.contains(iframe)).toBe(false)
  })

  it('removes the iframe on afterprint', () => {
    const { iframe, listeners } = mockPrintIframe()

    printHtml('<p>Doc</p>')
    listeners.afterprint?.(new Event('afterprint'))

    expect(document.body.contains(iframe)).toBe(false)
  })

  it('removes the iframe when the print document is unavailable', () => {
    const { iframe, print } = mockPrintIframe({ doc: null, win: null })

    printHtml('<p>Doc</p>')

    expect(document.body.contains(iframe)).toBe(false)
    expect(print).not.toHaveBeenCalled()
  })

  it('applies bleed styles and shell padding when a page background image is present', () => {
    const { fakeDoc } = mockPrintIframe()
    const pageHtml =
      '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style>' +
      '<div data-page style="position:relative;isolation:isolate">' +
      '<div data-page-bg style="background-image:url(&quot;https://example.com/bg.png&quot;)"></div>' +
      '<p>Hello</p></div>'

    printHtml(pageHtml)

    const styleText = fakeDoc?.querySelector('style')?.textContent ?? ''
    expect(styleText).toContain('body:has([data-page-bg])')
    expect(styleText).toContain('margin: 0 !important')
    const shell = fakeDoc?.querySelector('[data-page]') as HTMLElement
    expect(shell.style.paddingTop).toBe('20pt')
  })

  it('prints multiple pages with per-page fragmentation wrappers and break-after rules', () => {
    const { fakeDoc, print } = mockPrintIframe()

    printPagesHtml(['<p>Page 1</p>', '<p>Page 2</p>', '<p>Page 3</p>'])

    expect(print).toHaveBeenCalledTimes(1)
    const pages = fakeDoc?.querySelectorAll('[data-wysiwyg-print-page]')
    expect(pages).toHaveLength(3)
    expect(pages?.[0]?.getAttribute('style')).toContain('break-after: page')
    expect(pages?.[0]?.getAttribute('style')).toContain('page-break-after: always')
    expect(pages?.[1]?.getAttribute('style')).toContain('break-after: page')
    expect(pages?.[1]?.getAttribute('style')).toContain('page-break-after: always')
    expect(pages?.[2]?.getAttribute('style')).not.toContain('break-after: page')
    expect(pages?.[2]?.getAttribute('style')).toContain('break-inside: avoid')
  })

  it('preprocesses multi-page bodies with bleed and zeroes @page margins', () => {
    const { fakeDoc } = mockPrintIframe()
    const pageWithBg =
      '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style>' +
      '<div data-page><div data-page-bg style="background-image:url(&quot;https://example.com/bg.png&quot;)"></div><p>One</p></div>'
    const pagePlain = '<div data-page><p>Two</p></div>'

    printPagesHtml([pageWithBg, pagePlain])

    const bleedStyles = [...(fakeDoc?.querySelectorAll('style') ?? [])]
      .map((node) => node.textContent ?? '')
      .join('\n')
    expect(bleedStyles).toContain('margin: 0 !important')
    const firstShell = fakeDoc?.querySelector('[data-wysiwyg-print-page] [data-page]') as HTMLElement
    expect(firstShell.style.paddingTop).toBe('20pt')
  })
})
