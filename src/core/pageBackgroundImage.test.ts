import { afterEach, describe, expect, it } from 'vitest'
import {
  PAGE_BG_LAYER_ATTR,
  PAGE_BG_LAYER_ID,
  PAGE_SHELL_ATTR,
  ensurePageShell,
  queryPageBackgroundLayer,
  queryPageBackgroundLayers,
} from './page'
import {
  DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH,
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
        width: null,
        height: null,
      }),
    ).toBe(true)

    const layer = queryPageBackgroundLayer(shell)
    expect(layer).not.toBeNull()
    expect(layer?.id).toBe(PAGE_BG_LAYER_ID)
    expect(layer?.hasAttribute(PAGE_BG_LAYER_ATTR)).toBe(true)
    expect(layer?.getAttribute('contenteditable')).toBe('false')
    expect(layer).toBe(shell.firstChild)
    expect(layer?.style.backgroundImage).toContain('example.com/bg.png')
    expect(layer?.style.backgroundSize).toBe('cover')
    expect(layer?.style.backgroundPosition).toBe('top')
    expect(layer?.style.opacity).toBe('0.8')
    expect(layer?.style.zIndex).toBe('0')
    expect(layer?.style.pointerEvents).toBe('none')
    expect(layer?.style.userSelect).toBe('none')
    expect(layer?.style.getPropertyValue('print-color-adjust')).toBe('exact')
    expect(layer?.getAttribute('style')).toMatch(/-webkit-print-color-adjust:\s*exact/)
    expect(shell.style.position).toBe('relative')
    expect(shell.style.isolation).toBe('isolate')
    expect(shell.querySelector('p')?.textContent).toBe('Hello')
  })

  it('reuses the existing layer and never creates a second one', () => {
    const { visual, shell } = mountShell()
    const draft = {
      src: 'https://example.com/bg.png',
      opacity: null,
      fit: 'cover' as const,
      position: 'center',
      width: null,
      height: null,
    }
    writePageBackgroundImage(shell, draft)
    const first = queryPageBackgroundLayer(shell)
    writePageBackgroundImage(shell, { ...draft, opacity: 0.4 })
    expect(queryPageBackgroundLayer(shell)).toBe(first)
    expect(queryPageBackgroundLayers(visual)).toHaveLength(1)
    expect(visual.querySelectorAll(`[${PAGE_BG_LAYER_ATTR}]`)).toHaveLength(1)
    expect(visual.querySelectorAll(`#${PAGE_BG_LAYER_ID}`)).toHaveLength(1)
  })

  it('adopts a nested leftover layer and removes extras', () => {
    const { visual, shell } = mountShell(
      `<div data-page style="width:100%;height:100%">
        <p>Hello</p>
        <div data-page>
          <div data-page-bg style="background-image:url(&quot;https://example.com/old.png&quot;)"></div>
        </div>
      </div>
      <div data-page-bg></div>`,
    )

    expect(
      writePageBackgroundImage(shell, {
        src: 'https://example.com/bg.png',
        opacity: null,
        fit: 'cover',
        position: null,
        width: null,
        height: null,
      }),
    ).toBe(true)

    const layers = queryPageBackgroundLayers(visual)
    expect(layers).toHaveLength(1)
    expect(layers[0].id).toBe(PAGE_BG_LAYER_ID)
    expect(layers[0].parentElement).toBe(shell)
    expect(shell.firstChild).toBe(layers[0])
    expect(layers[0].style.backgroundImage).toContain('example.com/bg.png')
  })

  it('writes default width 100% when height is unset', () => {
    const { shell } = mountShell()
    const draft = emptyPageBackgroundImageApply()
    draft.src = 'https://example.com/bg.png'

    expect(writePageBackgroundImage(shell, draft)).toBe(true)
    expect(queryPageBackgroundLayer(shell)?.style.backgroundSize).toBe('100%')
  })

  it('writes independent width and height', () => {
    const { shell } = mountShell()
    expect(
      writePageBackgroundImage(shell, {
        src: 'https://example.com/bg.png',
        opacity: null,
        fit: null,
        position: null,
        width: { value: 200, unit: 'px' },
        height: { value: 50, unit: '%' },
      }),
    ).toBe(true)

    expect(queryPageBackgroundLayer(shell)?.style.backgroundSize).toBe('200px 50%')
  })

  it('writes height-only size as auto plus height', () => {
    const { shell } = mountShell()
    expect(
      writePageBackgroundImage(shell, {
        src: 'https://example.com/bg.png',
        opacity: null,
        fit: null,
        position: null,
        width: null,
        height: { value: 80, unit: 'px' },
      }),
    ).toBe(true)

    expect(queryPageBackgroundLayer(shell)?.style.backgroundSize).toBe('auto 80px')
  })

  it('removes the background layer when src is cleared', () => {
    const { shell } = mountShell()
    writePageBackgroundImage(shell, {
      src: 'https://example.com/bg.png',
      opacity: null,
      fit: null,
      position: null,
      width: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
      height: null,
    })

    expect(writePageBackgroundImage(shell, emptyPageBackgroundImageApply())).toBe(true)
    expect(queryPageBackgroundLayer(shell)).toBeNull()
    expect(shell.style.position).toBe('')
    expect(shell.style.isolation).toBe('')
  })

  it('round-trips cover through readPageBackgroundImage', () => {
    const { shell } = mountShell()
    const draft = {
      src: 'https://example.com/bg.png',
      opacity: 0.5,
      fit: 'contain' as const,
      position: 'center',
      width: null,
      height: null,
    }
    writePageBackgroundImage(shell, draft)
    expect(readPageBackgroundImage(shell)).toEqual(draft)
  })

  it('round-trips independent width and height', () => {
    const { shell } = mountShell()
    const draft = {
      src: 'https://example.com/bg.png',
      opacity: null,
      fit: null,
      position: null,
      width: { value: 75, unit: '%' },
      height: { value: 120, unit: 'px' },
    }
    writePageBackgroundImage(shell, draft)
    expect(readPageBackgroundImage(shell)).toEqual(draft)
  })

  it('does not invent 100% width when background-size is missing', () => {
    const { shell } = mountShell()
    writePageBackgroundImage(shell, {
      src: 'https://example.com/bg.png',
      opacity: null,
      fit: null,
      position: null,
      width: null,
      height: null,
    })
    expect(readPageBackgroundImage(shell)).toEqual({
      src: 'https://example.com/bg.png',
      opacity: null,
      fit: null,
      position: null,
      width: null,
      height: null,
    })
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
      width: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
      height: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
    }

    expect(applyPagePropertiesInDocument(visual, draft).changed).toBe(true)
    const layer = queryPageBackgroundLayer(shell)
    expect(layer?.style.backgroundSize).toBe('100% 100%')
    expect(layer?.style.backgroundPosition).toBe('right')
    expect(layer?.style.opacity).toBe('0.9')
    expect(shell.style.width).toBe('100%')
    expect(shell.style.height).toBe('100%')
    expect(readPageBackgroundImage(shell)).toEqual(draft.backgroundImage)
  })
})
