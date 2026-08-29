import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { createHistoryCommands, createHistoryQueries } from './commands'

describe('createHistoryCommands', () => {
  it('runs undo on the context', () => {
    const undo = vi.fn()
    const commands = createHistoryCommands(context({ undo }))

    commands.undo()

    expect(undo).toHaveBeenCalledTimes(1)
  })

  it('runs redo on the context', () => {
    const redo = vi.fn()
    const commands = createHistoryCommands(context({ redo }))

    commands.redo()

    expect(redo).toHaveBeenCalledTimes(1)
  })
})

describe('createHistoryQueries', () => {
  it('reports undo availability', () => {
    expect(createHistoryQueries(context({ canUndo: () => false })).canUndo()).toBe(false)
    expect(createHistoryQueries(context({ canUndo: () => true })).canUndo()).toBe(true)
  })

  it('reports redo availability', () => {
    expect(createHistoryQueries(context({ canRedo: () => false })).canRedo()).toBe(false)
    expect(createHistoryQueries(context({ canRedo: () => true })).canRedo()).toBe(true)
  })
})
