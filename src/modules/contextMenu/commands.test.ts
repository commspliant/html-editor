import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { createContextMenuCommands } from './commands'

describe('createContextMenuCommands', () => {
  it('forwards cut, copy, and delete', async () => {
    const cut = vi.fn(async () => undefined)
    const copy = vi.fn(async () => undefined)
    const deleteSelection = vi.fn()
    const commands = createContextMenuCommands(context({ cut, copy, deleteSelection }))

    await commands.cut()
    await commands.copy()
    commands.deleteSelection()

    expect(cut).toHaveBeenCalledTimes(1)
    expect(copy).toHaveBeenCalledTimes(1)
    expect(deleteSelection).toHaveBeenCalledTimes(1)
  })
})
