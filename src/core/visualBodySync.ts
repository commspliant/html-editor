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

/** Source-order inner HTML for each `<tr>` (supports nested tables via non-greedy match). */
function extractTrInnerHtmlFragments(html: string): string[] {
  const results: string[] = []
  let match: RegExpExecArray | null
  TR_INNER_HTML_PATTERN.lastIndex = 0
  while ((match = TR_INNER_HTML_PATTERN.exec(html)) !== null) {
    results.push(match[2] ?? '')
  }
  return results
}

function hydrateTableRowFromSource(tr: HTMLTableRowElement, innerHtml: string): void {
  const range = document.createRange()
  range.selectNodeContents(tr)
  const fragment = range.createContextualFragment(innerHtml)
  tr.replaceChildren(...fragment.childNodes)
}

function rehydrateTableRowsFromSource(root: HTMLElement, sourceHtml: string): void {
  const trInners = extractTrInnerHtmlFragments(sourceHtml)
  if (trInners.length === 0) return

  let trIndex = 0
  root.querySelectorAll('tr').forEach((tr) => {
    if (trIndex >= trInners.length) return
    hydrateTableRowFromSource(tr, trInners[trIndex]!)
    trIndex += 1
  })
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
