import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  htmlFromSnapshotRange,
  insertAtSelection,
  replaceFirstHtmlFragment,
  resolvePinnedBodySelection,
  findRangeForSelectedHtml,
  replaceRangeContents,
  resolveActionSnapshot,
  resolveVisualInsertRange,
  shouldKeepStoredVisualSelection,
  snapshotSelection,
} from './selection'

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

describe('resolveActionSnapshot', () => {
  it('keeps a stored visual range when chrome collapses live selection', () => {
    const visualEl = mountVisual('<p>Hello</p>')
    selectTextNode(visualEl, 0, 5)
    const stored = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })
    selectTextNode(visualEl, 5, 5)
    const live = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    const resolved = resolveActionSnapshot({
      stored,
      mode: 'visual',
      visualEl,
      htmlEl: null,
    })

    expect(resolved).toMatchObject({ collapsed: false, start: 0, end: 5 })
    expect(resolved.visualRange).not.toBeNull()
  })
})

describe('htmlFromSnapshotRange', () => {
  it('returns selected markup from a stored visual snapshot', () => {
    const visualEl = mountVisual('<p>Hello <strong>world</strong></p>')
    const strong = visualEl.querySelector('strong')
    if (!strong) {
      throw new Error('expected strong element')
    }
    const range = document.createRange()
    range.selectNodeContents(strong)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    const snapshot = snapshotSelection({ mode: 'visual', visualEl, htmlEl: null })

    expect(htmlFromSnapshotRange(visualEl, snapshot)).toBe('world')
  })
})

describe('resolvePinnedBodySelection', () => {
  it('matches selected html in serialized page body', () => {
    expect(
      resolvePinnedBodySelection('<p>Hello world</p>', '<p>Hello world</p>', 'world'),
    ).toEqual({ start: 9, end: 14, corpus: 'pageBody' })
  })

  it('falls back to visual inner html when page body does not match', () => {
    expect(
      resolvePinnedBodySelection('<p>Other</p>', '<table><tr><td>Item</td></tr></table>', '<tr><td>Item</td></tr>'),
    ).toEqual({ start: 7, end: 29, corpus: 'visualInner' })
  })

  it('returns null when the fragment is not found', () => {
    expect(resolvePinnedBodySelection('<p>Hi</p>', '<p>Hi</p>', '<span>x</span>')).toBeNull()
  })
})

describe('findRangeForSelectedHtml', () => {
  it('selects an element by outer html', () => {
    const root = document.createElement('div')
    root.innerHTML = '<table><tbody><tr><td>Item</td></tr></tbody></table>'
    const range = findRangeForSelectedHtml(root, '<td>Item</td>')
    expect(range).not.toBeNull()
    expect(range!.toString()).toBe('Item')
  })

  it('selects an element by inner html', () => {
    const root = document.createElement('div')
    root.innerHTML = '<table><tbody><tr><td>Item</td></tr></tbody></table>'
    const range = findRangeForSelectedHtml(root, '<td>Item</td>')
    expect(range).not.toBeNull()
    const row = root.querySelector('tr')
    expect(range!.commonAncestorContainer === row || row?.contains(range!.commonAncestorContainer)).toBe(true)
  })

  it('selects plain text inside the visual root', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>Hello world</p>'
    const range = findRangeForSelectedHtml(root, 'world')
    expect(range).not.toBeNull()
    expect(range!.toString()).toBe('world')
  })
})

describe('resolveVisualInsertRange', () => {
  it('prefers a live captured visual range', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>Hello world</p>'
    const text = root.querySelector('p')!.firstChild as Text
    const visualRange = document.createRange()
    visualRange.setStart(text, 6)
    visualRange.setEnd(text, 11)
    const range = resolveVisualInsertRange(
      root,
      {
        mode: 'visual',
        text: 'world',
        collapsed: false,
        start: 6,
        end: 11,
        visualRange,
      },
      'world',
    )
    expect(range).toBe(visualRange)
  })

  it('finds a table cell from captured selected html after the live range detaches', () => {
    const root = document.createElement('div')
    root.innerHTML = '<table><tbody><tr><td>Item</td></tr></tbody></table>'
    const stale = document.createRange()
    const range = resolveVisualInsertRange(
      root,
      {
        mode: 'visual',
        text: 'Item',
        collapsed: false,
        start: 0,
        end: 4,
        visualRange: stale,
      },
      '<td>Item</td>',
    )
    expect(range).not.toBeNull()
    expect(range!.collapsed).toBe(false)
    expect(range!.toString()).toBe('Item')
  })
})

describe('replaceRangeContents', () => {
  it('keeps template tags inside a table row when inserting html', () => {
    const root = document.createElement('div')
    root.innerHTML = '<table><tbody><tr><td>Item</td></tr></tbody></table>'
    const row = root.querySelector('tr')
    expect(row).not.toBeNull()
    const range = document.createRange()
    range.selectNodeContents(row!)
    replaceRangeContents(range, '{{for items}}<td>Item</td>{{endfor}}', true)
    expect(root.textContent).toBe('{{for items}}Item{{endfor}}')
    expect(root.innerHTML).toContain('<tr>{{for items}}<td>Item</td>{{endfor}}</tr>')
  })

  it('keeps span-wrapped repeat tags when replacing a text selection', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>Hello world</p>'
    const text = root.querySelector('p')!.firstChild as Text
    const range = document.createRange()
    range.setStart(text, 6)
    range.setEnd(text, 11)
    replaceRangeContents(range, '<span>{{for items}}world{{endfor}}</span>', true)
    expect(root.querySelector('span')?.textContent).toBe('{{for items}}world{{endfor}}')
    expect(root.textContent).toBe('Hello {{for items}}world{{endfor}}')
  })
})

describe('replaceFirstHtmlFragment', () => {
  it('replaces the first matching fragment in page html', () => {
    expect(replaceFirstHtmlFragment('<p>Hello world</p>', 'world', '{{for x}}world{{endfor}}')).toBe(
      '<p>Hello {{for x}}world{{endfor}}</p>',
    )
  })

  it('returns null when the fragment is not found', () => {
    expect(replaceFirstHtmlFragment('<p>Hi</p>', '<span>x</span>', 'y')).toBeNull()
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
