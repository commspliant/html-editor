import { describe, expect, it, vi } from 'vitest'
import { defaultLinkAttrs } from '../../core/link'
import { defaultImagePropertiesApply } from '../../core/imageProperties'
import type { CommandContext } from '../../core/commandTypes'
import { createInsertCommands, createInsertQueries } from './commands'

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
    insertPage: vi.fn(),
    isMultiPagesEnabled: () => false,
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

describe('createInsertCommands', () => {
  it('opens and applies the link dialog', () => {
    const openLinkDialog = vi.fn()
    const applyLink = vi.fn()
    const commands = createInsertCommands(context({ openLinkDialog, applyLink }))

    commands.openLinkDialog()
    commands.openLinkDialog('bookmark')
    commands.applyLink(defaultLinkAttrs({ href: 'https://example.com', targetBlank: true }))

    expect(openLinkDialog.mock.calls).toEqual([[undefined], ['bookmark']])
    expect(applyLink).toHaveBeenCalledWith(
      defaultLinkAttrs({
        href: 'https://example.com',
        targetBlank: true,
      }),
    )
  })

  it('opens and applies the bookmark dialog', () => {
    const openBookmarkDialog = vi.fn()
    const applyBookmark = vi.fn()
    const commands = createInsertCommands(context({ openBookmarkDialog, applyBookmark }))

    commands.openBookmarkDialog()
    commands.applyBookmark('intro')

    expect(openBookmarkDialog).toHaveBeenCalledTimes(1)
    expect(applyBookmark).toHaveBeenCalledWith('intro')
  })

  it('opens and applies the image dialog', () => {
    const openImageDialog = vi.fn()
    const applyImage = vi.fn()
    const commands = createInsertCommands(context({ openImageDialog, applyImage }))

    commands.openImageDialog()
    commands.applyImage({ src: 'https://example.com/a.png', alt: 'Chart', title: 'Q1' })

    expect(openImageDialog).toHaveBeenCalledTimes(1)
    expect(applyImage).toHaveBeenCalledWith({
      src: 'https://example.com/a.png',
      alt: 'Chart',
      title: 'Q1',
    })
  })

  it('opens and applies the audio dialog', () => {
    const openAudioDialog = vi.fn()
    const applyAudio = vi.fn()
    const commands = createInsertCommands(context({ openAudioDialog, applyAudio }))

    commands.openAudioDialog()
    commands.applyAudio({ src: 'https://example.com/track.mp3', title: 'Intro' })

    expect(openAudioDialog).toHaveBeenCalledTimes(1)
    expect(applyAudio).toHaveBeenCalledWith({
      src: 'https://example.com/track.mp3',
      title: 'Intro',
    })
  })

  it('opens and applies the youtube dialog', () => {
    const openYoutubeDialog = vi.fn()
    const applyYoutube = vi.fn()
    const commands = createInsertCommands(context({ openYoutubeDialog, applyYoutube }))

    commands.openYoutubeDialog()
    commands.applyYoutube({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo',
    })

    expect(openYoutubeDialog).toHaveBeenCalledTimes(1)
    expect(applyYoutube).toHaveBeenCalledWith({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo',
    })
  })

  it('opens image properties', () => {
    const openImageProperties = vi.fn()
    const commands = createInsertCommands(context({ openImageProperties }))

    commands.openImageProperties()
    commands.openImageProperties('advanced')

    expect(openImageProperties.mock.calls).toEqual([[undefined], ['advanced']])
  })

  it('applies image properties', () => {
    const applyImageProperties = vi.fn()
    const commands = createInsertCommands(context({ applyImageProperties }))
    const draft = defaultImagePropertiesApply({
      sizeMode: 'width',
      width: { value: 50, unit: '%' },
    })

    commands.applyImageProperties(draft)

    expect(applyImageProperties).toHaveBeenCalledWith(draft)
  })

  it('inserts a horizontal rule', () => {
    const insertHorizontalRule = vi.fn()
    const commands = createInsertCommands(context({ insertHorizontalRule }))

    commands.insertHorizontalRule()

    expect(insertHorizontalRule).toHaveBeenCalledTimes(1)
  })
})

describe('createInsertQueries', () => {
  it('reports whether the selection is in a link', () => {
    expect(createInsertQueries(context({ isLink: () => true })).isLink()).toBe(true)
    expect(createInsertQueries(context()).isLink()).toBe(false)
  })

  it('reports whether an image is selected', () => {
    expect(createInsertQueries(context({ isImageSelected: () => true })).isImageSelected()).toBe(true)
    expect(createInsertQueries(context()).isImageSelected()).toBe(false)
  })
})
