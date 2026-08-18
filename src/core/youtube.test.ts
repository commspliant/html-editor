import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultVideoAttrs,
  defaultYoutubeAttrs,
  insertVideoInDocument,
  insertYoutubeInDocument,
  parseYoutubeVideoId,
  validateVideoSrc,
  validateYoutubeUrl,
  youtubeEmbedUrl,
} from './youtube'

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

describe('parseYoutubeVideoId', () => {
  it('extracts ids from common YouTube URL formats', () => {
    expect(parseYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYoutubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYoutubeVideoId('https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
  })

  it('returns null for non-YouTube URLs', () => {
    expect(parseYoutubeVideoId('https://example.com/video.mp4')).toBeNull()
    expect(parseYoutubeVideoId('')).toBeNull()
  })
})

describe('validateYoutubeUrl', () => {
  it('rejects empty and dangerous URLs', () => {
    expect(validateYoutubeUrl('')).toBe('empty')
    expect(validateYoutubeUrl('javascript:alert(1)')).toBe('invalid')
    expect(validateYoutubeUrl('https://example.com/')).toBe('invalid')
  })

  it('accepts valid YouTube URLs', () => {
    expect(validateYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
  })
})

describe('youtubeEmbedUrl', () => {
  it('builds the embed URL', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })
})

describe('validateVideoSrc', () => {
  it('accepts YouTube and http(s) video URLs', () => {
    expect(validateVideoSrc('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(validateVideoSrc('https://example.com/clip.mp4')).toBeNull()
  })

  it('rejects empty and dangerous src', () => {
    expect(validateVideoSrc('')).toBe('empty')
    expect(validateVideoSrc('javascript:alert(1)')).toBe('invalid')
  })
})

describe('insertYoutubeInDocument', () => {
  it('inserts an iframe with embed src', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 5, 5)

    expect(
      insertYoutubeInDocument(
        el,
        defaultYoutubeAttrs({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
      ),
    ).toBe(true)

    const iframe = el.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('src')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true)
    expect(iframe?.style.maxWidth).toBe('100%')
    expect(iframe?.style.border).toBe('0px')
  })

  it('sets optional title on iframe', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertYoutubeInDocument(
      el,
      defaultYoutubeAttrs({
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'Demo',
      }),
    )

    expect(el.querySelector('iframe')?.getAttribute('title')).toBe('Demo')
  })
})

describe('insertVideoInDocument', () => {
  it('inserts iframe for YouTube src', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertVideoInDocument(
      el,
      defaultVideoAttrs({ src: 'https://youtu.be/dQw4w9WgXcQ' }),
    )

    expect(el.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
    expect(el.querySelector('video')).toBeNull()
  })

  it('inserts video element for non-YouTube src', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertVideoInDocument(
      el,
      defaultVideoAttrs({ src: 'https://example.com/clip.mp4', title: 'Clip' }),
    )

    const video = el.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.getAttribute('src')).toBe('https://example.com/clip.mp4')
    expect(video?.getAttribute('title')).toBe('Clip')
    expect(el.querySelector('iframe')).toBeNull()
  })
})
