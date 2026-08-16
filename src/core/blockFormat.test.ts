import { afterEach, describe, expect, it } from 'vitest'
import { queryBlockFormat, setBlockFormatInDocument } from './blockFormat'

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

function selectedText(): string {
  return window.getSelection()?.toString() ?? ''
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('setBlockFormatInDocument', () => {
  it('renames a paragraph to heading 1', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'h1')).toBe(true)
    expect(el.innerHTML).toBe('<h1>Hello</h1>')
  })

  it('renames a heading back to a paragraph', () => {
    const el = mountVisual('<h1>Hello</h1>')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'p')).toBe(true)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('is a no-op when the block is already that tag', () => {
    const el = mountVisual('<h2>Hello</h2>')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'h2')).toBe(false)
    expect(el.innerHTML).toBe('<h2>Hello</h2>')
  })

  it('converts every paragraph in a multi-block selection', () => {
    const el = mountVisual('<p>One</p><p>Two</p>')
    selectOffsets(el, 0, 6)

    expect(setBlockFormatInDocument(el, 'h3')).toBe(true)
    expect(el.innerHTML).toBe('<h3>One</h3><h3>Two</h3>')
  })

  it('converts a browser div to a heading', () => {
    const el = mountVisual('<div>Hello</div>')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'h1')).toBe(true)
    expect(el.innerHTML).toBe('<h1>Hello</h1>')
  })

  it('keeps inline styles on the renamed block', () => {
    const el = mountVisual('<p style="text-align: center">Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'h1')).toBe(true)
    expect(el.querySelector('h1')).toHaveStyle({ textAlign: 'center' })
    expect(el.querySelector('h1')?.textContent).toBe('Hello')
  })

  it('restores the text selection after renaming', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 1, 4)

    setBlockFormatInDocument(el, 'h1')

    expect(selectedText()).toBe('ell')
  })

  it('does not convert a list item', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'h1')).toBe(false)
    expect(el.innerHTML).toBe('<ul><li>Hello</li></ul>')
  })

  it('wraps loose root text in the target tag', () => {
    const el = mountVisual('Hello')
    selectOffsets(el, 0, 5)

    expect(setBlockFormatInDocument(el, 'h2')).toBe(true)
    expect(el.innerHTML).toBe('<h2>Hello</h2>')
  })
})

describe('queryBlockFormat', () => {
  it('reads a heading at the caret', () => {
    const el = mountVisual('<h2>Hello</h2>')
    selectOffsets(el, 2, 2)
    expect(queryBlockFormat(el)).toEqual({ tag: 'h2', mixed: false })
  })

  it('treats a div as a paragraph', () => {
    const el = mountVisual('<div>Hello</div>')
    selectOffsets(el, 0, 5)
    expect(queryBlockFormat(el)).toEqual({ tag: 'p', mixed: false })
  })

  it('reports mixed when blocks differ', () => {
    const el = mountVisual('<p>One</p><h1>Two</h1>')
    selectOffsets(el, 0, 6)
    expect(queryBlockFormat(el)).toEqual({ tag: null, mixed: true })
  })

  it('returns no tag inside a list item', () => {
    const el = mountVisual('<ul><li>Hello</li></ul>')
    selectOffsets(el, 0, 5)
    expect(queryBlockFormat(el)).toEqual({ tag: null, mixed: false })
  })
})
