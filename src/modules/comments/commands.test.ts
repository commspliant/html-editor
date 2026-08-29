import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { createCommentsCommands, createCommentsQueries } from './commands'

describe('createCommentsCommands', () => {
  it('calls addComment on context', () => {
    const addComment = vi.fn()
    const commands = createCommentsCommands(context({ addComment }))
    commands.addComment()
    expect(addComment).toHaveBeenCalledOnce()
  })

  it('calls toggleCommentsVisible on context', () => {
    const toggleCommentsVisible = vi.fn()
    const commands = createCommentsCommands(context({ toggleCommentsVisible }))
    commands.toggleCommentsVisible()
    expect(toggleCommentsVisible).toHaveBeenCalledOnce()
  })
})

describe('createCommentsQueries', () => {
  it('reads comment query state from context', () => {
    const queries = createCommentsQueries(
      context({
        canAddComment: () => true,
        areCommentsVisible: () => false,
        isCommentsEnabled: () => true,
      }),
    )
    expect(queries.canAddComment()).toBe(true)
    expect(queries.areCommentsVisible()).toBe(false)
    expect(queries.isCommentsEnabled()).toBe(true)
  })
})
