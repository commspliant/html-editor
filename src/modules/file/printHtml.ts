import { writeDocumentHtml } from '../../core/documentStyles'

const CLEANUP_MS = 1000

export function printHtml(html: string): void {
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
    return
  }

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
