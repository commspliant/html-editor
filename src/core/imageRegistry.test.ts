import { describe, expect, it, afterEach } from 'vitest'
import {
  EMBEDDED_IMAGE_ID_ATTR,
  createImageRegistry,
  hydrateEmbeddedImagesInHtml,
  externalizeEmbeddedImagesInHtml,
} from './imageRegistry'

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

describe('imageRegistry', () => {
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

  it('externalizes embedded data URLs and hydrates them back', () => {
    const imageRegistry = registry()
    const html = `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`
    const external = externalizeEmbeddedImagesInHtml(html, imageRegistry)

    expect(external).toContain(EMBEDDED_IMAGE_ID_ATTR)
    expect(external).not.toContain('base64')

    const hydrated = hydrateEmbeddedImagesInHtml(external, imageRegistry)
    expect(hydrated).toContain(PNG_DATA_URL)
    expect(hydrated).not.toContain(EMBEDDED_IMAGE_ID_ATTR)
  })

  it('leaves external https image sources unchanged', () => {
    const imageRegistry = registry()
    const html = '<p><img src="https://example.com/a.png" alt="Remote"></p>'
    const external = externalizeEmbeddedImagesInHtml(html, imageRegistry)
    expect(external).toContain('https://example.com/a.png')
    expect(external).not.toContain(EMBEDDED_IMAGE_ID_ATTR)
  })

  it('reuses registry entries for the same image id', () => {
    const imageRegistry = registry()
    const id = imageRegistry.register(PNG_DATA_URL)
    const html = `<img ${EMBEDDED_IMAGE_ID_ATTR}="${id}" src="${PNG_DATA_URL}" alt="x">`
    const external = externalizeEmbeddedImagesInHtml(html, imageRegistry)
    expect(external).toContain(`${EMBEDDED_IMAGE_ID_ATTR}="${id}"`)
    expect(imageRegistry.getDataUrl(id)).toBe(PNG_DATA_URL)
  })

  it('dedupes registry entries for repeated data URLs', () => {
    const imageRegistry = registry()
    const first = imageRegistry.register(PNG_DATA_URL)
    const second = imageRegistry.register(PNG_DATA_URL)
    expect(second).toBe(first)
  })

  it('externalizes page background layer data URLs and hydrates them back', () => {
    const imageRegistry = registry()
    const html =
      `<div data-page><div data-page-bg style="background-image:url(&quot;${PNG_DATA_URL}&quot;);background-size:cover"></div><p>Hello</p></div>`
    const external = externalizeEmbeddedImagesInHtml(html, imageRegistry)

    expect(external).toContain(EMBEDDED_IMAGE_ID_ATTR)
    expect(external).not.toContain('base64')

    const hydrated = hydrateEmbeddedImagesInHtml(external, imageRegistry)
    expect(hydrated).toContain(PNG_DATA_URL)
    expect(hydrated).not.toContain(EMBEDDED_IMAGE_ID_ATTR)
  })

  it('hydrates blob display URLs on img without data-wysiwyg-img-id', () => {
    const imageRegistry = registry()
    const external = externalizeEmbeddedImagesInHtml(
      `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`,
      imageRegistry,
    )
    const doc = new DOMParser().parseFromString(`<body>${external}</body>`, 'text/html')
    const img = doc.querySelector('img')
    expect(img).not.toBeNull()
    const blobSrc = img!.getAttribute('src') ?? ''
    expect(blobSrc.startsWith('blob:')).toBe(true)
    img!.removeAttribute(EMBEDDED_IMAGE_ID_ATTR)
    const blobOnlyHtml = doc.body.innerHTML

    const hydrated = hydrateEmbeddedImagesInHtml(blobOnlyHtml, imageRegistry)
    expect(hydrated).toContain(PNG_DATA_URL)
    expect(hydrated).not.toContain('blob:')
    expect(hydrated).not.toContain(EMBEDDED_IMAGE_ID_ATTR)
  })

  it('hydrates blob display URLs on page background without data-wysiwyg-img-id', () => {
    const imageRegistry = registry()
    const external = externalizeEmbeddedImagesInHtml(
      `<div data-page><div data-page-bg style="background-image:url(&quot;${PNG_DATA_URL}&quot;);background-size:cover"></div><p>Hello</p></div>`,
      imageRegistry,
    )
    const doc = new DOMParser().parseFromString(`<body>${external}</body>`, 'text/html')
    const layer = doc.querySelector('[data-page-bg]')
    expect(layer).not.toBeNull()
    layer!.removeAttribute(EMBEDDED_IMAGE_ID_ATTR)
    const blobOnlyHtml = doc.body.innerHTML

    const hydrated = hydrateEmbeddedImagesInHtml(blobOnlyHtml, imageRegistry)
    expect(hydrated).toContain(PNG_DATA_URL)
    expect(hydrated).not.toContain('blob:')
    expect(hydrated).not.toContain(EMBEDDED_IMAGE_ID_ATTR)
  })

  it('re-attaches data-wysiwyg-img-id when externalizing blob display URLs', () => {
    const imageRegistry = registry()
    const external = externalizeEmbeddedImagesInHtml(
      `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`,
      imageRegistry,
    )
    const doc = new DOMParser().parseFromString(`<body>${external}</body>`, 'text/html')
    const img = doc.querySelector('img')
    expect(img).not.toBeNull()
    img!.removeAttribute(EMBEDDED_IMAGE_ID_ATTR)
    const blobOnlyHtml = doc.body.innerHTML

    const reExternal = externalizeEmbeddedImagesInHtml(blobOnlyHtml, imageRegistry)
    expect(reExternal).toContain(EMBEDDED_IMAGE_ID_ATTR)
    expect(reExternal).not.toContain('base64')
  })
})
