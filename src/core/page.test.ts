import { afterEach, describe, expect, it } from 'vitest'
import { setBlockFormatInDocument } from './blockFormat'
import type { PagePropertiesApply } from './commandTypes'
import type { ParagraphBoxApply } from './paragraphBox'
import { emptyFontMarkState } from './marks'
import { ensurePageShell, PAGE_SHELL_ATTR, queryPageShell, syncPageHolderBackground } from './page'
import {
  applyPagePropertiesInDocument,
  emptyPagePropertiesApply,
  queryPageProperties,
} from './pageProperties'
import { setTextAlignInDocument } from './textAlign'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function selectOffsets(el: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remainingStart = start
  let remainingEnd = end
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.data.length
    if (!startNode && remainingStart <= len) {
      startNode = text
      startOffset = remainingStart
    }
    if (!startNode) remainingStart -= len
    if (!endNode && remainingEnd <= len) {
      endNode = text
      endOffset = remainingEnd
      break
    }
    remainingEnd -= len
  }
  if (!startNode || !endNode) {
    throw new Error('could not map offsets to text nodes')
  }
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function apply(overrides: Partial<ParagraphBoxApply> = {}): PagePropertiesApply {
  const empty = emptyPagePropertiesApply()
  return {
    font: empty.font,
    box: { ...empty.box, ...overrides },
    backgroundImage: empty.backgroundImage,
  }
}

