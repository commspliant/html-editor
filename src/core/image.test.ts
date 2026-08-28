import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  closestImage,
  defaultImageAttrs,
  IMAGE_MAX_FILE_BYTES,
  insertImageInDocument,
  readImageFileAsDataUrl,
  selectImageInDocument,
  validateImageFile,
  validateImageSrc,
} from './image'
import * as imageWebp from './imageWebp'

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

describe('validateImageSrc', () => {
  it('rejects empty and dangerous schemes', () => {
    expect(validateImageSrc('')).toBe('empty')
    expect(validateImageSrc('   ')).toBe('empty')
    expect(validateImageSrc('javascript:alert(1)')).toBe('invalid')
    expect(validateImageSrc('vbscript:msg')).toBe('invalid')
    expect(validateImageSrc('file:///tmp/a.png')).toBe('invalid')
    expect(validateImageSrc('blob:https://example.com/1')).toBe('invalid')
  })

  it('accepts http(s), relative, and raster data URLs', () => {
    expect(validateImageSrc('https://example.com/a.png')).toBeNull()
    expect(validateImageSrc('http://example.com/a.png')).toBeNull()
    expect(validateImageSrc('/images/a.png')).toBeNull()
    expect(validateImageSrc('./photo.jpg')).toBeNull()
    expect(validateImageSrc('data:image/png;base64,aaaa')).toBeNull()
  })

  it('rejects non-image data URLs and svg', () => {
    expect(validateImageSrc('data:text/plain;base64,aaaa')).toBe('invalid')
    expect(validateImageSrc('data:image/svg+xml;base64,aaaa')).toBe('invalid')
  })
})

describe('validateImageFile', () => {
  it('rejects oversized and non-raster files', () => {
    expect(validateImageFile(new File(['x'], 'photo.svg', { type: 'image/svg+xml' }))).toBe('type')
    expect(validateImageFile(new File(['x'], 'notes.txt', { type: 'text/plain' }))).toBe('type')
    const huge = new File([new Uint8Array(IMAGE_MAX_FILE_BYTES + 1)], 'photo.png', {
      type: 'image/png',
    })
    expect(validateImageFile(huge)).toBe('tooLarge')
  })

  it('accepts raster MIME types', () => {
    expect(validateImageFile(new File(['x'], 'photo.png', { type: 'image/png' }))).toBeNull()
    expect(validateImageFile(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))).toBeNull()
  })
})

