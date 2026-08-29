import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { defaultTablePropertiesApply } from '../../core/tableProperties'
import { defaultCellPropertiesApply } from '../../core/cellProperties'
import { defaultRowPropertiesApply } from '../../core/rowProperties'
import { createTableCommands, createTableQueries } from './commands'

describe('createTableCommands', () => {
  it('opens and applies the insert table dialog', () => {
    const openTableDialog = vi.fn()
    const applyTable = vi.fn()
    const commands = createTableCommands(context({ openTableDialog, applyTable }))

    commands.openTableDialog()
    commands.applyTable({ rows: 2, cols: 3 })

    expect(openTableDialog).toHaveBeenCalledTimes(1)
    expect(applyTable).toHaveBeenCalledWith({ rows: 2, cols: 3 })
  })

  it('opens and applies table, cell, and row properties', () => {
    const openTableProperties = vi.fn()
    const applyTableProperties = vi.fn()
    const openCellProperties = vi.fn()
    const applyCellProperties = vi.fn()
    const openRowProperties = vi.fn()
    const applyRowProperties = vi.fn()
    const commands = createTableCommands(
      context({
        openTableProperties,
        applyTableProperties,
        openCellProperties,
        applyCellProperties,
        openRowProperties,
        applyRowProperties,
      }),
    )
    const tableDraft = defaultTablePropertiesApply()
    const cellDraft = defaultCellPropertiesApply()
    const rowDraft = defaultRowPropertiesApply()

    commands.openTableProperties()
    commands.applyTableProperties(tableDraft)
    commands.openCellProperties()
    commands.applyCellProperties(cellDraft)
    commands.openRowProperties()
    commands.applyRowProperties(rowDraft)

    expect(openTableProperties).toHaveBeenCalledTimes(1)
    expect(applyTableProperties).toHaveBeenCalledWith(tableDraft)
    expect(openCellProperties).toHaveBeenCalledTimes(1)
    expect(applyCellProperties).toHaveBeenCalledWith(cellDraft)
    expect(openRowProperties).toHaveBeenCalledTimes(1)
    expect(applyRowProperties).toHaveBeenCalledWith(rowDraft)
  })

  it('forwards row and column structure commands', () => {
    const insertRowBelow = vi.fn()
    const insertRowBefore = vi.fn()
    const deleteRow = vi.fn()
    const insertColumnAfter = vi.fn()
    const insertColumnBefore = vi.fn()
    const deleteColumn = vi.fn()
    const commands = createTableCommands(
      context({
        insertRowBelow,
        insertRowBefore,
        deleteRow,
        insertColumnAfter,
        insertColumnBefore,
        deleteColumn,
      }),
    )

    commands.insertRowBelow()
    commands.insertRowBefore()
    commands.deleteRow()
    commands.insertColumnAfter()
    commands.insertColumnBefore()
    commands.deleteColumn()

    expect(insertRowBelow).toHaveBeenCalledTimes(1)
    expect(insertRowBefore).toHaveBeenCalledTimes(1)
    expect(deleteRow).toHaveBeenCalledTimes(1)
    expect(insertColumnAfter).toHaveBeenCalledTimes(1)
    expect(insertColumnBefore).toHaveBeenCalledTimes(1)
    expect(deleteColumn).toHaveBeenCalledTimes(1)
  })

  it('forwards merge and unmerge commands', () => {
    const mergeCells = vi.fn()
    const unmergeCells = vi.fn()
    const commands = createTableCommands(context({ mergeCells, unmergeCells }))

    commands.mergeCells()
    commands.unmergeCells()

    expect(mergeCells).toHaveBeenCalledTimes(1)
    expect(unmergeCells).toHaveBeenCalledTimes(1)
  })
})

describe('createTableQueries', () => {
  it('reports whether the caret is in a table', () => {
    expect(createTableQueries(context({ isInTable: () => true })).isInTable()).toBe(true)
    expect(createTableQueries(context()).isInTable()).toBe(false)
  })

  it('reports whether cells can be merged or unmerged', () => {
    expect(createTableQueries(context({ canMergeCells: () => true })).canMergeCells()).toBe(true)
    expect(createTableQueries(context()).canMergeCells()).toBe(false)
    expect(createTableQueries(context({ canUnmergeCells: () => true })).canUnmergeCells()).toBe(true)
    expect(createTableQueries(context()).canUnmergeCells()).toBe(false)
  })
})
