import { afterEach, describe, expect, it } from 'vitest'
import {
  AUDIO_MAX_FILE_BYTES,
  defaultAudioAttrs,
  insertAudioInDocument,
  readAudioFileAsDataUrl,
  validateAudioFile,
  validateAudioSrc,
} from './audio'

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

describe('validateAudioSrc', () => {
  it('rejects empty and dangerous schemes', () => {
    expect(validateAudioSrc('')).toBe('empty')
    expect(validateAudioSrc('javascript:alert(1)')).toBe('invalid')
    expect(validateAudioSrc('file:///tmp/a.mp3')).toBe('invalid')
  })

  it('accepts http(s), relative, and audio data URLs', () => {
    expect(validateAudioSrc('https://example.com/track.mp3')).toBeNull()
    expect(validateAudioSrc('/audio/track.mp3')).toBeNull()
    expect(validateAudioSrc('data:audio/mpeg;base64,aaaa')).toBeNull()
  })

  it('rejects non-audio data URLs', () => {
    expect(validateAudioSrc('data:text/plain;base64,aaaa')).toBe('invalid')
  })
})

describe('validateAudioFile', () => {
  it('rejects oversized and non-audio files', () => {
    expect(validateAudioFile(new File(['x'], 'photo.png', { type: 'image/png' }))).toBe('type')
    const huge = new File([new Uint8Array(AUDIO_MAX_FILE_BYTES + 1)], 'track.mp3', {
      type: 'audio/mpeg',
    })
    expect(validateAudioFile(huge)).toBe('tooLarge')
  })

  it('accepts audio MIME types', () => {
    expect(validateAudioFile(new File(['x'], 'track.mp3', { type: 'audio/mpeg' }))).toBeNull()
    expect(validateAudioFile(new File(['x'], 'track.wav', { type: 'audio/wav' }))).toBeNull()
  })
})

describe('readAudioFileAsDataUrl', () => {
  it('reads an mp3 as a data URL', async () => {
    const file = new File(['mp3-bytes'], 'track.mp3', { type: 'audio/mpeg' })
    const src = await readAudioFileAsDataUrl(file)
    expect(src.startsWith('data:audio/mpeg;base64,')).toBe(true)
  })
})

describe('insertAudioInDocument', () => {
  it('inserts an audio element at the caret', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 5, 5)

    expect(
      insertAudioInDocument(el, defaultAudioAttrs({ src: 'https://example.com/track.mp3' })),
    ).toBe(true)

    const audio = el.querySelector('audio')
    expect(audio).not.toBeNull()
    expect(audio?.getAttribute('src')).toBe('https://example.com/track.mp3')
    expect(audio?.hasAttribute('controls')).toBe(true)
    expect(audio?.style.maxWidth).toBe('100%')
  })

  it('sets optional title', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 2, 2)

    insertAudioInDocument(
      el,
      defaultAudioAttrs({
        src: 'https://example.com/track.mp3',
        title: 'Intro',
      }),
    )

    expect(el.querySelector('audio')?.getAttribute('title')).toBe('Intro')
  })

  it('rejects a dangerous src', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 0)

    expect(
      insertAudioInDocument(el, defaultAudioAttrs({ src: 'javascript:alert(1)' })),
    ).toBe(false)
    expect(el.querySelector('audio')).toBeNull()
  })
})
