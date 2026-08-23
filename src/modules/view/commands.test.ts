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
    getDarkMode: () => false,
    setDarkMode: vi.fn(),
    getPageZoom: () => 'fitWidth' as const,
    setPageZoom: vi.fn(),
    getToolbarPosition: () => 'top',
    setToolbarPosition: vi.fn(),
    openCustomizeToolbar: vi.fn(),
    openDocumentPreview: vi.fn(),
    toggleReadAloud: vi.fn(),
    isReadingAloud: () => false,
    canReadAloud: () => true,
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
    openCustomCss: vi.fn(),
    applyCustomCss: vi.fn(),
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
    openAudioDialog: vi.fn(),
    applyAudio: vi.fn(),
    openYoutubeDialog: vi.fn(),
    applyYoutube: vi.fn(),
    openImageProperties: vi.fn(),
    applyImageProperties: vi.fn(),
    insertHorizontalRule: vi.fn(),
    insertPageBreak: vi.fn(),
    insertPageBefore: vi.fn(),
    insertPageAfter: vi.fn(),
    deletePage: vi.fn(),
    isMultiPagesEnabled: () => false,
    hasSelectedPage: () => false,
    canDeletePage: () => false,
    getActivePageHtml: () => '',
    getAllPagesHtml: () => [''],
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
    mergeCells: vi.fn(),
    unmergeCells: vi.fn(),
    cut: vi.fn(),
    copy: vi.fn(),
    deleteSelection: vi.fn(),
    clearFormatting: vi.fn(),
    toggleFormatBrush: vi.fn(),
    isLink: () => false,
    isImageSelected: () => false,
    isInTable: () => false,
    canMergeCells: () => false,
    canUnmergeCells: () => false,
    hasTextSelection: () => false,
    toggleFormatBrush: vi.fn(),
    isFormatBrushActive: () => false,
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

  it('toggles read aloud', () => {
    const toggleReadAloud = vi.fn()
    const commands = createViewCommands(context({ toggleReadAloud }))

    commands.toggleReadAloud()

    expect(toggleReadAloud).toHaveBeenCalledTimes(1)
  })

  it('sets light and dark chrome modes', () => {
    const setDarkMode = vi.fn()
    const commands = createViewCommands(context({ setDarkMode }))

    commands.setDarkMode()
    expect(setDarkMode).toHaveBeenCalledWith(true)

    commands.setLightMode()
    expect(setDarkMode).toHaveBeenCalledWith(false)
  })

  it('sets toolbar dock position', () => {
    const setToolbarPosition = vi.fn()
    const commands = createViewCommands(context({ setToolbarPosition }))

    commands.setToolbarPositionTop()
    expect(setToolbarPosition).toHaveBeenCalledWith('top')
    commands.setToolbarPositionLeft()
    expect(setToolbarPosition).toHaveBeenCalledWith('left')
    commands.setToolbarPositionRight()
    expect(setToolbarPosition).toHaveBeenCalledWith('right')
    commands.setToolbarPositionBottom()
    expect(setToolbarPosition).toHaveBeenCalledWith('bottom')
  })

  it('sets page zoom presets', () => {
    const setPageZoom = vi.fn()
    const commands = createViewCommands(context({ setPageZoom }))

    commands.setPageZoomFitWidth()
    expect(setPageZoom).toHaveBeenCalledWith('fitWidth')
    commands.setPageZoom100()
    expect(setPageZoom).toHaveBeenCalledWith(100)
    commands.setPageZoom200()
    expect(setPageZoom).toHaveBeenCalledWith(200)
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

  it('reports chrome theme', () => {
    expect(createViewQueries(context({ getDarkMode: () => false })).isLightMode()).toBe(true)
    expect(createViewQueries(context({ getDarkMode: () => false })).isDarkMode()).toBe(false)
    expect(createViewQueries(context({ getDarkMode: () => true })).isLightMode()).toBe(false)
    expect(createViewQueries(context({ getDarkMode: () => true })).isDarkMode()).toBe(true)
  })

  it('reports toolbar dock position', () => {
    expect(createViewQueries(context({ getToolbarPosition: () => 'top' })).isToolbarPositionTop()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'left' })).isToolbarPositionLeft()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'right' })).isToolbarPositionRight()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'bottom' })).isToolbarPositionBottom()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'left' })).isToolbarPositionTop()).toBe(false)
  })

  it('reports read aloud state', () => {
    expect(createViewQueries(context({ isReadingAloud: () => false })).isReadingAloud()).toBe(false)
    expect(createViewQueries(context({ isReadingAloud: () => true })).isReadingAloud()).toBe(true)
    expect(createViewQueries(context({ canReadAloud: () => true })).canReadAloud()).toBe(true)
    expect(createViewQueries(context({ canReadAloud: () => false })).canReadAloud()).toBe(false)
  })

  it('reports page zoom preset', () => {
    expect(createViewQueries(context({ getPageZoom: () => 'fitWidth' })).isPageZoomFitWidth()).toBe(true)
    expect(createViewQueries(context({ getPageZoom: () => 100 })).isPageZoom100()).toBe(true)
    expect(createViewQueries(context({ getPageZoom: () => 'fitPage' })).isPageZoomFitWidth()).toBe(false)
  })
})
