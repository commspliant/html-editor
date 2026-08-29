import { EMBEDDED_IMAGE_ID_ATTR } from './imageRegistry'

export type HydrateEmbeddedImages = (html: string) => string

/** Normalize document HTML to a stable export form for equality checks. */
export function canonicalizeDocumentHtml(
  html: string,
  hydrateEmbeddedImages?: HydrateEmbeddedImages,
): string {
  const hydrated = hydrateEmbeddedImages ? hydrateEmbeddedImages(html) : html
  const trimmed = hydrated.trim()
  if (!trimmed) return ''
  if (!trimmed.includes('<')) return trimmed

  const doc = new DOMParser().parseFromString(`<body>${trimmed}</body>`, 'text/html')
  for (const img of doc.querySelectorAll('img')) {
    img.removeAttribute(EMBEDDED_IMAGE_ID_ATTR)
  }
  return doc.body.innerHTML
}

/** Compare two document HTML strings after canonical normalization. */
export function documentsCanonicallyEqual(
  a: string,
  b: string,
  hydrateEmbeddedImages?: HydrateEmbeddedImages,
): boolean {
  return canonicalizeDocumentHtml(a, hydrateEmbeddedImages) === canonicalizeDocumentHtml(b, hydrateEmbeddedImages)
}
