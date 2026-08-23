import { joinPagesToHtml, splitPagesFromHtml } from './multiPage'

const SCRIPT_TAG = /<script\b[^>]*>[\s\S]*?<\/script>/gi

const JAVASCRIPT_URL = /^\s*javascript\s*:/i

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot);/gi, (match, entity: string) => {
      const lower = entity.toLowerCase()
      if (lower === 'amp') return '&'
      if (lower === 'lt') return '<'
      if (lower === 'gt') return '>'
      if (lower === 'quot') return '"'
      if (lower.startsWith('#x')) {
        const code = Number.parseInt(lower.slice(2), 16)
        return Number.isFinite(code) ? String.fromCodePoint(code) : match
      }
      if (lower.startsWith('#')) {
        const code = Number.parseInt(lower.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : match
      }
      return match
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) => {
      const code = Number.parseInt(octal, 8)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
}

function isJavascriptUrl(value: string): boolean {
  const decoded = decodeHtmlEntities(value).replace(/[\u0000-\u001F\u007F\s]+/g, '')
  return JAVASCRIPT_URL.test(decoded)
}

function stripJavascriptFromStyle(value: string): string {
  return value
    .split(';')
    .map((chunk) => chunk.trim())
    .filter((chunk) => {
      if (!chunk) return false
      const colon = chunk.indexOf(':')
      if (colon <= 0) return true
      const propValue = chunk.slice(colon + 1)
      return !isJavascriptUrl(propValue) && !/url\s*\(\s*["']?\s*javascript:/i.test(propValue)
    })
    .join('; ')
}

function sanitizeAttributes(root: ParentNode): void {
  const elements =
    root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')]
  for (const el of elements) {
    for (const attr of [...el.attributes]) {
      if (isJavascriptUrl(attr.value)) {
        el.removeAttribute(attr.name)
        continue
      }
      if (attr.name.toLowerCase() === 'style') {
        const cleaned = stripJavascriptFromStyle(attr.value)
        if (!cleaned) el.removeAttribute(attr.name)
        else if (cleaned !== attr.value) el.setAttribute(attr.name, cleaned)
      }
    }
  }
}

function parsePageHtml(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

function serializePageBody(doc: Document): string {
  return doc.body.innerHTML
}

/** Strip script tags and javascript: URLs from a single page HTML fragment. */
export function sanitizePageHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return html

  const withoutScripts = html.replace(SCRIPT_TAG, '')
  if (!/javascript\s*:/i.test(withoutScripts)) {
    return withoutScripts
  }

  const doc = parsePageHtml(withoutScripts)
  sanitizeAttributes(doc.body)
  return serializePageBody(doc)
}

/** Strip script tags and javascript: URLs from joined or single-page document HTML. */
export function sanitizeDocumentHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return html

  const pages = splitPagesFromHtml(html)
  if (pages.length === 1) return sanitizePageHtml(html)
  return joinPagesToHtml(pages.map(sanitizePageHtml))
}
