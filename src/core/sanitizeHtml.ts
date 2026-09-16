import { joinPagesToHtml, splitPagesFromHtml } from './multiPage'

const BLOCKED_TAGS = new Set([
  'script',
  'iframe',
  'form',
  'input',
  'button',
  'object',
  'embed',
])

const URI_ATTRS = new Set([
  'href',
  'src',
  'srcset',
  'action',
  'formaction',
  'poster',
  'background',
  'cite',
  'data',
  'xlink:href',
])

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|colon);/gi, (match, entity: string) => {
      const lower = entity.toLowerCase()
      if (lower === 'amp') return '&'
      if (lower === 'lt') return '<'
      if (lower === 'gt') return '>'
      if (lower === 'quot') return '"'
      if (lower === 'colon') return ':'
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

function decodeUriValue(value: string): string {
  let current = value
  for (let i = 0; i < 3; i += 1) {
    const next = decodeHtmlEntities(current)
    if (next === current) break
    current = next
  }
  try {
    current = decodeURIComponent(current)
  } catch {
    /* keep partially decoded value */
  }
  return current
}

function compactUri(value: string): string {
  return decodeUriValue(value).replace(/[\u0000-\u001F\u007F\s]+/g, '')
}

/** True for javascript:, vbscript:, and data:text/html, including HTML-entity encodings. */
export function isDangerousUri(value: string): boolean {
  const compact = compactUri(value)
  if (/^(?:javascript|vbscript)\s*:/i.test(compact)) return true
  if (/^data\s*:\s*text\s*\/\s*html/i.test(compact)) return true
  return false
}

function isDangerousStyleChunk(chunk: string): boolean {
  const lower = chunk.toLowerCase()
  if (lower.includes('@import')) return true
  if (/\bexpression\s*\(/.test(lower)) return true
  if (lower.includes('-moz-binding')) return true
  if (/\bbehavior\s*:/.test(lower)) return true
  const colon = chunk.indexOf(':')
  if (colon <= 0) return false
  const propValue = chunk.slice(colon + 1)
  if (isDangerousUri(propValue)) return true
  if (/url\s*\(\s*["']?\s*(?:javascript|vbscript)/i.test(propValue)) return true
  return false
}

function sanitizeStyleAttribute(value: string): string {
  const chunks = value.split(';')
  if (!chunks.some((chunk) => isDangerousStyleChunk(chunk))) return value
  return chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk && !isDangerousStyleChunk(chunk))
    .join('; ')
}

function sanitizeCssText(css: string): string {
  const next = css
    .replace(/@import\b[^;]*;?/gi, '')
    .replace(/url\s*\(\s*['"]?\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^)]*\)/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/-moz-binding\s*:[^;]*/gi, '')
    .replace(/behavior\s*:[^;]*/gi, '')
  return next
}

function isSafeStylesheetLink(el: Element): boolean {
  const rel = (el.getAttribute('rel') ?? '').toLowerCase()
  if (!rel.split(/\s+/).includes('stylesheet')) return false
  const href = el.getAttribute('href') ?? ''
  try {
    const url = new URL(href)
    return (url.protocol === 'http:' || url.protocol === 'https:') && !isDangerousUri(href)
  } catch {
    return false
  }
}

function sanitizeElementAttributes(el: Element): boolean {
  let changed = false
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase()
    if (name.startsWith('on')) {
      el.removeAttribute(attr.name)
      changed = true
      continue
    }
    if (name === 'srcdoc') {
      el.removeAttribute(attr.name)
      changed = true
      continue
    }
    if (name === 'style') {
      const cleaned = sanitizeStyleAttribute(attr.value)
      if (!cleaned) {
        el.removeAttribute(attr.name)
        changed = true
      } else if (cleaned !== attr.value) {
        el.setAttribute(attr.name, cleaned)
        changed = true
      }
      continue
    }
    if (name === 'data-hover-html') {
      const cleaned = sanitizePageHtml(attr.value)
      if (cleaned !== attr.value) {
        el.setAttribute(attr.name, cleaned)
        changed = true
      }
      continue
    }
    const isUriAttr = URI_ATTRS.has(name) || name.endsWith('href') || name.endsWith('src')
    if (!isUriAttr) continue
    if (name === 'srcset') {
      const urls = attr.value.split(',').map((part) => part.trim().split(/\s+/)[0] ?? '')
      if (urls.some((url) => url && isDangerousUri(url))) {
        el.removeAttribute(attr.name)
        changed = true
      }
      continue
    }
    if (isDangerousUri(attr.value)) {
      el.removeAttribute(attr.name)
      changed = true
    }
  }
  return changed
}

function sanitizeRoot(root: ParentNode): boolean {
  let changed = false
  const elements =
    root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')]
  for (const el of elements) {
    if (!el.isConnected && el !== root) continue
    const tag = el.tagName.toLowerCase()
    if (BLOCKED_TAGS.has(tag)) {
      el.remove()
      changed = true
      continue
    }
    if (tag === 'link' && !isSafeStylesheetLink(el)) {
      el.remove()
      changed = true
      continue
    }
    if (sanitizeElementAttributes(el)) changed = true
    if (tag === 'style') {
      const current = el.textContent ?? ''
      const next = sanitizeCssText(current)
      if (next !== current) {
        el.textContent = next
        changed = true
      }
    }
  }
  return changed
}

function parsePageHtml(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

function serializePageBody(doc: Document): string {
  return doc.body.innerHTML
}

/** Strip XSS vectors from a single page HTML fragment. Keeps tables and inline styles. */
export function sanitizePageHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return html

  const doc = parsePageHtml(html)
  const changed = sanitizeRoot(doc.body)
  if (!changed) return html
  return serializePageBody(doc)
}

/** Strip XSS vectors from joined or single-page document HTML. */
export function sanitizeDocumentHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return html

  const pages = splitPagesFromHtml(html)
  if (pages.length === 1) return sanitizePageHtml(html)
  return joinPagesToHtml(pages.map(sanitizePageHtml))
}