describe('readImageFileAsDataUrl', () => {
  afterEach(() => {
    imageWebp.resetWebPEncodingSupportCache()
    vi.restoreAllMocks()
  })

  it('reads a png as a data URL', async () => {
    const file = new File(['png-bytes'], 'photo.png', { type: 'image/png' })
    const src = await readImageFileAsDataUrl(file)
    expect(src.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('embeds webp when conversion succeeds', async () => {
    vi.spyOn(imageWebp, 'supportsWebPEncoding').mockReturnValue(true)
    vi.spyOn(imageWebp, 'shouldConvertImageFileToWebP').mockReturnValue(true)
    vi.spyOn(imageWebp, 'convertImageFileToWebPDataUrl').mockResolvedValue(
      'data:image/webp;base64,QUJD',
    )

    const file = new File(['png-bytes'], 'photo.png', { type: 'image/png' })
    const src = await readImageFileAsDataUrl(file)
    expect(src).toBe('data:image/webp;base64,QUJD')
  })

  it('falls back to the original file when conversion fails', async () => {
    vi.spyOn(imageWebp, 'supportsWebPEncoding').mockReturnValue(true)
    vi.spyOn(imageWebp, 'shouldConvertImageFileToWebP').mockReturnValue(true)
    vi.spyOn(imageWebp, 'convertImageFileToWebPDataUrl').mockResolvedValue(null)

    const file = new File(['png-bytes'], 'photo.png', { type: 'image/png' })
    const src = await readImageFileAsDataUrl(file)
    expect(src.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('keeps gif uploads as gif without attempting conversion', async () => {
    const shouldConvert = vi.spyOn(imageWebp, 'shouldConvertImageFileToWebP')
    const convert = vi.spyOn(imageWebp, 'convertImageFileToWebPDataUrl')

    const file = new File(['gif-bytes'], 'anim.gif', { type: 'image/gif' })
    const src = await readImageFileAsDataUrl(file)
    expect(src.startsWith('data:image/gif;base64,')).toBe(true)
    expect(shouldConvert).toHaveBeenCalled()
    expect(convert).not.toHaveBeenCalled()
  })
})

describe('insertImageInDocument', () => {
  it('inserts an image at the caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 5, 5)

    expect(
      insertImageInDocument(el, defaultImageAttrs({ src: 'https://example.com/a.png' })),
    ).toBe(true)

    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('https://example.com/a.png')
    expect(img?.hasAttribute('alt')).toBe(false)
    expect(img?.hasAttribute('title')).toBe(false)
    expect(img?.style.maxWidth).toBe('100%')
    expect(img?.style.height).toBe('auto')
    expect(el.textContent).toBe('Hello')
  })

  it('replaces a highlighted range with the image', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)

    expect(
      insertImageInDocument(el, defaultImageAttrs({ src: 'https://example.com/a.png' })),
    ).toBe(true)

    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png')
    expect(el.textContent).toBe('')
  })

  it('sets optional alt and title attributes', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertImageInDocument(
      el,
      defaultImageAttrs({
        src: 'https://example.com/a.png',
        alt: 'Chart',
        title: 'Q1 results',
      }),
    )

    const img = el.querySelector('img')
    expect(img?.getAttribute('alt')).toBe('Chart')
    expect(img?.getAttribute('title')).toBe('Q1 results')
  })

  it('applies optional custom css after default sizing', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertImageInDocument(
      el,
      defaultImageAttrs({
        src: 'https://example.com/a.png',
        css: 'width: 120px; border-radius: 8px',
      }),
    )

    const img = el.querySelector('img')
    expect(img?.style.maxWidth).toBe('100%')
    expect(img?.style.height).toBe('auto')
    expect(img?.style.width).toBe('120px')
    expect(img?.style.borderRadius).toBe('8px')
  })

  it('lets custom css override default max-width', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertImageInDocument(
      el,
      defaultImageAttrs({
        src: 'https://example.com/a.png',
        css: 'max-width: 200px',
      }),
    )

    expect(el.querySelector('img')?.style.maxWidth).toBe('200px')
  })

  it('rejects a dangerous src', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 0)

    expect(
      insertImageInDocument(el, defaultImageAttrs({ src: 'javascript:alert(1)' })),
    ).toBe(false)
    expect(el.querySelector('img')).toBeNull()
  })

  it('returns false when the selection is outside the root', () => {
    const el = mountVisual('<p>Hello</p>')
    const other = document.createElement('div')
    other.appendChild(document.createTextNode('x'))
    document.body.appendChild(other)
    const range = document.createRange()
    range.setStart(other.firstChild as Text, 0)
    range.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    expect(
      insertImageInDocument(el, defaultImageAttrs({ src: 'https://example.com/a.png' })),
    ).toBe(false)
  })
})

describe('closestImage', () => {
  it('finds an img from itself or a descendant target', () => {
    const el = mountVisual('<p>Hi <img src="https://example.com/a.png" alt="Chart"></p>')
    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(closestImage(el, img)).toBe(img)
    expect(closestImage(el, el.querySelector('p'))).toBeNull()
    expect(closestImage(el, el)).toBeNull()
  })
})

describe('selectImageInDocument', () => {
  it('selects the image node', () => {
    const el = mountVisual('<p>Hi <img src="https://example.com/a.png" alt="Chart"></p>')
    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(selectImageInDocument(el, img as HTMLImageElement)).toBe(true)

    const sel = window.getSelection()
    expect(sel?.rangeCount).toBe(1)
    const range = sel?.getRangeAt(0)
    expect(range?.collapsed).toBe(false)
    expect(range?.intersectsNode(img as Node)).toBe(true)
  })

  it('returns false when the image is outside the root', () => {
    const el = mountVisual('<p>Hi</p>')
    const img = document.createElement('img')
    img.src = 'https://example.com/a.png'
    document.body.appendChild(img)
    expect(selectImageInDocument(el, img)).toBe(false)
  })
})
