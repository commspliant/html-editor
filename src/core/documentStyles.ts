import { extractFontStylesheets } from './fontFamily'
import { prepareDocumentHtmlForOutput } from './pagePrintBleed'

export const DOCUMENT_STYLES = `
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
[data-wysiwyg-page-break] {
  display: block;
  clear: both;
  break-after: page;
  page-break-after: always;
  height: 0;
  margin: 1.5em 0;
  border: 0;
  border-top: 2px dashed #bbb;
}
.wysiwyg-preview-page + .wysiwyg-preview-page {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px dashed #ccc;
}
.wysiwyg-preview-page:not(:last-child) {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
}
[data-page] > :not([data-page-bg]) {
  position: relative;
  z-index: 1;
}
[data-page],
[data-page-bg] {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
@media print {
  [data-wysiwyg-page-break] {
    display: block !important;
    clear: both !important;
    break-after: page !important;
    page-break-after: always !important;
    height: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    visibility: hidden !important;
  }
  .wysiwyg-preview-page + .wysiwyg-preview-page {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: 0 !important;
  }
}
`.trim()

export const DOCUMENT_BLEED_STYLES = `
body:has([data-page-bg]) {
  padding: 0;
}
[data-page] {
  box-sizing: border-box;
  min-height: 100%;
}
[data-wysiwyg-print-page] {
  min-height: 100vh;
  position: relative;
}
@media print {
  @page {
    margin: 0 !important;
  }
}
`.trim()

export function buildDocumentStyles(hasBleed: boolean): string {
  return hasBleed ? `${DOCUMENT_STYLES}\n${DOCUMENT_BLEED_STYLES}` : DOCUMENT_STYLES
}

/** Writes document HTML into an iframe document. Empty title is a zero-width space so Chromium print headers do not fall back to the host page title. */
export function writeDocumentHtml(doc: Document, html: string, title = '\u200B'): void {
  const prepared = prepareDocumentHtmlForOutput(html)
  const { hrefs, body } = extractFontStylesheets(prepared.html)

  const charset = doc.createElement('meta')
  charset.setAttribute('charset', 'utf-8')
  const titleEl = doc.createElement('title')
  titleEl.textContent = title
  const style = doc.createElement('style')
  style.textContent = buildDocumentStyles(prepared.hasBleed)
  const fontLinks = hrefs.map((href) => {
    const link = doc.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    return link
  })
  doc.head.replaceChildren(charset, titleEl, style, ...fontLinks)
  doc.title = title
  doc.body.innerHTML = body
}
