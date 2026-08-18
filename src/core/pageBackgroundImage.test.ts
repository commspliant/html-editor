import { afterEach, describe, expect, it } from 'vitest'
import { PAGE_BG_LAYER_ATTR, ensurePageShell, queryPageBackgroundLayer } from './page'
import {
  emptyPageBackgroundImageApply,
  readPageBackgroundImage,
  writePageBackgroundImage,
} from './pageBackgroundImage'
import { applyPagePropertiesInDocument, emptyPagePropertiesApply } from './pageProperties'

function mountShell(html = '<p>Hello</p>') {
  const visual = document.createElement('div')
  visual.contentEditable = 'true'
  visual.innerHTML = html
  document.body.appendChild(visual)
  const shell = ensurePageShell(visual)
  return { visual, shell }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('writePageBackgroundImage', () => {
  it('creates a background layer with inline styles', () => {
    const { shell } = mountShell()
    expect(
      writePageBackgroundImage(shell, {
        src: 'https://example.com/bg.png',
        opacity: 0.8,
        fit: 'cover',
        position: 'top',
      }),
    ).toBe(true)

    const layer = queryPageBackgroundLayer(shell)
    expect(layer).not.toBeNull()
    expect(layer?.hasAttribute(PAGE_BG_LAYER_ATTR)).toBe(true)
    expect(layer?.getAttribute('contenteditable')).toBe('false')
    expect(layer?.style.backgroundImage).toContain('example.com/bg.png')
    expect(layer?.style.backgroundSize).toBe('cover')
    expect(layer?.style.backgroundPosition).toBe('top')
    expect(layer?.style.opacity).toBe('0.8')
    expect(shell.style.position).toBe('relative')
    expect(shell.querySelector('p')?.textContent).toBe('Hello')
  })

  it('removes the background layer when src is cleared', () => {
    const { shell } = mountShell()
    writePageBackgroundImage(shell, {
      src: 'https://example.com/bg.png',
      opacity: null,
      fit: null,
      position: null,
    })

    expect(writePageBackgroundImage(shell, emptyPageBackgroundImageApply())).toBe(true)
    expect(queryPageBackgroundLayer(shell)).toBeNull()
    expect(shell.style.position).toBe('')
  })

  it('round-trips through readPageBackgroundImage', () => {
    const { shell } = mountShell()
    const draft = {
      src: 'https://example.com/bg.png',
      opacity: 0.5,
      fit: 'contain' as const,
      position: 'center',
    }
    writePageBackgroundImage(shell, draft)
    expect(readPageBackgroundImage(shell)).toEqual(draft)
  })
})

describe('applyPagePropertiesInDocument background image', () => {
  it('writes background image through page properties apply', () => {
    const { visual, shell } = mountShell()
    const draft = emptyPagePropertiesApply()
    draft.backgroundImage = {
      src: 'https://example.com/page.png',
      opacity: 0.9,
      fit: 'fill',
      position: 'right',
    }

    expect(applyPagePropertiesInDocument(visual, draft)).toBe(true)
    const layer = queryPageBackgroundLayer(shell)
    expect(layer?.style.backgroundSize).toBe('100% 100%')
    expect(layer?.style.backgroundPosition).toBe('right')
    expect(layer?.style.opacity).toBe('0.9')
    expect(shell.style.width).toBe('100%')
    expect(shell.style.height).toBe('100%')
  })
})
