import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { createHelpCommands } from './commands'

describe('createHelpCommands', () => {
  it('opens editor help', () => {
    const openHelp = vi.fn()
    const commands = createHelpCommands(context({ openHelp }))

    commands.openHelp()

    expect(openHelp).toHaveBeenCalledTimes(1)
  })

  it('opens keyboard shortcuts help', () => {
    const openKeyboardShortcuts = vi.fn()
    const commands = createHelpCommands(context({ openKeyboardShortcuts }))

    commands.openKeyboardShortcuts()

    expect(openKeyboardShortcuts).toHaveBeenCalledTimes(1)
  })

  it('opens about dialog', () => {
    const openAbout = vi.fn()
    const commands = createHelpCommands(context({ openAbout }))

    commands.openAbout()

    expect(openAbout).toHaveBeenCalledTimes(1)
  })
})
