import { documentsCanonicallyEqual, type HydrateEmbeddedImages } from './documentEquality'
import { EMBEDDED_IMAGE_ID_ATTR } from './imageRegistry'
import { bodyContainsTemplateSyntax, isTemplateTagSpan } from './templateTags'

const DATA_IMAGE_SRC =
  /^data:image\/(?:jpeg|jpg|png|gif|webp|bmp|avif)(?:;charset=[^;,]+)?;base64,/i

export type SyncVisualBodyHtmlOptions = {
  resolveDataUrl?: (id: string) => string | null
  hydrateEmbeddedImages?: HydrateEmbeddedImages
}

export type SyncVisualBodyHtmlResult = {
  changed: boolean
}

/** Stable fingerprint for an image node's binary/source content. */
export function resolveImageContentKey(
  img: HTMLImageElement,
  resolveDataUrl?: (id: string) => string | null,
): string {
  const id = img.getAttribute(EMBEDDED_IMAGE_ID_ATTR)?.trim()
  if (id && resolveDataUrl) {
    const dataUrl = resolveDataUrl(id)
    if (dataUrl) return `embedded:${dataUrl}`
  }
  const src = img.getAttribute('src')?.trim() ?? ''
  if (DATA_IMAGE_SRC.test(src)) return `embedded:${src}`
  if (src.startsWith('blob:') && id) return `registry:${id}`
  if (src) return `url:${src}`
  return 'empty'
}

function parseBodyFragment(html: string): HTMLElement {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body
}

const TR_INNER_HTML_PATTERN = /<tr(\s[^>]*)?>([\s\S]*?)<\/tr>/gi

function isOpenTagAt(html: string, index: number, tag: string): boolean {
  const lower = html.toLowerCase()
  const prefix = `<${tag}`
  if (lower.slice(index, index + prefix.length) !== prefix) return false
  const next = lower[index + prefix.length] ?? ''
  return next === '>' || next === '/' || /\s/.test(next)
}

function isCloseTagAt(html: string, index: number, tag: string): boolean {
  const lower = html.toLowerCase()
  const prefix = `</${tag}`
  if (lower.slice(index, index + prefix.length) !== prefix) return false
  const next = lower[index + prefix.length] ?? ''
  return next === '>' || /\s/.test(next)
}

function findMatchingEndTag(html: string, from: number, tag: string): number {
  let depth = 1
  let i = from
  const lower = html.toLowerCase()
  const openNeedle = `<${tag}`
  const closeNeedle = `</${tag}`
  while (i < html.length) {
    const nextOpen = lower.indexOf(openNeedle, i)
    const nextClose = lower.indexOf(closeNeedle, i)
    if (nextClose < 0) return -1
    if (nextOpen >= 0 && nextOpen < nextClose && isOpenTagAt(html, nextOpen, tag)) {
      depth += 1
      i = nextOpen + openNeedle.length
      continue
    }
    if (isCloseTagAt(html, nextClose, tag)) {
      depth -= 1
      if (depth === 0) return nextClose
      i = nextClose + closeNeedle.length
      continue
    }
    i = (nextClose >= 0 ? nextClose : i) + 1
  }
  return -1
}

function closeTagEnd(html: string, closeStart: number): number {
  const end = html.indexOf('>', closeStart)
  return end < 0 ? html.length : end + 1
}

function maskNestedTables(html: string): string {
  let out = html
  let searchFrom = 0
  while (searchFrom < out.length) {
    const lower = out.toLowerCase()
    const start = lower.indexOf('<table', searchFrom)
    if (start < 0) break
    if (!isOpenTagAt(out, start, 'table')) {
      searchFrom = start + 6
      continue
    }
    const tagEnd = out.indexOf('>', start)
    if (tagEnd < 0) break
    const closeAt = findMatchingEndTag(out, tagEnd + 1, 'table')
    if (closeAt < 0) break
    const end = closeTagEnd(out, closeAt)
    out = `${out.slice(0, start)}${' '.repeat(end - start)}${out.slice(end)}`
    searchFrom = end
  }
  return out
}

function extractTopLevelTrInners(tableInner: string): string[] {
  const masked = maskNestedTables(tableInner)
  const results: string[] = []
  let match: RegExpExecArray | null
  TR_INNER_HTML_PATTERN.lastIndex = 0
  while ((match = TR_INNER_HTML_PATTERN.exec(masked)) !== null) {
    const openEnd = tableInner.indexOf('>', match.index)
    if (openEnd < 0) continue
    const innerStart = openEnd + 1
    const innerEnd = innerStart + (match[2]?.length ?? 0)
    results.push(tableInner.slice(innerStart, innerEnd))
  }
  return results
}

/** Own-row inner HTML for each table, matching `querySelectorAll('table')` then that table's own rows. */
function extractOwnTrInnersByTable(html: string): string[][] {
  const result: string[][] = []

  const walk = (fragment: string): void => {
    let searchFrom = 0
    while (searchFrom < fragment.length) {
      const lower = fragment.toLowerCase()
      const start = lower.indexOf('<table', searchFrom)
      if (start < 0) break
      if (!isOpenTagAt(fragment, start, 'table')) {
        searchFrom = start + 6
        continue
      }
      const tagEnd = fragment.indexOf('>', start)
      if (tagEnd < 0) break
      const closeAt = findMatchingEndTag(fragment, tagEnd + 1, 'table')
      if (closeAt < 0) break
      const tableInner = fragment.slice(tagEnd + 1, closeAt)
      result.push(extractTopLevelTrInners(tableInner))
      walk(tableInner)
      searchFrom = closeTagEnd(fragment, closeAt)
    }
  }

  walk(html)
  return result
}

function tableOwnRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return [...table.querySelectorAll('tr')].filter((tr) => tr.closest('table') === table)
}

function hydrateTableRowFromSource(tr: HTMLTableRowElement, innerHtml: string): void {
  const range = document.createRange()
  range.selectNodeContents(tr)
  const fragment = range.createContextualFragment(innerHtml)
  tr.replaceChildren(...fragment.childNodes)
}

function rehydrateTableRowsFromSource(root: HTMLElement, sourceHtml: string): void {
  const byTable = extractOwnTrInnersByTable(sourceHtml)
  if (byTable.every((rows) => rows.length === 0)) return

  for (let tableIndex = 0; tableIndex < byTable.length; tableIndex += 1) {
    const inners = byTable[tableIndex]
    if (!inners || inners.length === 0) continue
    const table = root.querySelectorAll('table')[tableIndex]
    if (!(table instanceof HTMLTableElement)) continue
    tableOwnRows(table).forEach((tr, rowIndex) => {
      if (rowIndex >= inners.length) return
      hydrateTableRowFromSource(tr, inners[rowIndex]!)
    })
  }
}

function removeHoistedTemplateSpansFromTables(root: HTMLElement): void {
  const containers = [root, ...root.querySelectorAll('table, tbody, thead, tfoot')]
  for (const container of containers) {
    for (const child of [...container.childNodes]) {
      if (child instanceof Element && isTemplateTagSpan(child)) {
        child.remove()
      }
    }
  }
}

function applyBodyHtmlWithDomParser(root: HTMLElement, nextBodyHtml: string): void {
  const nextBody = parseBodyFragment(nextBodyHtml)
  root.replaceChildren(...nextBody.childNodes)

  if (/<tr[\s>]/i.test(nextBodyHtml)) {
    removeHoistedTemplateSpansFromTables(root)
    rehydrateTableRowsFromSource(root, nextBodyHtml)
  }
}

function copyElementAttributes(target: Element, source: Element): void {
  for (const attr of [...target.attributes]) {
    if (!source.hasAttribute(attr.name)) {
      target.removeAttribute(attr.name)
    }
  }
  for (const attr of [...source.attributes]) {
    target.setAttribute(attr.name, attr.value)
  }
}

function replaceImagesWithMarkers(root: HTMLElement, markerAttr: string): void {
  root.querySelectorAll('img').forEach((img, index) => {
    const marker = document.createElement('span')
    marker.setAttribute(markerAttr, String(index))
    img.replaceWith(marker)
  })
}

function serializeWithImageMarkers(root: HTMLElement, markerAttr: string): string {
  const clone = root.cloneNode(true) as HTMLElement
  replaceImagesWithMarkers(clone, markerAttr)
  return clone.innerHTML
}

function tryPreserveImageNodes(
  root: HTMLElement,
  nextBodyHtml: string,
  resolveDataUrl?: (id: string) => string | null,
): boolean {
  const nextBody = parseBodyFragment(nextBodyHtml)
  const currentImgs = [...root.querySelectorAll('img')] as HTMLImageElement[]
  const nextImgs = [...nextBody.querySelectorAll('img')]
  if (currentImgs.length === 0 || currentImgs.length !== nextImgs.length) return false

  const currentKeys = currentImgs.map((img) => resolveImageContentKey(img, resolveDataUrl))
  const nextKeys = nextImgs.map((img) => resolveImageContentKey(img as HTMLImageElement, resolveDataUrl))
  if (!currentKeys.every((key, index) => key === nextKeys[index])) return false

  const markerAttr = 'data-wysiwyg-img-marker'
  const currentStructure = serializeWithImageMarkers(root, markerAttr)
  const nextStructure = serializeWithImageMarkers(nextBody, markerAttr)
  if (currentStructure !== nextStructure) return false

  for (let index = 0; index < currentImgs.length; index += 1) {
    copyElementAttributes(currentImgs[index]!, nextImgs[index]!)
  }
  return true
}

/** Sync visual body HTML while preserving existing image nodes when possible. */
export function syncVisualBodyHtml(
  root: HTMLElement,
  nextBodyHtml: string,
  options: SyncVisualBodyHtmlOptions = {},
): SyncVisualBodyHtmlResult {
  const { resolveDataUrl, hydrateEmbeddedImages } = options

  if (bodyContainsTemplateSyntax(nextBodyHtml)) {
    if (root.innerHTML === nextBodyHtml) {
      return { changed: false }
    }
    applyBodyHtmlWithDomParser(root, nextBodyHtml)
    return { changed: true }
  }

  if (documentsCanonicallyEqual(root.innerHTML, nextBodyHtml, hydrateEmbeddedImages)) {
    return { changed: false }
  }

  if (root.innerHTML === nextBodyHtml) {
    return { changed: false }
  }

  if (tryPreserveImageNodes(root, nextBodyHtml, resolveDataUrl)) {
    return { changed: true }
  }

  root.innerHTML = nextBodyHtml
  return { changed: true }
}
