import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearFontFamilyParseCache,
  collectDocumentFontStylesheets,
  collectPreviewFontStylesheets,
  extractFontStylesheets,
  FONT_STYLESHEET_ATTR,
  fontFamilyUsedInHtml,
  fontFamilyUsedInRoot,
  isAllowedFontStylesheetUrl,
  mergeFontFaces,
  normalizeFontFamily,
  prependFontStylesheets,
  queryInheritedFontFamily,
  setFontFamilyInDocument,
  WEB_SAFE_FONTS,
} from './fontFamily'

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
  clearFontFamilyParseCache()
})

describe('normalizeFontFamily', () => {
  it('treats quoted and unquoted stacks as equal', () => {
    expect(normalizeFontFamily('Georgia, serif')).toBe(normalizeFontFamily('"Georgia", serif'))
  })
})

describe('mergeFontFaces', () => {
  it('appends custom faces and skips duplicate families', () => {
    const merged = mergeFontFaces([
      { name: 'Georgia Clone', family: 'Georgia, serif' },
      { name: 'Roboto', family: 'Roboto, sans-serif', css: 'https://fonts.googleapis.com/css2?family=Roboto' },
    ])
    expect(merged.some((font) => font.name === 'Georgia Clone')).toBe(false)
    expect(merged.some((font) => font.name === 'Georgia')).toBe(true)
    expect(merged.at(-1)).toMatchObject({ name: 'Roboto', family: 'Roboto, sans-serif' })
    expect(merged.length).toBe(WEB_SAFE_FONTS.length + 1)
  })
})

describe('font stylesheet urls', () => {
  it('allows http(s) and rejects other schemes', () => {
    expect(isAllowedFontStylesheetUrl('https://fonts.googleapis.com/css2?family=Roboto')).toBe(true)
    expect(isAllowedFontStylesheetUrl('http://localhost:3000/fonts.css')).toBe(true)
    expect(isAllowedFontStylesheetUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedFontStylesheetUrl('data:text/css,body{}')).toBe(false)
  })

  it('round-trips stylesheet links around a body fragment', () => {
    const href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap'
    const html = prependFontStylesheets('<p>Hello</p>', [href])
    expect(html).toContain(FONT_STYLESHEET_ATTR)
    expect(html.startsWith('<link ')).toBe(true)
    const extracted = extractFontStylesheets(html)
    expect(extracted.hrefs).toEqual([href])
    expect(extracted.body).toBe('<p>Hello</p>')
  })

  it('leaves html without font links unchanged', () => {
    expect(extractFontStylesheets('<p>Hello</p>')).toEqual({ hrefs: [], body: '<p>Hello</p>' })
  })

  it('detects an authored family in html and collects used custom css', () => {
    const body = '<p><span style="font-family: Pacifico, cursive">Hi</span></p>'
    expect(fontFamilyUsedInHtml(body, 'Pacifico, cursive')).toBe(true)
    expect(fontFamilyUsedInHtml(body, 'Roboto, sans-serif')).toBe(false)
    expect(
      collectDocumentFontStylesheets(body, '<p>Hi</p>', [
        { name: 'Pacifico', family: 'Pacifico, cursive', css: 'https://example.com/pacifico.css' },
        { name: 'Roboto', family: 'Roboto, sans-serif', css: 'https://example.com/roboto.css' },
      ]),
    ).toEqual(['https://example.com/pacifico.css'])
  })

  it('ignores plain-text occurrences of font names without font styling', () => {
    const body = '<p>We live in modern pacifico times and roboto places</p>'
    expect(fontFamilyUsedInHtml(body, 'Pacifico, cursive')).toBe(false)
    expect(fontFamilyUsedInHtml(body, 'Roboto, sans-serif')).toBe(false)
  })

  it('keeps previous document links even when the customFonts prop is empty', () => {
    const previous = prependFontStylesheets('<p>Hi</p>', ['https://example.com/pacifico.css'])
    expect(collectDocumentFontStylesheets('<p>Hi</p>', previous, [])).toEqual([
      'https://example.com/pacifico.css',
    ])
  })

  it('loads every custom css url for picker preview', () => {
    expect(
      collectPreviewFontStylesheets('<p>Hi</p>', [
        { name: 'Roboto', family: 'Roboto, sans-serif', css: 'https://example.com/roboto.css' },
      ]),
    ).toEqual(['https://example.com/roboto.css'])
  })

  it('reuses parse cache for repeated html checks', () => {
    const body = '<p><span style="font-family: Pacifico, cursive">Hi</span></p>'
    const parseSpy = vi.spyOn(DOMParser.prototype, 'parseFromString')
    try {
      expect(fontFamilyUsedInHtml(body, 'Pacifico, cursive')).toBe(true)
      expect(fontFamilyUsedInHtml(body, 'Pacifico, cursive')).toBe(true)
      expect(parseSpy).toHaveBeenCalledTimes(1)
    } finally {
      parseSpy.mockRestore()
      clearFontFamilyParseCache()
    }
  })

  it('matches live root and parsed html for equivalent markup', () => {
    const html = '<p><span style="font-family: Pacifico, cursive">Hi</span></p>'
    const root = document.createElement('div')
    root.innerHTML = html
    expect(fontFamilyUsedInRoot(root, 'Pacifico, cursive')).toBe(true)
    expect(fontFamilyUsedInHtml(html, 'Pacifico, cursive')).toBe(true)
    expect(fontFamilyUsedInRoot(root, 'Roboto, sans-serif')).toBe(false)
  })

  it('prefers live root when collecting document font stylesheets', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p><span style="font-family: Pacifico, cursive">Hi</span></p>'
    const hrefs = collectDocumentFontStylesheets('<p>Hi</p>', '<p>Hi</p>', [
      { name: 'Pacifico', family: 'Pacifico, cursive', css: 'https://example.com/pacifico.css' },
    ], { liveRoot: root })
    expect(hrefs).toEqual(['https://example.com/pacifico.css'])
  })
})

