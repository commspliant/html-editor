import { writeDocumentHtml } from '../../core/documentStyles'
import { extractFontStylesheets } from '../../core/fontFamily'
import { collectPageAtRulesForPrint } from '../../core/pageAtRule'

const CLEANUP_MS = 1000

function mountPrintIframe(): { iframe: HTMLIFrameElement; doc: Document; win: Window } | null {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('data-wysiwyg-print', '')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.append(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    return null
  }
  return { iframe, doc, win }
}

function runPrint(doc: Document, win: Window, iframe: HTMLIFrameElement, html: string): void {
  writeDocumentHtml(doc, html)

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    iframe.remove()
  }

  win.addEventListener('afterprint', cleanup)

  win.focus()
  win.print()
  window.setTimeout(cleanup, CLEANUP_MS)
}

export function printHtml(html: string): void {
  const mounted = mountPrintIframe()
  if (!mounted) return
  runPrint(mounted.doc, mounted.win, mounted.iframe, html)
}

export function printPagesHtml(pages: readonly string[]): void {
  const mounted = mountPrintIframe()
  if (!mounted) return

  const hrefs: string[] = []
  const bodies: string[] = []
  for (const page of pages) {
    const extracted = extractFontStylesheets(page)
    hrefs.push(...extracted.hrefs)
    bodies.push(extracted.body)
  }

  const bodyHtml = bodies
    .map((body, index) => {
      const breakStyle = index < bodies.length - 1 ? 'page-break-after: always;' : ''
      return `<div style="${breakStyle}">${body}</div>`
    })
    .join('')

  const atRuleCss = collectPageAtRulesForPrint(pages)
  const combinedHtml = [
    atRuleCss ? `<style>${atRuleCss}</style>` : '',
    ...Array.from(new Set(hrefs)).map((href) => `<link rel="stylesheet" href="${href}" />`),
    bodyHtml,
  ]
    .filter(Boolean)
    .join('')

  runPrint(mounted.doc, mounted.win, mounted.iframe, combinedHtml)
}
