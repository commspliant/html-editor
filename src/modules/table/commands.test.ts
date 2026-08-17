import { describe, expect, it, vi } from 'vitest'
import type { CommandContext } from '../../core/commandTypes'
import { defaultTablePropertiesApply } from '../../core/tableProperties'
import { defaultCellPropertiesApply } from '../../core/cellProperties'
import { defaultRowPropertiesApply } from '../../core/rowProperties'
import { createTableCommands, createTableQueries } from './commands'

function context(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    getHtml: () => '',
    setHtml: vi.fn(),
    getMode: () => 'visual',
    setMode: vi.fn(),
    getFullscreen: () => false,
    setFullscreen: vi.fn(),
    openCustomizeToolbar: vi.fn(),
    openDocumentPreview: vi.fn(),
    getSelection: () => ({ text: '', collapsed: true, start: 0, end: 0 }),
    insertText: vi.fn(),
    insertHtml: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: () => false,
    canRedo: () => false,
    toggleFontMark: vi.fn(),
    isFontMarkActive: () => false,
    setFontSize: vi.fn(),
    setFontSizeUnit: vi.fn(),
    getFontSize: () => null,
    getFontSizeUnit: () => 'pt',
    isFontSizeMixed: () => false,
    setFontFamily: vi.fn(),
    getFontFamily: () => null,
    isFontFamilyMixed: () => false,
    getFontFaces: () => [],
    setFontColor: vi.fn(),
    setHighlightColor: vi.fn(),
    getFontColor: () => null,
    isFontColorMixed: () => false,
    getHighlightColor: () => null,
    isHighlightColorMixed: () => false,
    setParagraphStyle: vi.fn(),
    getParagraphStyle: () => null,
    isParagraphStyleMixed: () => false,
    setTextAlign: vi.fn(),
    getTextAlign: () => null,
    isTextAlignMixed: () => false,
    indent: vi.fn(),
    outdent: vi.fn(),
    canOutdent: () => false,
    toggleList: vi.fn(),
    isBulletList: () => false,
    isNumberedList: () => false,
    openFontProperties: vi.fn(),
    applyFontProperties: vi.fn(),
    openParagraphProperties: vi.fn(),
    applyParagraphProperties: vi.fn(),
    openPageProperties: vi.fn(),
    applyPageProperties: vi.fn(),
    openCustomParagraphStyleDialog: vi.fn(),
    applyCustomParagraphStyle: vi.fn(),
    customParagraphStylesEnabled: () => false,
    getCustomParagraphStyles: () => [],
    isCustomParagraphStylesLoading: () => false,
    openLinkDialog: vi.fn(),
    applyLink: vi.fn(),
    openBookmarkDialog: vi.fn(),
    applyBookmark: vi.fn(),
    openImageDialog: vi.fn(),
    applyImage: vi.fn(),
    openImageProperties: vi.fn(),
    applyImageProperties: vi.fn(),
    insertHorizontalRule: vi.fn(),
    openTableDialog: vi.fn(),
    applyTable: vi.fn(),
    openTableProperties: vi.fn(),
    applyTableProperties: vi.fn(),
    openCellProperties: vi.fn(),
    applyCellProperties: vi.fn(),
    openRowProperties: vi.fn(),
    applyRowProperties: vi.fn(),
    insertRowBelow: vi.fn(),
    insertRowBefore: vi.fn(),
    deleteRow: vi.fn(),
    insertColumnAfter: vi.fn(),
    insertColumnBefore: vi.fn(),
    deleteColumn: vi.fn(),
    cut: vi.fn(),
    copy: vi.fn(),
    deleteSelection: vi.fn(),
    clearFormatting: vi.fn(),
    isLink: () => false,
    isImageSelected: () => false,
    isInTable: () => false,
    hasTextSelection: () => false,
    ...overrides,
  }
}

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
})

describe('createTableQueries', () => {
  it('reports whether the caret is in a table', () => {
    expect(createTableQueries(context({ isInTable: () => true })).isInTable()).toBe(true)
    expect(createTableQueries(context()).isInTable()).toBe(false)
  })
})
