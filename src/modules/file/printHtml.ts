import { extractFontStylesheets } from '../../core/fontFamily'

const PRINT_DOCUMENT_STYLES = `
@page {
  margin: 0;
}
body {
  margin: 0;
  padding: 1.5cm;
  color: #111;
  background: #fff;
  font-family: system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}
p {
  margin: 0 0 0.75em;
}
p:last-child {
  margin-bottom: 0;
}
h1, h2, h3, h4, h5, h6 {
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: inherit;
}
h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child {
  margin-top: 0;
}
h1 { font-size: 1.75rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
h4 { font-size: 1.125rem; }
h5 { font-size: 1rem; }
h6 { font-size: 0.875rem; }
ul, ol {
  margin: 0 0 0.75em;
  padding-left: 1.5em;
}
li {
  margin: 0.25em 0;
}
a {
  color: #06c;
  text-decoration: underline;
}
strong, b { font-weight: 700; }
em, i { font-style: italic; }
u { text-decoration: underline; }
s { text-decoration: line-through; }
blockquote {
  margin: 0 0 0.75em;
  padding: 0 0 0 0.75em;
  border: 0;
  border-left: 3px solid #d0d0d0;
  color: #444;
}
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
  background: #f4f4f4;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
pre {
  margin: 0 0 0.75em;
  padding: 0.75em;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  background: #f4f4f4;
  border-radius: 4px;
}
pre code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}
hr {
  margin: 1em 0;
  border: 0;
  border-top: 1px solid #d0d0d0;
}
img {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}
`.trim()

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

  const { hrefs, body } = extractFontStylesheets(html)

  const charset = doc.createElement('meta')
  charset.setAttribute('charset', 'utf-8')
  const title = doc.createElement('title')
  // Empty title falls back to the host page title in Chromium print headers.
  title.textContent = '\u200B'
  const style = doc.createElement('style')
  style.textContent = PRINT_DOCUMENT_STYLES
  const fontLinks = hrefs.map((href) => {
    const link = doc.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    return link
  })
  doc.head.replaceChildren(charset, title, style, ...fontLinks)
  doc.title = '\u200B'
  doc.body.innerHTML = body

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
