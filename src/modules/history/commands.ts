import type { CommandContext, EditorCommands, EditorQueries } from '../../core/commandTypes'

export function createHistoryCommands(
  ctx: CommandContext,
): Pick<EditorCommands, 'undo' | 'redo'> {
  return {
    undo: () => {
      ctx.undo()
    },
    redo: () => {
      ctx.redo()
    },
  }
}

export function createHistoryQueries(
  ctx: CommandContext,
): Pick<EditorQueries, 'canUndo' | 'canRedo'> {
  return {
    canUndo: () => ctx.canUndo(),
    canRedo: () => ctx.canRedo(),
  }
}
