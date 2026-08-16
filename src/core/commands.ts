import { createContextMenuCommands } from '../modules/contextMenu'
import { createFileCommands } from '../modules/file/commands'
import { createFormatCommands, createFormatQueries } from '../modules/format/commands'
import { createHistoryCommands, createHistoryQueries } from '../modules/history/commands'
import { createInsertCommands, createInsertQueries } from '../modules/insert/commands'
import { createTableCommands, createTableQueries } from '../modules/table/commands'
import { createViewCommands, createViewQueries } from '../modules/view/commands'
import type { CommandContext, EditorCommands, EditorQueries } from './commandTypes'

export type { CommandContext, CommandName, EditorCommands, EditorQueries } from './commandTypes'

export function createEditorCommands(ctx: CommandContext): EditorCommands {
  return {
    ...createFileCommands(ctx),
    ...createHistoryCommands(ctx),
    ...createContextMenuCommands(ctx),
    ...createInsertCommands(ctx),
    ...createTableCommands(ctx),
    ...createViewCommands(ctx),
    ...createFormatCommands(ctx),
  }
}

export function createEditorQueries(ctx: CommandContext): EditorQueries {
  return {
    ...createViewQueries(ctx),
    ...createHistoryQueries(ctx),
    ...createInsertQueries(ctx),
    ...createTableQueries(ctx),
    ...createFormatQueries(ctx),
  }
}
