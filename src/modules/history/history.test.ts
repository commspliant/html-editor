import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createDocumentHistory,
  HISTORY_COALESCE_MS,
  HISTORY_MAX_PAST_ENTRIES,
} from './history'

describe('createDocumentHistory', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not allow undo or redo on the initial document', () => {
    const history = createDocumentHistory('<p>Start</p>')

    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.undo()).toBeNull()
    expect(history.redo()).toBeNull()
  })

  it('records a change and undoes it', () => {
    const history = createDocumentHistory('<p>Start</p>')

    history.record('<p>Next</p>')

    expect(history.canUndo()).toBe(true)
    expect(history.undo()).toBe('<p>Start</p>')
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
  })

  it('redoes after undo', () => {
    const history = createDocumentHistory('<p>Start</p>')
    history.record('<p>Next</p>')
    history.undo()

    expect(history.redo()).toBe('<p>Next</p>')
    expect(history.canRedo()).toBe(false)
    expect(history.canUndo()).toBe(true)
  })

  it('ignores equal HTML', () => {
    const history = createDocumentHistory('<p>Start</p>')

    history.record('<p>Start</p>')

    expect(history.canUndo()).toBe(false)
  })

  it('coalesces rapid records into one undo step', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const history = createDocumentHistory('')

    history.record('a', { coalesce: true })
    vi.setSystemTime(100)
    history.record('ab', { coalesce: true })
    vi.setSystemTime(200)
    history.record('abc', { coalesce: true })

    expect(history.undo()).toBe('')
    expect(history.redo()).toBe('abc')
  })

  it('starts a new step after the coalesce window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const history = createDocumentHistory('')

    history.record('a', { coalesce: true })
    vi.setSystemTime(HISTORY_COALESCE_MS)
    history.record('ab', { coalesce: true })

    expect(history.undo()).toBe('a')
    expect(history.undo()).toBe('')
  })

  it('does not coalesce command records', () => {
    const history = createDocumentHistory('')

    history.record('a', { coalesce: true })
    history.record('b', { coalesce: false })

    expect(history.undo()).toBe('a')
    expect(history.undo()).toBe('')
  })

  it('clears redo when a new edit is recorded', () => {
    const history = createDocumentHistory('')
    history.record('a')
    history.undo()

    expect(history.canRedo()).toBe(true)

    history.record('b')

    expect(history.canRedo()).toBe(false)
    expect(history.undo()).toBe('')
  })

  it('skips record while applying a restore', () => {
    const history = createDocumentHistory('start')

    history.markApplying()
    history.record('restored')

    expect(history.canUndo()).toBe(false)
    expect(history.undo()).toBeNull()

    history.record('next')

    expect(history.undo()).toBe('restored')
  })

  it('records an external value change', () => {
    const history = createDocumentHistory('a')

    history.syncExternal('a')
    expect(history.canUndo()).toBe(false)

    history.syncExternal('b')

    expect(history.undo()).toBe('a')
  })

  it('caps past entries to avoid unbounded memory growth', () => {
    const history = createDocumentHistory('0')

    for (let index = 1; index <= HISTORY_MAX_PAST_ENTRIES + 25; index += 1) {
      history.record(String(index))
    }

    let undoCount = 0
    while (history.canUndo()) {
      history.undo()
      undoCount += 1
    }

    expect(undoCount).toBe(HISTORY_MAX_PAST_ENTRIES)
    expect(history.undo()).toBeNull()
  })

  it('drops past entries when total characters exceed budget', () => {
    const history = createDocumentHistory('0')
    const largePayload = 'x'.repeat(12_000_000)
    history.record(largePayload)
    history.record('1')
    history.record('2')
    expect(history.canUndo()).toBe(true)
  })
})
