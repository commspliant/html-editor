import type { CommandContext, EditorCommands } from '../../core/commandTypes'

export function createContextMenuCommands(
  ctx: CommandContext,
): Pick<EditorCommands, 'cut' | 'copy' | 'deleteSelection'> {
  return {
    cut: () => ctx.cut(),
    copy: () => ctx.copy(),
    deleteSelection: () => {
      ctx.deleteSelection()
    },
  }
}
