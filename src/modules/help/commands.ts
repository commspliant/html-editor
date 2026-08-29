import type { CommandContext, EditorCommands } from '../../core/commandTypes'

export function createHelpCommands(
  ctx: CommandContext,
): Pick<EditorCommands, 'openHelp' | 'openKeyboardShortcuts' | 'openAbout'> {
  return {
    openHelp: () => {
      ctx.openHelp()
    },
    openKeyboardShortcuts: () => {
      ctx.openKeyboardShortcuts()
    },
    openAbout: () => {
      ctx.openAbout()
    },
  }
}