function applyFont(
  font: Partial<PagePropertiesApply['font']> = {},
  box: Partial<ParagraphBoxApply> = {},
): PagePropertiesApply {
  const empty = emptyPagePropertiesApply()
  return {
    font: { ...empty.font, ...font },
    box: { ...empty.box, ...box },
    backgroundImage: empty.backgroundImage,
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('ensurePageShell', () => {
  it('wraps unwrapped blocks in a data-page div', () => {
    const el = mountVisual('<p>Hello</p><p>World</p>')
    const shell = ensurePageShell(el)

    expect(shell.hasAttribute(PAGE_SHELL_ATTR)).toBe(true)
    expect(shell.style.width).toBe('100%')
    expect(shell.style.height).toBe('100%')
    expect(el.children).toHaveLength(1)
    expect(el.firstElementChild).toBe(shell)
    expect(shell.innerHTML).toBe('<p>Hello</p><p>World</p>')
  })

  it('adopts a single unmarked top-level div', () => {
    const el = mountVisual('<div style="padding: 8px"><p>Hello</p></div>')
    const inner = el.firstElementChild as HTMLElement
    const shell = ensurePageShell(el)

    expect(shell).toBe(inner)
    expect(shell.hasAttribute(PAGE_SHELL_ATTR)).toBe(true)
    expect(el.children).toHaveLength(1)
    expect(shell.querySelector('p')?.textContent).toBe('Hello')
  })

  it('reuses an existing data-page shell', () => {
    const el = mountVisual('<div data-page><p>Hello</p></div>')
    const existing = el.firstElementChild as HTMLElement
    expect(ensurePageShell(el)).toBe(existing)
    expect(el.children).toHaveLength(1)
  })

  it('does not adopt a lone data-page-bg div as the page shell', () => {
    const el = mountVisual('<div data-page-bg></div>')
    const leftover = el.firstElementChild as HTMLElement
    const shell = ensurePageShell(el)

    expect(shell).not.toBe(leftover)
    expect(shell.hasAttribute(PAGE_SHELL_ATTR)).toBe(true)
    expect(leftover.hasAttribute(PAGE_SHELL_ATTR)).toBe(false)
    expect(el.children).toHaveLength(1)
    expect(el.firstElementChild).toBe(shell)
    expect(shell.firstElementChild).toBe(leftover)
  })

  it('does not adopt a lone commspliant-background div as the page shell', () => {
    const el = mountVisual('<div id="commspliant-background"></div>')
    const leftover = el.firstElementChild as HTMLElement
    const shell = ensurePageShell(el)

    expect(shell).not.toBe(leftover)
    expect(shell.hasAttribute(PAGE_SHELL_ATTR)).toBe(true)
    expect(el.firstElementChild).toBe(shell)
    expect(shell.firstElementChild).toBe(leftover)
  })
})

describe('applyPagePropertiesInDocument', () => {
  it('wraps unwrapped HTML and writes padding and background on the shell', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyPagePropertiesInDocument(
        el,
        apply({
          padding: {
            top: { value: 24, unit: 'pt' },
            right: { value: 24, unit: 'pt' },
            bottom: { value: 24, unit: 'pt' },
            left: { value: 24, unit: 'pt' },
          },
          backgroundColor: '#ccffff',
        }),
      ),
    ).toBe(true)

    const shell = queryPageShell(el)
    expect(shell).not.toBeNull()
    expect(shell?.style.paddingTop).toBe('24pt')
    expect(shell).toHaveStyle({ backgroundColor: 'rgb(204, 255, 255)' })
    expect(el).toHaveStyle({ backgroundColor: 'rgb(204, 255, 255)' })
    expect(el.querySelector('p')?.style.backgroundColor).toBe('')
  })

  it('adopts an existing wrapper div and sets opacity', () => {
    const el = mountVisual('<div><p>Hello</p></div>')
    selectOffsets(el, 0, 5)

    expect(
      applyPagePropertiesInDocument(
        el,
        apply({
          opacity: 0.5,
          marginMixed: true,
          paddingMixed: true,
          lineHeightMixed: true,
          borderMixed: true,
          radiusMixed: true,
          shadowMixed: true,
          backgroundMixed: true,
        }),
      ),
    ).toBe(true)

    const shell = queryPageShell(el)
    expect(el.children).toHaveLength(1)
    expect(shell?.style.opacity).toBe('0.5')
    expect(el.querySelector('p')?.style.opacity).toBe('')
  })

  it('clears background-color and opacity on the shell without unwrapping', () => {
    const el = mountVisual(
      '<div data-page style="background-color: #cc0000; opacity: 0.4"><p>Hello</p></div>',
    )
    selectOffsets(el, 0, 5)

    applyPagePropertiesInDocument(el, apply())

    const shell = queryPageShell(el)
    expect(shell).not.toBeNull()
    expect(shell?.getAttribute('style')).toBe('width: 100%; height: 100%;')
    expect(el.style.backgroundColor).toBe('')
    expect(el.querySelector('p')?.textContent).toBe('Hello')
  })

  it('does not rename the page shell when converting the inner paragraph', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    applyPagePropertiesInDocument(
      el,
      apply({
        backgroundColor: '#ccffff',
        marginMixed: true,
        paddingMixed: true,
        lineHeightMixed: true,
        borderMixed: true,
        radiusMixed: true,
        shadowMixed: true,
        opacityMixed: true,
      }),
    )

    expect(setBlockFormatInDocument(el, 'h1')).toBe(true)
    const shell = queryPageShell(el)
    expect(shell?.tagName).toBe('DIV')
    expect(shell?.querySelector('h1')?.textContent).toBe('Hello')
    expect(el.querySelector('p')).toBeNull()
  })

  it('aligns the inner paragraph, not the page shell', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    applyPagePropertiesInDocument(
      el,
      apply({
        backgroundColor: '#ccffff',
        marginMixed: true,
        paddingMixed: true,
        lineHeightMixed: true,
        borderMixed: true,
        radiusMixed: true,
        shadowMixed: true,
        opacityMixed: true,
      }),
    )

    expect(setTextAlignInDocument(el, 'center')).toBe(true)
    const shell = queryPageShell(el)
    expect(shell?.style.textAlign).toBe('')
    expect(el.querySelector('p')).toHaveStyle({ textAlign: 'center' })
  })

  it('writes font size, color, and marks on the page shell', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyPagePropertiesInDocument(
        el,
        applyFont({
          size: 18,
          unit: 'pt',
          fontColor: '#cc0000',
          marks: { ...emptyFontMarkState(), bold: true, italic: true },
        }),
      ),
    ).toBe(true)

    const shell = queryPageShell(el)
    expect(shell?.style.fontSize).toBe('18pt')
    expect(shell).toHaveStyle({ color: 'rgb(204, 0, 0)' })
    expect(shell?.style.fontWeight).toBe('bold')
    expect(shell?.style.fontStyle).toBe('italic')
    expect(el.querySelector('p')?.style.fontSize).toBe('')
  })

  it('writes font-family on the page shell', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      applyPagePropertiesInDocument(
        el,
        applyFont({
          fontFamily: 'Georgia, serif',
        }),
      ),
    ).toBe(true)

    const shell = queryPageShell(el)
    expect(shell).toHaveStyle({ fontFamily: 'Georgia, serif' })
    expect(el.querySelector('p')?.style.fontFamily).toBe('')
  })
})

