import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  copySelectionInDocument,
  cutSelectionInDocument,
  deleteSelectionInDocument,
  serializeSelection,
} from './clipboard'
import { selectImageInDocument } from './image'

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

class FakeClipboardItem {
  constructor(public items: Record<string, Blob>) {}
}

beforeEach(() => {
  vi.stubGlobal('ClipboardItem', FakeClipboardItem)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      write: vi.fn(async () => undefined),
      writeText: vi.fn(async () => undefined),
    },
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
  vi.unstubAllGlobals()
})

describe('serializeSelection', () => {
  it('serializes a text range to html and plain text', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(serializeSelection(el)).toEqual({ html: 'Hello', text: 'Hello' })
  })

  it('serializes a selected image', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png" alt="Chart"></p>')
    const img = el.querySelector('img') as HTMLImageElement
    selectImageInDocument(el, img)
    const payload = serializeSelection(el)
    expect(payload?.html).toContain('src="https://example.com/a.png"')
    expect(payload?.text).toBe('Chart')
  })

  it('returns null for a collapsed caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 2, 2)
    expect(serializeSelection(el)).toBeNull()
  })
})

describe('deleteSelectionInDocument', () => {
  it('deletes a text range', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 1, 4)
    expect(deleteSelectionInDocument(el)).toBe(true)
    expect(el.textContent).toBe('Ho')
  })

  it('deletes a selected image', () => {
    const el = mountVisual('<p>Hi <img src="https://example.com/a.png" alt="Chart"> there</p>')
    const img = el.querySelector('img') as HTMLImageElement
    selectImageInDocument(el, img)
    expect(deleteSelectionInDocument(el)).toBe(true)
    expect(el.querySelector('img')).toBeNull()
    expect(el.textContent).toBe('Hi  there')
  })

  it('returns false when the caret is collapsed', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 2, 2)
    expect(deleteSelectionInDocument(el)).toBe(false)
    expect(el.textContent).toBe('Hello')
  })
})

describe('copySelectionInDocument', () => {
  it('writes html and plain text to the clipboard', async () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(await copySelectionInDocument(el)).toBe(true)
    expect(navigator.clipboard.write).toHaveBeenCalledTimes(1)
    const items = vi.mocked(navigator.clipboard.write).mock.calls[0][0]
    expect(items).toHaveLength(1)
    expect(items[0]).toBeInstanceOf(FakeClipboardItem)
  })

  it('returns false when nothing is selected', async () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 1, 1)
    expect(await copySelectionInDocument(el)).toBe(false)
    expect(navigator.clipboard.write).not.toHaveBeenCalled()
  })
})

describe('cutSelectionInDocument', () => {
  it('copies then deletes a text range', async () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(await cutSelectionInDocument(el)).toBe(true)
    expect(navigator.clipboard.write).toHaveBeenCalledTimes(1)
    expect(el.textContent).toBe('')
  })

  it('copies then deletes a selected image', async () => {
    const el = mountVisual('<p><img src="https://example.com/a.png" alt="Chart"></p>')
    const img = el.querySelector('img') as HTMLImageElement
    selectImageInDocument(el, img)
    expect(await cutSelectionInDocument(el)).toBe(true)
    expect(navigator.clipboard.write).toHaveBeenCalledTimes(1)
    expect(el.querySelector('img')).toBeNull()
  })
})
