export const EMBEDDED_IMAGE_ID_ATTR = 'data-wysiwyg-img-id'

const PAGE_BG_LAYER_ATTR = 'data-page-bg'

const DATA_IMAGE_SRC =
  /^data:image\/(?:jpeg|jpg|png|gif|webp|bmp|avif)(?:;charset=[^;,]+)?;base64,/i

const BACKGROUND_IMAGE_URL_RE = /background-image:\s*url\(\s*(["']?)(.+?)\1\s*\)/i

export type ImageRegistryEntry = {
  dataUrl: string
  objectUrl: string
}

export type ImageRegistry = {
  register: (dataUrl: string, id?: string) => string
  getDataUrl: (id: string) => string | null
  getObjectUrl: (id: string) => string | null
  has: (id: string) => boolean
  externalizeHtml: (html: string) => string
  hydrateHtml: (html: string) => string
  clear: () => void
}

function parseHtmlFragment(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

function serializeHtmlFragment(doc: Document): string {
  return doc.body.innerHTML
}

function isEmbeddedDataImageSrc(src: string): boolean {
  return DATA_IMAGE_SRC.test(src.trim())
}

function htmlMayContainEmbeddedImages(html: string): boolean {
  return (
    html.includes('<img') ||
    html.includes('IMG') ||
    html.includes(PAGE_BG_LAYER_ATTR) ||
    html.includes(EMBEDDED_IMAGE_ID_ATTR)
  )
}

function readBackgroundImageUrlFromStyle(style: string): string | null {
  const match = BACKGROUND_IMAGE_URL_RE.exec(style)
  if (!match) return null
  const src = match[2]?.trim() ?? ''
  return src || null
}

function writeBackgroundImageUrlToStyle(style: string, url: string): string {
  const escaped = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const nextValue = `url("${escaped}")`
  if (BACKGROUND_IMAGE_URL_RE.test(style)) {
    return style.replace(BACKGROUND_IMAGE_URL_RE, `background-image: ${nextValue}`)
  }
  const trimmed = style.trim().replace(/;+$/, '')
  return trimmed ? `${trimmed};background-image: ${nextValue}` : `background-image: ${nextValue}`
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createImageRegistry(): ImageRegistry {
  const entries = new Map<string, ImageRegistryEntry>()

  function ensureObjectUrl(id: string, dataUrl: string): string {
    const existing = entries.get(id)
    if (existing) {
      if (existing.dataUrl !== dataUrl) {
        URL.revokeObjectURL(existing.objectUrl)
        const objectUrl = URL.createObjectURL(dataUrlToBlob(dataUrl))
        entries.set(id, { dataUrl, objectUrl })
        return objectUrl
      }
      return existing.objectUrl
    }
    const objectUrl = URL.createObjectURL(dataUrlToBlob(dataUrl))
    entries.set(id, { dataUrl, objectUrl })
    return objectUrl
  }

  function register(dataUrl: string, id?: string): string {
    if (!id?.trim()) {
      for (const [existingId, entry] of entries) {
        if (entry.dataUrl === dataUrl) return existingId
      }
    }
    const nextId = id?.trim() || createId()
    ensureObjectUrl(nextId, dataUrl)
    return nextId
  }

  function getDataUrl(id: string): string | null {
    return entries.get(id)?.dataUrl ?? null
  }

  function getObjectUrl(id: string): string | null {
    return entries.get(id)?.objectUrl ?? null
  }

  function has(id: string): boolean {
    return entries.has(id)
  }

  function findIdByObjectUrl(objectUrl: string): string | null {
    const trimmed = objectUrl.trim()
    if (!trimmed) return null
    for (const [entryId, entry] of entries) {
      if (entry.objectUrl === trimmed) return entryId
    }
    return null
  }

  function resolveDataUrlFromDisplayUrl(url: string, id?: string | null): string | null {
    const trimmed = url.trim()
    if (!trimmed) return null
    if (isEmbeddedDataImageSrc(trimmed)) return trimmed
    const resolvedId = id?.trim() || findIdByObjectUrl(trimmed)
    if (resolvedId) return getDataUrl(resolvedId)
    return null
  }

  function processImages(doc: Document, mode: 'externalize' | 'hydrate'): void {
    for (const img of doc.querySelectorAll('img')) {
      const id = img.getAttribute(EMBEDDED_IMAGE_ID_ATTR)?.trim()
      const src = img.getAttribute('src')?.trim() ?? ''

      if (mode === 'hydrate') {
        const dataUrl = resolveDataUrlFromDisplayUrl(src, id)
        if (!dataUrl) continue
        img.setAttribute('src', dataUrl)
        continue
      }

      if (id && has(id)) {
        const objectUrl = getObjectUrl(id)
        if (objectUrl) img.setAttribute('src', objectUrl)
        continue
      }

      const registryId = findIdByObjectUrl(src)
      if (registryId) {
        img.setAttribute(EMBEDDED_IMAGE_ID_ATTR, registryId)
        const objectUrl = getObjectUrl(registryId)
        if (objectUrl) img.setAttribute('src', objectUrl)
        continue
      }

      if (!isEmbeddedDataImageSrc(src)) continue
      const nextId = register(src)
      img.setAttribute(EMBEDDED_IMAGE_ID_ATTR, nextId)
      const objectUrl = getObjectUrl(nextId)
      if (objectUrl) img.setAttribute('src', objectUrl)
    }
  }

  function processPageBackgroundLayers(doc: Document, mode: 'externalize' | 'hydrate'): void {
    for (const layer of doc.querySelectorAll(`[${PAGE_BG_LAYER_ATTR}]`)) {
      if (!(layer instanceof HTMLElement)) continue
      const id = layer.getAttribute(EMBEDDED_IMAGE_ID_ATTR)?.trim()
      const style = layer.getAttribute('style') ?? ''
      const currentUrl = readBackgroundImageUrlFromStyle(style)

      if (mode === 'hydrate') {
        if (!currentUrl) continue
        const dataUrl = resolveDataUrlFromDisplayUrl(currentUrl, id)
        if (!dataUrl) continue
        layer.setAttribute('style', writeBackgroundImageUrlToStyle(style, dataUrl))
        continue
      }

      if (!currentUrl) continue

      if (id && has(id)) {
        const objectUrl = getObjectUrl(id)
        if (objectUrl) {
          layer.setAttribute('style', writeBackgroundImageUrlToStyle(style, objectUrl))
        }
        continue
      }

      const registryId = findIdByObjectUrl(currentUrl)
      if (registryId) {
        layer.setAttribute(EMBEDDED_IMAGE_ID_ATTR, registryId)
        const objectUrl = getObjectUrl(registryId)
        if (objectUrl) {
          layer.setAttribute('style', writeBackgroundImageUrlToStyle(style, objectUrl))
        }
        continue
      }

      if (!isEmbeddedDataImageSrc(currentUrl)) continue
      const nextId = register(currentUrl)
      layer.setAttribute(EMBEDDED_IMAGE_ID_ATTR, nextId)
      const objectUrl = getObjectUrl(nextId)
      if (objectUrl) {
        layer.setAttribute('style', writeBackgroundImageUrlToStyle(style, objectUrl))
      }
    }
  }

  function externalizeHtml(html: string): string {
    const trimmed = html.trim()
    if (!trimmed) return html
    if (!htmlMayContainEmbeddedImages(trimmed)) return html
    const doc = parseHtmlFragment(html)
    processImages(doc, 'externalize')
    processPageBackgroundLayers(doc, 'externalize')
    return serializeHtmlFragment(doc)
  }

  function hydrateHtml(html: string): string {
    const trimmed = html.trim()
    if (!trimmed) return html
    if (!htmlMayContainEmbeddedImages(trimmed)) return html
    const doc = parseHtmlFragment(html)
    processPageBackgroundLayers(doc, 'hydrate')
    processImages(doc, 'hydrate')
    for (const img of doc.querySelectorAll('img')) {
      img.removeAttribute(EMBEDDED_IMAGE_ID_ATTR)
    }
    for (const layer of doc.querySelectorAll(`[${PAGE_BG_LAYER_ATTR}]`)) {
      layer.removeAttribute(EMBEDDED_IMAGE_ID_ATTR)
    }
    return serializeHtmlFragment(doc)
  }

  function clear(): void {
    for (const entry of entries.values()) {
      URL.revokeObjectURL(entry.objectUrl)
    }
    entries.clear()
  }

  return {
    register,
    getDataUrl,
    getObjectUrl,
    has,
    externalizeHtml,
    hydrateHtml,
    clear,
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return new Blob()
  const header = dataUrl.slice(0, comma)
  const base64 = dataUrl.slice(comma + 1)
  const mimeMatch = /^data:([^;,]+)/i.exec(header)
  const mime = mimeMatch?.[1] ?? 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function externalizeEmbeddedImagesInHtml(
  html: string,
  registry: ImageRegistry,
): string {
  return registry.externalizeHtml(html)
}

export function hydrateEmbeddedImagesInHtml(html: string, registry: ImageRegistry): string {
  return registry.hydrateHtml(html)
}

/** Resolve a stored page-background layer URL via the image registry when present. */
export function resolveRegistryBackgroundImageUrl(
  el: HTMLElement,
  resolveDataUrl?: (id: string) => string | null,
): string | null {
  const id = el.getAttribute(EMBEDDED_IMAGE_ID_ATTR)?.trim()
  if (id && resolveDataUrl) {
    const resolved = resolveDataUrl(id)
    if (resolved) return resolved
  }
  const style = el.getAttribute('style') ?? ''
  return readBackgroundImageUrlFromStyle(style)
}
