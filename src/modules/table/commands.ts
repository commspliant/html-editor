import type { CommandContext, EditorCommands, EditorQueries } from '../../core/commandTypes'

export function createTableCommands(
  ctx: CommandContext,
): Pick<
  EditorCommands,
  | 'openTableDialog'
  | 'applyTable'
  | 'openTableProperties'
  | 'applyTableProperties'
  | 'openCellProperties'
  | 'applyCellProperties'
  | 'openRowProperties'
  | 'applyRowProperties'
  | 'insertRowBelow'
  | 'insertRowBefore'
  | 'deleteRow'
  | 'insertColumnAfter'
  | 'insertColumnBefore'
  | 'deleteColumn'
  | 'mergeCells'
  | 'unmergeCells'
> {
  return {
    openTableDialog: () => {
      ctx.openTableDialog()
    },
    applyTable: (draft) => {
      ctx.applyTable(draft)
    },
    openTableProperties: () => {
      ctx.openTableProperties()
    },
    applyTableProperties: (draft) => {
      ctx.applyTableProperties(draft)
    },
    openCellProperties: () => {
      ctx.openCellProperties()
    },
    applyCellProperties: (draft) => {
      ctx.applyCellProperties(draft)
    },
    openRowProperties: () => {
      ctx.openRowProperties()
    },
    applyRowProperties: (draft) => {
      ctx.applyRowProperties(draft)
    },
    insertRowBelow: () => {
      ctx.insertRowBelow()
    },
    insertRowBefore: () => {
      ctx.insertRowBefore()
    },
    deleteRow: () => {
      ctx.deleteRow()
    },
    insertColumnAfter: () => {
      ctx.insertColumnAfter()
    },
    insertColumnBefore: () => {
      ctx.insertColumnBefore()
    },
    deleteColumn: () => {
      ctx.deleteColumn()
    },
    mergeCells: () => {
      ctx.mergeCells()
    },
    unmergeCells: () => {
      ctx.unmergeCells()
    },
  }
}

export function createTableQueries(
  ctx: CommandContext,
): Pick<EditorQueries, 'isInTable' | 'canMergeCells' | 'canUnmergeCells'> {
  return {
    isInTable: () => ctx.isInTable(),
    canMergeCells: () => ctx.canMergeCells(),
    canUnmergeCells: () => ctx.canUnmergeCells(),
  }
}
