import type { CommandContext, EditorCommands, EditorQueries } from '../../core/commandTypes'

export function createCommentsCommands(ctx: CommandContext): Pick<EditorCommands, 'addComment' | 'toggleCommentsVisible'> {
  return {
    addComment: () => ctx.addComment(),
    toggleCommentsVisible: () => ctx.toggleCommentsVisible(),
  }
}

export function createCommentsQueries(ctx: CommandContext): Pick<
  EditorQueries,
  'canAddComment' | 'areCommentsVisible' | 'isCommentsEnabled'
> {
  return {
    canAddComment: () => ctx.canAddComment(),
    areCommentsVisible: () => ctx.areCommentsVisible(),
    isCommentsEnabled: () => ctx.isCommentsEnabled(),
  }
}
