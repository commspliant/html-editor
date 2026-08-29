import { describe, expect, it, afterEach } from 'vitest'
import {
  canonicalizeDocumentHtml,
  documentsCanonicallyEqual,
} from './documentEquality'
import {
  createImageRegistry,
  EMBEDDED_IMAGE_ID_ATTR,
  externalizeEmbeddedImagesInHtml,
  hydrateEmbeddedImagesInHtml,
} from './imageRegistry'

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

describe('documentEquality', () => {
  const registries: ReturnType<typeof createImageRegistry>[] = []

  afterEach(() => {
    for (const registry of registries) {
      registry.clear()
    }
    registries.length = 0
  })

  function registry() {
    const created = createImageRegistry()
    registries.push(created)
    return created
  }

  it('treats externalized and hydrated embedded images as equal', () => {
    const imageRegistry = registry()
    const hydrated = `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`
    const external = externalizeEmbeddedImagesInHtml(hydrated, imageRegistry)

    expect(documentsCanonicallyEqual(hydrated, external, (html) =>
      hydrateEmbeddedImagesInHtml(html, imageRegistry),
    )).toBe(true)
  })

  it('strips registry id attributes when canonicalizing', () => {
    const imageRegistry = registry()
    const external = externalizeEmbeddedImagesInHtml(
      `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`,
      imageRegistry,
    )

    expect(canonicalizeDocumentHtml(external, (html) =>
      hydrateEmbeddedImagesInHtml(html, imageRegistry),
    )).not.toContain(EMBEDDED_IMAGE_ID_ATTR)
    expect(canonicalizeDocumentHtml(external, (html) =>
      hydrateEmbeddedImagesInHtml(html, imageRegistry),
    )).toContain(PNG_DATA_URL)
  })

  it('returns false when document text differs', () => {
    expect(
      documentsCanonicallyEqual('<p>One</p>', '<p>Two</p>'),
    ).toBe(false)
  })
})