describe('queryPageProperties', () => {
  it('returns empty defaults when there is no shell', () => {
    const el = mountVisual('<p>Hello</p>')
    expect(queryPageProperties(el)).toEqual(emptyPagePropertiesApply())
  })

  it('reads authored styles from the page shell', () => {
    const el = mountVisual(
      '<div data-page style="padding-top: 24pt; background-color: #ccffff; opacity: 0.8; font-size: 18pt; color: #cc0000; font-weight: bold"><p>Hello</p></div>',
    )
    const query = queryPageProperties(el)
    expect(query.box.padding.top).toEqual({ value: 24, unit: 'pt' })
    expect(query.box.backgroundColor).toBe('#ccffff')
    expect(query.box.opacity).toBe(0.8)
    expect(query.box.backgroundMixed).toBe(false)
    expect(query.font.size).toBe(18)
    expect(query.font.unit).toBe('pt')
    expect(query.font.fontColor).toBe('#cc0000')
    expect(query.font.marks.bold).toBe(true)
    expect(query.font.fontFamily).toBeNull()
  })

  it('reads authored font-family from the page shell', () => {
    const el = mountVisual(
      '<div data-page style="font-family: Georgia, serif"><p>Hello</p></div>',
    )
    expect(queryPageProperties(el).font.fontFamily).toMatch(/Georgia/)
  })
})

describe('syncPageHolderBackground', () => {
  it('paints the visual holder from the page shell fill', () => {
    const el = mountVisual(
      '<div data-page style="background-color: #ccffff"><p>Hello</p></div>',
    )
    syncPageHolderBackground(el)
    expect(el).toHaveStyle({ backgroundColor: 'rgb(204, 255, 255)' })
    expect(el.innerHTML.startsWith('<div data-page')).toBe(true)
  })

  it('clears the holder fill when the page has no background-color', () => {
    const el = mountVisual('<div data-page><p>Hello</p></div>')
    el.style.backgroundColor = 'rgb(204, 255, 255)'
    syncPageHolderBackground(el)
    expect(el.style.backgroundColor).toBe('')
  })

  it('mirrors page background image layer styles onto the holder', () => {
    const el = mountVisual(
      '<div data-page style="width:100%;height:100%;position:relative;isolation:isolate"><div id="commspliant-background" data-page-bg style="position:absolute;inset:0;z-index:-1;pointer-events:none;user-select:none;background-image:url(&quot;https://example.com/bg.png&quot;);background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0.7"></div><p>Hello</p></div>',
    )
    syncPageHolderBackground(el)
    expect(el.style.backgroundImage).toContain('example.com/bg.png')
    expect(el.style.backgroundSize).toBe('cover')
    expect(el.style.backgroundPosition).toBe('center')
    expect(el.style.opacity).toBe('0.7')
  })
})
