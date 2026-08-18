import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createReadAloudSession,
  htmlToPlainText,
  isSpeechSynthesisSupported,
  resolveReadAloudText,
} from './readAloud'

describe('htmlToPlainText', () => {
  it('extracts visible text from html', () => {
    expect(htmlToPlainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('returns an empty string for markup with no text', () => {
    expect(htmlToPlainText('<p><br></p>')).toBe('')
  })
})

describe('resolveReadAloudText', () => {
  it('prefers selected text over the full document', () => {
    expect(
      resolveReadAloudText(
        { text: 'Selected', collapsed: false, start: 0, end: 8 },
        '<p>Document</p>',
      ),
    ).toBe('Selected')
  })

  it('falls back to document text when the selection is empty', () => {
    expect(
      resolveReadAloudText(
        { text: '', collapsed: true, start: 0, end: 0 },
        '<p>Document</p>',
      ),
    ).toBe('Document')
  })

  it('returns null when there is nothing to read', () => {
    expect(
      resolveReadAloudText(
        { text: '', collapsed: true, start: 0, end: 0 },
        '<p><br></p>',
      ),
    ).toBeNull()
  })
})

describe('createReadAloudSession', () => {
  let speaking = false
  let lastUtterance: { text: string; onend?: (event: SpeechSynthesisEvent) => void; onerror?: (event: SpeechSynthesisEvent) => void } | null = null
  const cancel = vi.fn(() => {
    speaking = false
  })
  const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
    lastUtterance = utterance
    speaking = true
  })

  beforeEach(() => {
    speaking = false
    lastUtterance = null
    cancel.mockClear()
    speak.mockClear()
    class MockSpeechSynthesisUtterance {
      text: string
      onend: ((event: SpeechSynthesisEvent) => void) | undefined
      onerror: ((event: SpeechSynthesisEvent) => void) | undefined

      constructor(text: string) {
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        get speaking() {
          return speaking
        },
        speak,
        cancel,
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts speaking and notifies on toggle', () => {
    const onChange = vi.fn()
    const session = createReadAloudSession(onChange)

    session.toggle('Hello')

    expect(speak).toHaveBeenCalledTimes(1)
    expect(lastUtterance?.text).toBe('Hello')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(session.isSpeaking()).toBe(true)
  })

  it('cancels speech when toggled while speaking', () => {
    const onChange = vi.fn()
    const session = createReadAloudSession(onChange)

    session.toggle('Hello')
    session.toggle('Ignored')

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(speak).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('notifies when speech ends', () => {
    const onChange = vi.fn()
    const session = createReadAloudSession(onChange)

    session.toggle('Hello')
    lastUtterance?.onend?.({} as SpeechSynthesisEvent)

    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('reports support when speech synthesis exists', () => {
    expect(isSpeechSynthesisSupported()).toBe(true)
  })
})
