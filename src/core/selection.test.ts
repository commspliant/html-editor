import { afterEach, describe, expect, it, vi } from 'vitest'
import { insertAtSelection, shouldKeepStoredVisualSelection, snapshotSelection } from './selection'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function selectTextNode(el: HTMLElement, start: number, end: number) {
  const text = el.querySelector('p')?.firstChild
  if (!text || text.nodeType !== Node.TEXT_NODE) {
    throw new Error('expected a paragraph text node')
  }
  const range = document.createRange()
  range.setStart(text, start)
  range.setEnd(text, end)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('snapshotSelection', () => {
  it('reads textarea offsets in html mode', () => {
    const htmlEl = document.createElement('textarea')
    htmlEl.value = 'Hello world'
    htmlEl.selectionStart = 6
    htmlEl.selectionEnd = 11

    expect(
      snapshotSelection({ mode: 'html', visualEl: null, htmlEl }),
    ).toMatchObject({
      mode: 'html',
      text: 'world',
      collapsed: false,
      start: 6,
      end: 11,
    })
  })

  it('reads a visual range inside the surface', () => {
    const visualEl = mountVisual('<p>Hello world</p>')
    selectTextNode(visualEl, 6, 11)

    const snapshot = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })
    expect(snapshot).toMatchObject({
      mode: 'visual',
      text: 'world',
      collapsed: false,
      start: 6,
      end: 11,
    })
    expect(snapshot.visualRange).not.toBeNull()
  })
})

describe('shouldKeepStoredVisualSelection', () => {
  it('keeps a collapsed caret when the live selection left the surface', () => {
    const visualEl = mountVisual('<p>Hello</p>')
    selectTextNode(visualEl, 2, 2)
    const stored = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })
    const live = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })
    live.visualRange = null

    expect(shouldKeepStoredVisualSelection(stored, live)).toBe(true)
  })

  it('does not keep a collapsed caret when the live selection is still in the surface', () => {
    const visualEl = mountVisual('<p>Hello</p>')
    selectTextNode(visualEl, 2, 2)
    const stored = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })
    selectTextNode(visualEl, 4, 4)
    const live = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    expect(shouldKeepStoredVisualSelection(stored, live)).toBe(false)
  })

  it('keeps a non-collapsed range when chrome collapses the live selection', () => {
    const visualEl = mountVisual('<p>Hello</p>')
    selectTextNode(visualEl, 0, 5)
    const stored = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })
    selectTextNode(visualEl, 5, 5)
    const live = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    expect(shouldKeepStoredVisualSelection(stored, live)).toBe(true)
  })
})

describe('insertAtSelection', () => {
  it('replaces the html-mode selection', () => {
    const htmlEl = document.createElement('textarea')
    htmlEl.value = 'Hello world'
    htmlEl.selectionStart = 6
    htmlEl.selectionEnd = 11
    document.body.appendChild(htmlEl)
    const setHtml = vi.fn()
    const snapshot = snapshotSelection({ mode: 'html', visualEl: null, htmlEl })

    insertAtSelection({
      snapshot,
      visualEl: null,
      htmlEl,
      getHtml: () => htmlEl.value,
      setHtml,
      content: '<em>there</em>',
      asHtml: true,
    })

    expect(setHtml).toHaveBeenCalledWith('Hello <em>there</em>')
  })

  it('escapes formatted text in html mode', () => {
    const htmlEl = document.createElement('textarea')
    htmlEl.value = 'Hello world'
    htmlEl.selectionStart = 6
    htmlEl.selectionEnd = 11
    document.body.appendChild(htmlEl)
    const setHtml = vi.fn()
    const snapshot = snapshotSelection({ mode: 'html', visualEl: null, htmlEl })

    insertAtSelection({
      snapshot,
      visualEl: null,
      htmlEl,
      getHtml: () => htmlEl.value,
      setHtml,
      content: '<em>there</em>',
      asHtml: false,
    })

    expect(setHtml).toHaveBeenCalledWith('Hello &lt;em&gt;there&lt;/em&gt;')
  })

  it('inserts at a collapsed html-mode caret', () => {
    const htmlEl = document.createElement('textarea')
    htmlEl.value = 'Hello'
    htmlEl.selectionStart = 5
    htmlEl.selectionEnd = 5
    document.body.appendChild(htmlEl)
    const setHtml = vi.fn()
    const snapshot = snapshotSelection({ mode: 'html', visualEl: null, htmlEl })

    insertAtSelection({
      snapshot,
      visualEl: null,
      htmlEl,
      getHtml: () => 'Hello',
      setHtml,
      content: '!',
      asHtml: false,
    })

    expect(setHtml).toHaveBeenCalledWith('Hello!')
  })

  it('replaces selected visual text', () => {
    const visualEl = mountVisual('<p>Hello world</p>')
    selectTextNode(visualEl, 6, 11)
    const setHtml = vi.fn()
    const snapshot = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    insertAtSelection({
      snapshot,
      visualEl,
      htmlEl: null,
      getHtml: () => visualEl.innerHTML,
      setHtml,
      content: 'there',
      asHtml: false,
    })

    expect(visualEl.textContent).toBe('Hello there')
    expect(setHtml).toHaveBeenCalledWith(visualEl.innerHTML)
  })

  it('inserts html into the visual selection', () => {
    const visualEl = mountVisual('<p>Hello world</p>')
    selectTextNode(visualEl, 6, 11)
    const setHtml = vi.fn()
    const snapshot = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    insertAtSelection({
      snapshot,
      visualEl,
      htmlEl: null,
      getHtml: () => visualEl.innerHTML,
      setHtml,
      content: '<strong>there</strong>',
      asHtml: true,
    })

    expect(visualEl.querySelector('strong')?.textContent).toBe('there')
    expect(setHtml).toHaveBeenCalledWith(visualEl.innerHTML)
  })

  it('inserts formatted text without parsing markup', () => {
    const visualEl = mountVisual('<p>Hello world</p>')
    selectTextNode(visualEl, 6, 11)
    const setHtml = vi.fn()
    const snapshot = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    insertAtSelection({
      snapshot,
      visualEl,
      htmlEl: null,
      getHtml: () => visualEl.innerHTML,
      setHtml,
      content: '<strong>there</strong>',
      asHtml: false,
    })

    expect(visualEl.querySelector('strong')).toBeNull()
    expect(visualEl.textContent).toBe('Hello <strong>there</strong>')
  })
})
