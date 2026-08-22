import { describe, expect, it, vi } from 'vitest'
import type { CommandContext } from '../../core/commandTypes'
import { createCommentsCommands, createCommentsQueries } from './commands'

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
    canReadAloud: () => false,
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
    getFontSizeUnit: () => 'px',
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
    getAllPagesHtml: () => [],
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
    isLink: () => false,
    isImageSelected: () => false,
    isInTable: () => false,
    canMergeCells: () => false,
    canUnmergeCells: () => false,
    clearFormatting: vi.fn(),
    hasTextSelection: () => false,
    toggleFormatBrush: vi.fn(),
    isFormatBrushActive: () => false,
    addComment: vi.fn(),
    toggleCommentsVisible: vi.fn(),
    areCommentsVisible: () => true,
    canAddComment: () => false,
    isCommentsEnabled: () => true,
    getCommentThreads: () => [],
    setCommentThreads: vi.fn(),
    openCommentThread: vi.fn(),
    isContentLocked: () => false,
    ...overrides,
  }
}

describe('createCommentsCommands', () => {
  it('calls addComment on context', () => {
    const addComment = vi.fn()
    const commands = createCommentsCommands(context({ addComment }))
    commands.addComment()
    expect(addComment).toHaveBeenCalledOnce()
  })

  it('calls toggleCommentsVisible on context', () => {
    const toggleCommentsVisible = vi.fn()
    const commands = createCommentsCommands(context({ toggleCommentsVisible }))
    commands.toggleCommentsVisible()
    expect(toggleCommentsVisible).toHaveBeenCalledOnce()
  })
})

describe('createCommentsQueries', () => {
  it('reads comment query state from context', () => {
    const queries = createCommentsQueries(
      context({
        canAddComment: () => true,
        areCommentsVisible: () => false,
        isCommentsEnabled: () => true,
      }),
    )
    expect(queries.canAddComment()).toBe(true)
    expect(queries.areCommentsVisible()).toBe(false)
    expect(queries.isCommentsEnabled()).toBe(true)
  })
})