describe('setFontFamilyInDocument', () => {
  it('wraps a range with an inline font-family', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(setFontFamilyInDocument(el, 'Georgia, serif')).toBe(true)
    expect(el.querySelector('span')).toHaveStyle({ fontFamily: 'Georgia, serif' })
  })

  it('does nothing for a collapsed caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 2, 2)
    expect(setFontFamilyInDocument(el, 'Georgia, serif')).toBe(false)
    expect(el.innerHTML).toBe('<p>Hello</p>')
  })

  it('clears an authored family for Default', () => {
    const el = mountVisual('<p><span style="font-family: Georgia, serif">Hello</span></p>')
    selectOffsets(el, 0, 5)
    expect(setFontFamilyInDocument(el, null)).toBe(true)
    expect(el.querySelector('span')).toBeNull()
    expect(el.textContent).toBe('Hello')
  })
})

describe('queryInheritedFontFamily', () => {
  it('reads an authored family', () => {
    const el = mountVisual('<p><span style="font-family: Georgia, serif">Hello</span></p>')
    selectOffsets(el, 0, 5)
    expect(queryInheritedFontFamily(el)).toMatchObject({ mixed: false })
    expect(normalizeFontFamily(queryInheritedFontFamily(el).value ?? '')).toBe(
      normalizeFontFamily('Georgia, serif'),
    )
  })

  it('reports mixed when families differ', () => {
    const el = mountVisual(
      '<p><span style="font-family: Georgia, serif">Hi</span><span style="font-family: Arial, Helvetica, sans-serif"> there</span></p>',
    )
    selectOffsets(el, 0, 8)
    expect(queryInheritedFontFamily(el)).toEqual({ value: null, mixed: true })
  })

  it('reports Default when nothing is authored', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(queryInheritedFontFamily(el)).toEqual({ value: null, mixed: false })
  })
})
