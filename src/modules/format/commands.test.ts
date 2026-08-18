import { describe, expect, it, vi } from 'vitest'
import type { CommandContext } from '../../core/commandTypes'
import { emptyPagePropertiesApply } from '../../core/pageProperties'
import { emptyParagraphPropertiesApply } from '../../core/paragraphProperties'
import { createFormatCommands, createFormatQueries } from './commands'

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
    isLink: () => false,
    isImageSelected: () => false,
    isInTable: () => false,
    canMergeCells: () => false,
    canUnmergeCells: () => false,
    hasTextSelection: () => false,
    ...overrides,
  }
}

describe('createFormatCommands', () => {
  it('toggles each font mark', () => {
    const toggleFontMark = vi.fn()
    const commands = createFormatCommands(context({ toggleFontMark }))

    commands.toggleBold()
    commands.toggleItalic()
    commands.toggleUnderline()
    commands.toggleStrikethrough()

    expect(toggleFontMark.mock.calls).toEqual([['bold'], ['italic'], ['underline'], ['strikethrough']])
  })

  it('clears formatting', () => {
    const clearFormatting = vi.fn()
    const commands = createFormatCommands(context({ clearFormatting }))

    commands.clearFormatting()

    expect(clearFormatting).toHaveBeenCalledTimes(1)
  })

  it('sets font size and opens font properties', () => {
    const setFontSize = vi.fn()
    const openFontProperties = vi.fn()
    const commands = createFormatCommands(context({ setFontSize, openFontProperties }))

    commands.setFontSize(14, 'px')
    commands.openFontProperties()
    commands.openFontProperties('general')

    expect(setFontSize).toHaveBeenCalledWith(14, 'px')
    expect(openFontProperties.mock.calls).toEqual([['general'], ['general']])
  })

  it('sets font family', () => {
    const setFontFamily = vi.fn()
    const commands = createFormatCommands(context({ setFontFamily }))

    commands.setFontFamily('Georgia, serif')
    commands.setFontFamily(null)

    expect(setFontFamily.mock.calls).toEqual([['Georgia, serif'], [null]])
  })

  it('opens and applies custom css', () => {
    const openCustomCss = vi.fn()
    const applyCustomCss = vi.fn()
    const commands = createFormatCommands(context({ openCustomCss, applyCustomCss }))

    commands.openCustomCss()
    commands.applyCustomCss('color: red')

    expect(openCustomCss).toHaveBeenCalledTimes(1)
    expect(applyCustomCss).toHaveBeenCalledWith('color: red')
  })

  it('opens and applies paragraph properties', () => {
    const openParagraphProperties = vi.fn()
    const applyParagraphProperties = vi.fn()
    const commands = createFormatCommands(
      context({ openParagraphProperties, applyParagraphProperties }),
    )

    commands.openParagraphProperties()
    commands.openParagraphProperties('spacing')
    commands.applyParagraphProperties(emptyParagraphPropertiesApply())

    expect(openParagraphProperties.mock.calls).toEqual([['general'], ['spacing']])
    expect(applyParagraphProperties).toHaveBeenCalledTimes(1)
  })

  it('opens and applies page properties', () => {
    const openPageProperties = vi.fn()
    const applyPageProperties = vi.fn()
    const commands = createFormatCommands(context({ openPageProperties, applyPageProperties }))

    commands.openPageProperties()
    commands.openPageProperties('paragraph')
    commands.applyPageProperties(emptyPagePropertiesApply())

    expect(openPageProperties.mock.calls).toEqual([['font'], ['paragraph']])
    expect(applyPageProperties).toHaveBeenCalledTimes(1)
  })

  it('sets font and highlight colors', () => {
    const setFontColor = vi.fn()
    const setHighlightColor = vi.fn()
    const commands = createFormatCommands(context({ setFontColor, setHighlightColor }))

    commands.setFontColor('#cc0000')
    commands.setHighlightColor(null)

    expect(setFontColor).toHaveBeenCalledWith('#cc0000')
    expect(setHighlightColor).toHaveBeenCalledWith(null)
  })

  it('sets paragraph style', () => {
    const setParagraphStyle = vi.fn()
    const commands = createFormatCommands(context({ setParagraphStyle }))

    commands.setParagraphStyle('h1')

    expect(setParagraphStyle).toHaveBeenCalledWith('h1')
  })

  it('opens and applies custom paragraph styles', () => {
    const openCustomParagraphStyleDialog = vi.fn()
    const applyCustomParagraphStyle = vi.fn()
    const commands = createFormatCommands(
      context({ openCustomParagraphStyleDialog, applyCustomParagraphStyle }),
    )

    commands.openCustomParagraphStyleDialog()
    commands.openCustomParagraphStyleDialog('quote')
    commands.applyCustomParagraphStyle('quote')

    expect(openCustomParagraphStyleDialog.mock.calls).toEqual([[undefined], ['quote']])
    expect(applyCustomParagraphStyle).toHaveBeenCalledWith('quote')
  })

  it('runs paragraph align, indent, and list commands', () => {
    const setTextAlign = vi.fn()
    const indent = vi.fn()
    const outdent = vi.fn()
    const toggleList = vi.fn()
    const commands = createFormatCommands(context({ setTextAlign, indent, outdent, toggleList }))

    commands.alignLeft()
    commands.alignCenter()
    commands.alignRight()
    commands.alignJustify()
    commands.indent()
    commands.outdent()
    commands.toggleBulletList()
    commands.toggleNumberedList()

    expect(setTextAlign.mock.calls).toEqual([['left'], ['center'], ['right'], ['justify']])
    expect(indent).toHaveBeenCalledTimes(1)
    expect(outdent).toHaveBeenCalledTimes(1)
    expect(toggleList.mock.calls).toEqual([['ul'], ['ol']])
  })
})

