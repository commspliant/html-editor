import { afterEach, describe, expect, it } from 'vitest'
import {
  insertBookmarkInDocument,
  listBookmarks,
  validateBookmarkName,
} from './bookmark'
import { PAGE_SHELL_ATTR } from './page'

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

describe('validateBookmarkName', () => {
  it('rejects empty, invalid, and duplicate names', () => {
    const existing = new Set(['intro'])
    expect(validateBookmarkName('', existing)).toBe('empty')
    expect(validateBookmarkName('  ', existing)).toBe('empty')
    expect(validateBookmarkName('1start', existing)).toBe('invalid')
    expect(validateBookmarkName('has space', existing)).toBe('invalid')
    expect(validateBookmarkName('bad.name', existing)).toBe('invalid')
    expect(validateBookmarkName('intro', existing)).toBe('duplicate')
    expect(validateBookmarkName('Section_1', existing)).toBeNull()
    expect(validateBookmarkName('a-b', existing)).toBeNull()
  })
})

describe('listBookmarks', () => {
  it('lists ids and named anchors, skipping the page shell', () => {
    const el = mountVisual(
      `<div ${PAGE_SHELL_ATTR} id="page"><p>Hi <a id="intro"></a><span id="mid">x</span><a name="legacy">y</a></p></div>`,
    )

    expect(listBookmarks(el).map((entry) => entry.id)).toEqual(['intro', 'legacy', 'mid'])
  })
})

describe('insertBookmarkInDocument', () => {
  it('inserts a named anchor at the caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 5, 5)

    expect(insertBookmarkInDocument(el, 'end')).toBe(true)
    const marker = el.querySelector('a#end')
    expect(marker).not.toBeNull()
    expect(marker?.hasAttribute('href')).toBe(false)
    expect(marker?.textContent).toBe('\u200B')
  })

  it('wraps a selection in a span with the bookmark id', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(insertBookmarkInDocument(el, 'hello')).toBe(true)
    const span = el.querySelector('span#hello')
    expect(span?.textContent).toBe('Hello')
  })

  it('places a marker before an enclosing hyperlink', () => {
    const el = mountVisual('<p><a href="https://example.com">Hello</a></p>')
    selectOffsets(el, 0, 5)

    expect(insertBookmarkInDocument(el, 'beforeLink')).toBe(true)
    expect(el.querySelector('a#beforeLink')).not.toBeNull()
    expect(el.querySelector('a[href]')?.id).toBe('')
    expect(el.querySelector('a#beforeLink')?.nextElementSibling?.getAttribute('href')).toBe(
      'https://example.com',
    )
  })

  it('rejects a duplicate name', () => {
    const el = mountVisual('<p><span id="taken">Hello</span></p>')
    selectOffsets(el, 0, 5)

    expect(insertBookmarkInDocument(el, 'taken')).toBe(false)
  })
})
