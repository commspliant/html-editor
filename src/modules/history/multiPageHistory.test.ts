import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HISTORY_COALESCE_MS,
  HISTORY_MAX_PAST_ENTRIES,
  HISTORY_MAX_TOTAL_CHARS,
} from './history'
import { createMultiPageHistory } from './multiPageHistory'

describe('createMultiPageHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not allow undo or redo on the initial document', () => {
    const history = createMultiPageHistory(['<p>One</p>', '<p>Two</p>'])

    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
    expect(history.undo()).toBeNull()
    expect(history.redo()).toBeNull()
  })

  it('records a page edit and undoes only that page', () => {
    const history = createMultiPageHistory(['<p>One</p>', '<p>Two</p>'])

    history.recordPageEdit(1, '<p>Edited</p>')

    expect(history.canUndo()).toBe(true)
    expect(history.undo()).toEqual(['<p>One</p>', '<p>Two</p>'])
    expect(history.getPresent()).toEqual(['<p>One</p>', '<p>Two</p>'])
    expect(history.canRedo()).toBe(true)
    expect(history.redo()).toEqual(['<p>One</p>', '<p>Edited</p>'])
  })

  it('coalesces rapid edits on the same page into one undo step', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordPageEdit(0, 'a', { coalesce: true })
    vi.advanceTimersByTime(HISTORY_COALESCE_MS - 1)
    history.recordPageEdit(0, 'ab', { coalesce: true })
    vi.advanceTimersByTime(HISTORY_COALESCE_MS - 1)
    history.recordPageEdit(0, 'abc', { coalesce: true })

    expect(history.undo()).toEqual(['<p>One</p>'])
    expect(history.redo()).toEqual(['abc'])
  })

  it('does not coalesce edits on different pages', () => {
    const history = createMultiPageHistory(['<p>One</p>', '<p>Two</p>'])

    history.recordPageEdit(0, '<p>A</p>', { coalesce: true })
    vi.advanceTimersByTime(1)
    history.recordPageEdit(1, '<p>B</p>', { coalesce: true })

    expect(history.undo()).toEqual(['<p>A</p>', '<p>Two</p>'])
    expect(history.undo()).toEqual(['<p>One</p>', '<p>Two</p>'])
  })

  it('undoes and redoes insert page', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordInsertPage(1, ['<p>One</p>', '<p>New</p>'])

    expect(history.getPresent()).toEqual(['<p>One</p>', '<p>New</p>'])
    expect(history.undo()).toEqual(['<p>One</p>'])
    expect(history.redo()).toEqual(['<p>One</p>', '<p>New</p>'])
  })

  it('undoes and redoes delete page', () => {
    const history = createMultiPageHistory(['<p>One</p>', '<p>Two</p>'])

    history.recordDeletePage(1, '<p>Two</p>', ['<p>One</p>'])

    expect(history.getPresent()).toEqual(['<p>One</p>'])
    expect(history.undo()).toEqual(['<p>One</p>', '<p>Two</p>'])
    expect(history.redo()).toEqual(['<p>One</p>'])
  })

  it('undoes and redoes replace all', () => {
    const history = createMultiPageHistory(['<p>One</p>', '<p>Two</p>'])

    history.recordReplaceAll(['<p>All new</p>'])

    expect(history.undo()).toEqual(['<p>One</p>', '<p>Two</p>'])
    expect(history.redo()).toEqual(['<p>All new</p>'])
  })

  it('does not record when page content is unchanged', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordPageEdit(0, '<p>One</p>')

    expect(history.canUndo()).toBe(false)
  })

  it('syncPages matches replaceAll and skips identical state', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.syncPages(['<p>One</p>'])
    expect(history.canUndo()).toBe(false)

    history.syncPages(['<p>Other</p>'])
    expect(history.canUndo()).toBe(true)
    expect(history.undo()).toEqual(['<p>One</p>'])
  })

  it('clears redo when a new edit is recorded', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordPageEdit(0, '<p>Next</p>')
    history.undo()
    expect(history.canRedo()).toBe(true)

    history.recordPageEdit(0, '<p>Other</p>')
    expect(history.canRedo()).toBe(false)
    expect(history.undo()).toEqual(['<p>One</p>'])
  })

  it('markApplying skips recording on the next write', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.markApplying()
    history.recordPageEdit(0, '<p>Restored</p>')

    expect(history.canUndo()).toBe(false)
    expect(history.getPresent()).toEqual(['<p>Restored</p>'])
  })

  it('trims past entries beyond HISTORY_MAX_PAST_ENTRIES', () => {
    const history = createMultiPageHistory(['0'])

    for (let index = 1; index <= HISTORY_MAX_PAST_ENTRIES + 5; index += 1) {
      history.recordPageEdit(0, String(index))
    }

    let undoCount = 0
    while (history.canUndo()) {
      history.undo()
      undoCount += 1
    }

    expect(undoCount).toBe(HISTORY_MAX_PAST_ENTRIES)
    expect(history.undo()).toBeNull()
  })

  it('trims past entries when total character budget is exceeded', () => {
    const history = createMultiPageHistory(['0'])
    const largePayload = 'x'.repeat(Math.floor(HISTORY_MAX_TOTAL_CHARS / 2))

    history.recordPageEdit(0, largePayload)
    history.recordPageEdit(0, '1')
    history.recordPageEdit(0, '2')

    expect(history.canUndo()).toBe(true)
  })

  it('keeps redo after undo when applyPresent consumes markApplying', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordPageEdit(0, '<p>Edited</p>')
    history.undo()
    history.markApplying()
    history.applyPresent(['<p>One</p>'])

    expect(history.canRedo()).toBe(true)
    expect(history.redo()).toEqual(['<p>Edited</p>'])
  })

  it('applyPresent with equal pages does not clear redo', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordPageEdit(0, '<p>Edited</p>')
    history.undo()
    history.applyPresent(['<p>One</p>'])

    expect(history.canRedo()).toBe(true)
  })

  it('syncPages with unequal pages still clears redo', () => {
    const history = createMultiPageHistory(['<p>One</p>'])

    history.recordPageEdit(0, '<p>Edited</p>')
    history.undo()
    expect(history.canRedo()).toBe(true)

    history.syncPages(['<p>External</p>'])
    expect(history.canRedo()).toBe(false)
  })
})
