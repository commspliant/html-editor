import type { CommandContext, EditorCommands } from '../../core/commandTypes'

export function createCapabilitiesCommands(ctx: CommandContext): Pick<EditorCommands, 'openCompatibilityCheck'> {
  return {
    openCompatibilityCheck: () => {
      ctx.openCompatibilityCheck()
    },
  }
}
