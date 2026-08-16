import { afterEach, describe, expect, it } from 'vitest'
import {
  applyLinkInDocument,
  defaultLinkAttrs,
  isLinkActive,
  LINK_HOVER_HTML_ATTR,
  queryLinkAtSelection,
} from './link'

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

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('applyLinkInDocument', () => {
  it('wraps a highlighted range in an anchor', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(applyLinkInDocument(el, defaultLinkAttrs({ href: 'https://example.com' }))).toBe(true)

    const anchor = el.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
    expect(anchor?.textContent).toBe('Hello')
    expect(anchor?.hasAttribute('title')).toBe(false)
    expect(anchor?.hasAttribute('target')).toBe(false)
  })

  it('preserves inner markup when wrapping', () => {
    const el = mountVisual('<p>Hello <strong>world</strong></p>')
    selectOffsets(el, 0, 11)

    expect(applyLinkInDocument(el, defaultLinkAttrs({ href: 'https://example.com' }))).toBe(true)

    const anchor = el.querySelector('a')
    expect(anchor?.innerHTML).toContain('<strong>')
    expect(anchor?.textContent).toBe('Hello world')
  })

  it('inserts the href as visible text when the caret is collapsed', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 5, 5)

    expect(applyLinkInDocument(el, defaultLinkAttrs({ href: 'https://example.com' }))).toBe(true)

    const anchor = el.querySelector('a')
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
    expect(anchor?.textContent).toBe('https://example.com')
    expect(el.textContent).toBe('Hellohttps://example.com')
  })

  it('updates an existing link instead of nesting', () => {
    const el = mountVisual('<p><a href="https://old.example">Hello</a></p>')
    selectOffsets(el, 0, 5)

    expect(
      applyLinkInDocument(
        el,
        defaultLinkAttrs({
          href: 'https://new.example',
          title: 'Example',
          targetBlank: true,
        }),
      ),
    ).toBe(true)

    expect(el.querySelectorAll('a')).toHaveLength(1)
    const anchor = el.querySelector('a')
    expect(anchor?.getAttribute('href')).toBe('https://new.example')
    expect(anchor?.getAttribute('title')).toBe('Example')
    expect(anchor?.getAttribute('target')).toBe('_blank')
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(anchor?.textContent).toBe('Hello')
  })

  it('writes title and target blank with rel', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyLinkInDocument(
      el,
      defaultLinkAttrs({
        href: 'https://example.com',
        title: 'Example',
        targetBlank: true,
      }),
    )

    const anchor = el.querySelector('a')
    expect(anchor?.getAttribute('title')).toBe('Example')
    expect(anchor?.getAttribute('target')).toBe('_blank')
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('writes text-decoration none', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyLinkInDocument(el, defaultLinkAttrs({ href: 'https://example.com', textDecorationNone: true }))

    expect(el.querySelector('a')?.style.textDecoration).toBe('none')
  })

  it('writes a hover color as mouseover handlers', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyLinkInDocument(
      el,
      defaultLinkAttrs({ href: 'https://example.com', hoverColor: '#cc0000' }),
    )

    const anchor = el.querySelector('a')
    expect(anchor?.getAttribute('onmouseover')).toBe("this.style.color='#cc0000'")
    expect(anchor?.getAttribute('onmouseout')).toBe("this.style.color=''")
  })

  it('writes custom hover html on a data attribute', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyLinkInDocument(
      el,
      defaultLinkAttrs({
        href: 'https://example.com',
        hoverMode: 'html',
        hoverHtml: '<em>Tip</em>',
      }),
    )

    const anchor = el.querySelector('a')
    expect(anchor?.getAttribute(LINK_HOVER_HTML_ATTR)).toBe('<em>Tip</em>')
    expect(anchor?.getAttribute('onmouseover')).toContain('data-hover-html')
    expect(anchor?.getAttribute('onmouseout')).toContain('_hoverBox')
    expect(anchor?.textContent).toBe('Hello')
  })

  it('links to a bookmark with a hash href', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    applyLinkInDocument(el, defaultLinkAttrs({ href: '#section-1' }))

    expect(el.querySelector('a')?.getAttribute('href')).toBe('#section-1')
  })

  it('does not apply an empty href', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(applyLinkInDocument(el, defaultLinkAttrs({ href: '  ' }))).toBe(false)
    expect(el.querySelector('a')).toBeNull()
  })
})

describe('queryLinkAtSelection', () => {
  it('reads attrs from the enclosing href anchor', () => {
    const el = mountVisual(
      '<p><a href="https://example.com" title="Tip" target="_blank" style="text-decoration: none" onmouseover="this.style.color=\'#cc0000\'">Hello</a></p>',
    )
    selectOffsets(el, 1, 1)

    expect(isLinkActive(el)).toBe(true)
    expect(queryLinkAtSelection(el)).toEqual(
      defaultLinkAttrs({
        href: 'https://example.com',
        title: 'Tip',
        targetBlank: true,
        textDecorationNone: true,
        hoverColor: '#cc0000',
      }),
    )
  })

  it('reads custom hover html', () => {
    const el = mountVisual(
      `<p><a href="https://example.com" ${LINK_HOVER_HTML_ATTR}="<strong>Hi</strong>">Hello</a></p>`,
    )
    selectOffsets(el, 1, 1)

    expect(queryLinkAtSelection(el)).toEqual(
      defaultLinkAttrs({
        href: 'https://example.com',
        hoverMode: 'html',
        hoverHtml: '<strong>Hi</strong>',
      }),
    )
  })

  it('returns null when the caret is not in a link', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(isLinkActive(el)).toBe(false)
    expect(queryLinkAtSelection(el)).toBeNull()
  })
})
