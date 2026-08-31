import { describe, expect, it, afterEach } from 'vitest'
import { absorbLooseBlocksIntoPageShell } from './page'
import {
  createImageRegistry,
  externalizeEmbeddedImagesInHtml,
  hydrateEmbeddedImagesInHtml,
} from './imageRegistry'
import { resolveImageContentKey, syncVisualBodyHtml } from './visualBodySync'

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

describe('visualBodySync', () => {
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

  it('skips DOM writes when body HTML is canonically equal', () => {
    const imageRegistry = registry()
    const root = document.createElement('div')
    const hydrated = `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`
    const external = externalizeEmbeddedImagesInHtml(hydrated, imageRegistry)
    root.innerHTML = external
    const img = root.querySelector('img')!

    const result = syncVisualBodyHtml(root, hydrated, {
      resolveDataUrl: (id) => imageRegistry.getDataUrl(id),
      hydrateEmbeddedImages: (html) => hydrateEmbeddedImagesInHtml(html, imageRegistry),
    })

    expect(result.changed).toBe(false)
    expect(root.querySelector('img')).toBe(img)
  })

  it('preserves template tag spans inside a table row through sync and absorb', () => {
    const body =
      '<table><tbody><tr><span data-template-tag="">{{for items}}</span><td>Item</td><span data-template-tag="">{{endfor}}</span></tr></tbody></table>'
    const root = document.createElement('div')
    root.innerHTML = body

    syncVisualBodyHtml(root, body)

    expect(root.textContent).toBe('{{for items}}Item{{endfor}}')
    expect(root.querySelector('span[data-template-tag]')).not.toBeNull()
    expect(root.innerHTML).toContain(
      '<tr><span data-template-tag="">{{for items}}</span><td>Item</td><span data-template-tag="">{{endfor}}</span></tr>',
    )

    const { changed } = absorbLooseBlocksIntoPageShell(root)
    expect(changed).toBe(false)
    expect(root.innerHTML).toContain('data-template-tag')
    expect(root.textContent).toBe('{{for items}}Item{{endfor}}')
  })

  it('does not reparse template tags inside a table row when serialized html already matches', () => {
    const root = document.createElement('div')
    root.innerHTML = '<table><tbody><tr><td>Item</td></tr></tbody></table>'
    const row = root.querySelector('tr')!
    const range = document.createRange()
    range.selectNodeContents(row)
    range.deleteContents()
    range.insertNode(range.createContextualFragment('{{for items}}<td>Item</td>{{endfor}}'))
    expect(root.textContent).toBe('{{for items}}Item{{endfor}}')

    const serialized = root.innerHTML
    const result = syncVisualBodyHtml(root, serialized)

    expect(result.changed).toBe(false)
    expect(root.textContent).toBe('{{for items}}Item{{endfor}}')
    expect(root.innerHTML).toContain('<tr>{{for items}}<td>Item</td>{{endfor}}</tr>')
  })

  it('preserves image nodes when only image attributes differ', () => {
    const imageRegistry = registry()
    const root = document.createElement('div')
    const hydrated = `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`
    const external = externalizeEmbeddedImagesInHtml(hydrated, imageRegistry)
    root.innerHTML = external
    const img = root.querySelector('img')!

    const result = syncVisualBodyHtml(root, external.replace('alt="Chart"', 'alt="Updated"'), {
      resolveDataUrl: (id) => imageRegistry.getDataUrl(id),
      hydrateEmbeddedImages: (html) => hydrateEmbeddedImagesInHtml(html, imageRegistry),
    })

    expect(result.changed).toBe(true)
    expect(root.querySelector('img')).toBe(img)
    expect(root.querySelector('img')).toHaveAttribute('alt', 'Updated')
  })

  it('replaces body HTML when image content changes', () => {
    const root = document.createElement('div')
    root.innerHTML = `<p><img src="${PNG_DATA_URL}" alt="Chart"></p>`
    const img = root.querySelector('img')!

    syncVisualBodyHtml(
      root,
      `<p><img src="data:image/png;base64,OTHER" alt="Chart"></p>`,
    )

    expect(root.querySelector('img')).not.toBe(img)
  })

  it('resolves registry image keys from data URLs', () => {
    const imageRegistry = registry()
    const id = imageRegistry.register(PNG_DATA_URL)
    const img = document.createElement('img')
    img.setAttribute('data-wysiwyg-img-id', id)
    img.setAttribute('src', imageRegistry.getObjectUrl(id)!)

    expect(resolveImageContentKey(img, (nextId) => imageRegistry.getDataUrl(nextId))).toBe(
      `embedded:${PNG_DATA_URL}`,
    )
  })
})
