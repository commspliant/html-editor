import { describe, expect, it, vi } from 'vitest'
import type { CommandContext } from '../../core/commandTypes'
import { createViewCommands, createViewQueries } from './commands'

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

describe('createViewCommands', () => {
  it('switches to visual mode', () => {
    const setMode = vi.fn()
    const commands = createViewCommands(context({ getMode: () => 'html', setMode }))

    commands.setVisualMode()

    expect(setMode).toHaveBeenCalledWith('visual')
  })

  it('switches to html mode', () => {
    const setMode = vi.fn()
    const commands = createViewCommands(context({ setMode }))

    commands.setHtmlMode()

    expect(setMode).toHaveBeenCalledWith('html')
  })

  it('toggles fullscreen on and off', () => {
    const setFullscreen = vi.fn()
    const commands = createViewCommands(context({ getFullscreen: () => false, setFullscreen }))

    commands.toggleFullscreen()

    expect(setFullscreen).toHaveBeenCalledWith(true)

    const exit = createViewCommands(context({ getFullscreen: () => true, setFullscreen }))
    exit.toggleFullscreen()

    expect(setFullscreen).toHaveBeenCalledWith(false)
  })

  it('opens the customize toolbar dialog', () => {
    const openCustomizeToolbar = vi.fn()
    const commands = createViewCommands(context({ openCustomizeToolbar }))

    commands.openCustomizeToolbar()

    expect(openCustomizeToolbar).toHaveBeenCalledTimes(1)
  })

  it('opens the document preview dialog', () => {
    const openDocumentPreview = vi.fn()
    const commands = createViewCommands(context({ openDocumentPreview }))

    commands.openDocumentPreview()

    expect(openDocumentPreview).toHaveBeenCalledTimes(1)
  })
})

describe('createViewQueries', () => {
  it('reports the current mode', () => {
    const queries = createViewQueries(context({ getMode: () => 'html' }))

    expect(queries.isVisualMode()).toBe(false)
    expect(queries.isHtmlMode()).toBe(true)
  })

  it('reports fullscreen state', () => {
    expect(createViewQueries(context({ getFullscreen: () => false })).isFullscreen()).toBe(false)
    expect(createViewQueries(context({ getFullscreen: () => true })).isFullscreen()).toBe(true)
  })
})
