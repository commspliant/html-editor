import type { CommandContext, EditorCommands } from '../../core/commandTypes'

export function createContextMenuCommands(
  ctx: CommandContext,
): Pick<EditorCommands, 'cut' | 'copy' | 'deleteSelection'> {
  return {
    cut: async () => {
      await ctx.cut()
    },
    copy: async () => {
      await ctx.copy()
    },
    deleteSelection: () => {
      ctx.deleteSelection()
    },
  }
}