describe('createFormatQueries', () => {
  it('reports active font marks', () => {
    const queries = createFormatQueries(
      context({
        isFontMarkActive: (mark) => mark === 'bold' || mark === 'underline',
      }),
    )

    expect(queries.isBold()).toBe(true)
    expect(queries.isItalic()).toBe(false)
    expect(queries.isUnderline()).toBe(true)
    expect(queries.isStrikethrough()).toBe(false)
  })

  it('reports text selection', () => {
    expect(createFormatQueries(context({ hasTextSelection: () => false })).hasTextSelection()).toBe(
      false,
    )
    expect(createFormatQueries(context({ hasTextSelection: () => true })).hasTextSelection()).toBe(
      true,
    )
  })

  it('reports font size queries', () => {
    const queries = createFormatQueries(
      context({
        getFontSize: () => 12,
        getFontSizeUnit: () => 'pt',
        isFontSizeMixed: () => false,
      }),
    )

    expect(queries.getFontSize()).toBe(12)
    expect(queries.getFontSizeUnit()).toBe('pt')
    expect(queries.isFontSizeMixed()).toBe(false)
  })

  it('reports font family queries', () => {
    const queries = createFormatQueries(
      context({
        getFontFamily: () => 'Georgia, serif',
        isFontFamilyMixed: () => false,
        getFontFaces: () => [{ name: 'Georgia', family: 'Georgia, serif' }],
      }),
    )

    expect(queries.getFontFamily()).toBe('Georgia, serif')
    expect(queries.isFontFamilyMixed()).toBe(false)
    expect(queries.getFontFaces()).toHaveLength(1)
  })

  it('reports color queries', () => {
    const queries = createFormatQueries(
      context({
        getFontColor: () => '#cc0000',
        isFontColorMixed: () => false,
        getHighlightColor: () => null,
        isHighlightColorMixed: () => true,
      }),
    )

    expect(queries.getFontColor()).toBe('#cc0000')
    expect(queries.isFontColorMixed()).toBe(false)
    expect(queries.getHighlightColor()).toBeNull()
    expect(queries.isHighlightColorMixed()).toBe(true)
  })

  it('reports paragraph style queries', () => {
    const queries = createFormatQueries(
      context({
        getParagraphStyle: () => 'h2',
        isParagraphStyleMixed: () => false,
      }),
    )

    expect(queries.getParagraphStyle()).toBe('h2')
    expect(queries.isParagraphStyleMixed()).toBe(false)
  })

  it('reports custom paragraph style queries', () => {
    const queries = createFormatQueries(
      context({
        customParagraphStylesEnabled: () => true,
        getCustomParagraphStyles: () => [
          {
            id: 'quote',
            name: 'Quote',
            font: {
              size: 12,
              unit: 'pt',
              marks: { bold: false, italic: true, underline: false, strikethrough: false },
              fontFamily: null,
              fontColor: null,
              highlightColor: null,
            },
          },
        ],
        isCustomParagraphStylesLoading: () => true,
      }),
    )

    expect(queries.customParagraphStylesEnabled()).toBe(true)
    expect(queries.getCustomParagraphStyles()).toHaveLength(1)
    expect(queries.isCustomParagraphStylesLoading()).toBe(true)
  })

  it('reports paragraph align, indent, and list queries', () => {
    const queries = createFormatQueries(
      context({
        getTextAlign: () => 'center',
        isTextAlignMixed: () => false,
        canOutdent: () => true,
        isBulletList: () => true,
        isNumberedList: () => false,
      }),
    )

    expect(queries.isAlignLeft()).toBe(false)
    expect(queries.isAlignCenter()).toBe(true)
    expect(queries.isAlignRight()).toBe(false)
    expect(queries.isAlignJustify()).toBe(false)
    expect(queries.canOutdent()).toBe(true)
    expect(queries.isBulletList()).toBe(true)
    expect(queries.isNumberedList()).toBe(false)
  })
})
