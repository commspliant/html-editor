import { writeDocumentHtml } from '../../core/documentStyles'
import { extractFontStylesheets } from '../../core/fontFamily'
import { prepareDocumentHtmlForOutput } from '../../core/pagePrintBleed'
import { collectPageAtRulesForPrint } from '../../core/pageAtRule'

const CLEANUP_MS = 1000

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve(img.decode?.()).catch(() => undefined)
  }
  return new Promise<void>((resolve) => {
    const done = () => {
      void Promise.resolve(img.decode?.()).catch(() => undefined).then(() => resolve())
    }
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

export function waitForDocumentImages(doc: Document): Promise<void> {
  const images = [...doc.images]
  if (images.length === 0) return Promise.resolve()
  return Promise.all(images.map(waitForImage)).then(() => undefined)
}

function mountPrintIframe(): { iframe: HTMLIFrameElement; doc: Document; win: Window } | null {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('data-wysiwyg-print', '')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = '1px'
  iframe.style.height = '1px'
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

async function runPrint(doc: Document, win: Window, iframe: HTMLIFrameElement, html: string): Promise<void> {
  writeDocumentHtml(doc, html)

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    iframe.remove()
  }

  win.addEventListener('afterprint', cleanup)

  await waitForDocumentImages(doc)

  win.focus()
  win.print()
  window.setTimeout(cleanup, CLEANUP_MS)
}

export function printHtml(html: string): void {
  const mounted = mountPrintIframe()
  if (!mounted) return
  void runPrint(mounted.doc, mounted.win, mounted.iframe, html)
}

export function printPagesHtml(pages: readonly string[]): void {
  const mounted = mountPrintIframe()
  if (!mounted) return

  const preparedPages = pages.map(prepareDocumentHtmlForOutput)
  const hasBleed = preparedPages.some((page) => page.hasBleed)

  const hrefs: string[] = []
  const bodies: string[] = []
  for (const prepared of preparedPages) {
    const extracted = extractFontStylesheets(prepared.html)
    hrefs.push(...extracted.hrefs)
    bodies.push(extracted.body)
  }

  const bodyHtml = bodies
    .map((body, index) => {
      const isLast = index === bodies.length - 1
      const breakStyle = isLast
        ? 'display: block; break-inside: avoid; page-break-inside: avoid;'
        : 'display: block; break-after: page; page-break-after: always; break-inside: avoid; page-break-inside: avoid;'
      return `<div data-wysiwyg-print-page="" style="${breakStyle}">${body}</div>`
    })
    .join('')

  const atRuleCss = collectPageAtRulesForPrint(pages)
  const bleedMarginOverride = hasBleed ? '@page { margin: 0 !important; }' : ''
  const combinedHtml = [
    atRuleCss ? `<style>${atRuleCss}</style>` : '',
    bleedMarginOverride ? `<style>${bleedMarginOverride}</style>` : '',
    ...Array.from(new Set(hrefs)).map((href) => `<link rel="stylesheet" href="${href}" />`),
    bodyHtml,
  ]
    .filter(Boolean)
    .join('')

  void runPrint(mounted.doc, mounted.win, mounted.iframe, combinedHtml)
}
