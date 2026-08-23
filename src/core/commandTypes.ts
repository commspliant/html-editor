import type { CustomActionSelection, CustomParagraphStyle, CommentThread, EditorMode, PageZoomPreset, ToolbarPosition } from '../types'
import type { LinkAttrs } from './link'
import type { ImageAttrs } from './image'
import type { AudioAttrs } from './audio'
import type { YoutubeAttrs, VideoAttrs } from './youtube'
import type { ImagePropertiesApply } from './imageProperties'
import type { TableApply } from './table'
import type { TablePropertiesApply } from './tableProperties'
import type { CellPropertiesApply } from './cellProperties'
import type { RowPropertiesApply } from './rowProperties'
import type { FontFace, FontFamilyQuery } from './fontFamily'
import type { ParagraphStyleTag } from './blockFormat'
import type { FontSizeQuery, FontSizeUnit } from './fontSize'
import type { InlineColorQuery } from './inlineColor'
import type { ListType } from './lists'
import type { FontMark, FontMarkState } from './marks'
import type { ParagraphPropertiesApply } from './paragraphProperties'
import type { BoxSides, ParagraphBoxApply } from './paragraphBox'
import type { TextAlign } from './textAlign'
import type { PageBackgroundImageApply } from './pageBackgroundImage'
import type { PageAtRuleApply } from './pageAtRule'

export type FontDialogTab = 'general'

export type ParagraphDialogTab = 'general' | 'spacing' | 'border' | 'background' | 'backgroundImage'

export type PageDialogTab = 'font' | 'paragraph' | 'print'

export type LinkDialogTab = 'link' | 'bookmark'

export type ImageDialogTab = 'general' | 'alignment' | 'border' | 'advanced' | 'hover'

export type LinkApply = LinkAttrs

export type ImageApply = ImageAttrs

export type AudioApply = AudioAttrs

export type YoutubeApply = YoutubeAttrs

export type VideoApply = VideoAttrs

export type FontPropertiesApply = {
  size: number | null
  unit: FontSizeUnit
  marks: FontMarkState
  fontFamily: string | null
  fontFamilyMixed: boolean
  fontColor: string | null
  highlightColor: string | null
  fontColorMixed: boolean
  highlightColorMixed: boolean
}

export type PagePropertiesApply = {
  font: FontPropertiesApply
  box: ParagraphBoxApply
  backgroundImage: PageBackgroundImageApply
  atRule: PageAtRuleApply
}

/** Deep-partial page settings for `defaultPageProperties`. All fields optional. */
export type DefaultPageProperties = {
  font?: Partial<FontPropertiesApply> & { marks?: Partial<FontMarkState> }
  box?: Partial<ParagraphBoxApply> & {
    margin?: Partial<BoxSides>
    padding?: Partial<BoxSides>
  }
  backgroundImage?: Partial<PageBackgroundImageApply>
  atRule?: Partial<PageAtRuleApply> & { margin?: Partial<BoxSides> }
}

export type CommandName =
  | 'save'
  | 'open'
  | 'print'
  | 'undo'
  | 'redo'
  | 'setVisualMode'
  | 'setHtmlMode'
  | 'toggleFullscreen'
  | 'openCustomizeToolbar'
  | 'openDocumentPreview'
  | 'toggleReadAloud'
  | 'setLightMode'
  | 'setDarkMode'
  | 'setPageZoomFitWidth'
  | 'setPageZoomFitPage'
  | 'setPageZoom50'
  | 'setPageZoom75'
  | 'setPageZoom100'
  | 'setPageZoom125'
  | 'setPageZoom150'
  | 'setPageZoom200'
  | 'setToolbarPositionTop'
  | 'setToolbarPositionLeft'
  | 'setToolbarPositionRight'
  | 'setToolbarPositionBottom'
  | 'toggleBold'
  | 'toggleItalic'
  | 'toggleUnderline'
  | 'toggleStrikethrough'
  | 'clearFormatting'
  | 'toggleFormatBrush'
  | 'openFontProperties'
  | 'openCustomCss'
  | 'applyCustomCss'
  | 'openParagraphProperties'
  | 'openPageProperties'
  | 'openCustomParagraphStyleDialog'
  | 'openLinkDialog'
  | 'openBookmarkDialog'
  | 'openImageDialog'
  | 'openAudioDialog'
  | 'openYoutubeDialog'
  | 'openImageProperties'
  | 'insertHorizontalRule'
  | 'insertPageBreak'
  | 'insertPageBefore'
  | 'insertPageAfter'
  | 'openTableDialog'
  | 'openTableProperties'
  | 'openCellProperties'
  | 'openRowProperties'
  | 'insertRowBelow'
  | 'insertRowBefore'
  | 'deleteRow'
  | 'insertColumnAfter'
  | 'insertColumnBefore'
  | 'deleteColumn'
  | 'mergeCells'
  | 'unmergeCells'
  | 'cut'
  | 'copy'
  | 'deleteSelection'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'indent'
  | 'outdent'
  | 'toggleBulletList'
  | 'toggleNumberedList'
  | 'addComment'
  | 'toggleCommentsVisible'
  | (string & {})

export type QueryName =
  | 'isVisualMode'
  | 'isHtmlMode'
  | 'isFullscreen'
  | 'isLightMode'
  | 'isDarkMode'
  | 'isPageZoomFitWidth'
  | 'isPageZoomFitPage'
  | 'isPageZoom50'
  | 'isPageZoom75'
  | 'isPageZoom100'
  | 'isPageZoom125'
  | 'isPageZoom150'
  | 'isPageZoom200'
  | 'isToolbarPositionTop'
  | 'isToolbarPositionLeft'
  | 'isToolbarPositionRight'
  | 'isToolbarPositionBottom'
  | 'canUndo'
  | 'canRedo'
  | 'isBold'
  | 'isItalic'
  | 'isUnderline'
  | 'isStrikethrough'
  | 'isAlignLeft'
  | 'isAlignCenter'
  | 'isAlignRight'
  | 'isAlignJustify'
  | 'canOutdent'
  | 'isBulletList'
  | 'isNumberedList'
  | 'isLink'
  | 'isImageSelected'
  | 'isInTable'
  | 'canMergeCells'
  | 'canUnmergeCells'
  | 'hasTextSelection'
  | 'isReadingAloud'
  | 'canReadAloud'
  | 'isFormatBrushActive'
  | 'isMultiPagesEnabled'
  | 'hasSelectedPage'
  | 'canAddComment'
  | 'areCommentsVisible'
  | 'isCommentsEnabled'

export type CommandContext = {
  getHtml: () => string
  setHtml: (html: string) => void
  getMode: () => EditorMode
  setMode: (mode: EditorMode) => void
  getFullscreen: () => boolean
  setFullscreen: (fullscreen: boolean) => void
  getDarkMode: () => boolean
  setDarkMode: (dark: boolean) => void
  getPageZoom: () => PageZoomPreset
  setPageZoom: (zoom: PageZoomPreset) => void
  getToolbarPosition: () => ToolbarPosition
  setToolbarPosition: (position: ToolbarPosition) => void
  openCustomizeToolbar: () => void
  openDocumentPreview: () => void
  toggleReadAloud: () => void
  isReadingAloud: () => boolean
  canReadAloud: () => boolean
  getSelection: () => CustomActionSelection
  insertText: (text: string) => void
  insertHtml: (html: string, formattedText?: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  toggleFontMark: (mark: FontMark) => void
  isFontMarkActive: (mark: FontMark) => boolean
  setFontSize: (size: number, unit?: FontSizeUnit) => void
  setFontSizeUnit: (unit: FontSizeUnit) => void
  getFontSize: () => number | null
  getFontSizeUnit: () => FontSizeUnit
  isFontSizeMixed: () => boolean
  setFontFamily: (family: string | null) => void
  getFontFamily: () => string | null
  isFontFamilyMixed: () => boolean
  getFontFaces: () => FontFace[]
  setFontColor: (color: string | null) => void
  setHighlightColor: (color: string | null) => void
  getFontColor: () => string | null
  isFontColorMixed: () => boolean
  getHighlightColor: () => string | null
  isHighlightColorMixed: () => boolean
  setParagraphStyle: (tag: ParagraphStyleTag) => void
  getParagraphStyle: () => ParagraphStyleTag | null
  isParagraphStyleMixed: () => boolean
  setTextAlign: (align: TextAlign) => void
  getTextAlign: () => TextAlign | null
  isTextAlignMixed: () => boolean
  indent: () => void
  outdent: () => void
  canOutdent: () => boolean
  toggleList: (type: ListType) => void
  isBulletList: () => boolean
  isNumberedList: () => boolean
  openFontProperties: (tab?: FontDialogTab) => void
  applyFontProperties: (draft: FontPropertiesApply) => void
  openCustomCss: () => void
  applyCustomCss: (css: string) => void
  openParagraphProperties: (tab?: ParagraphDialogTab) => void
  applyParagraphProperties: (draft: ParagraphPropertiesApply) => void
  openPageProperties: (tab?: PageDialogTab) => void
  applyPageProperties: (draft: PagePropertiesApply) => void
  openCustomParagraphStyleDialog: (id?: string) => void
  applyCustomParagraphStyle: (id: string) => void
  customParagraphStylesEnabled: () => boolean
  getCustomParagraphStyles: () => CustomParagraphStyle[]
  isCustomParagraphStylesLoading: () => boolean
  openLinkDialog: (tab?: LinkDialogTab) => void
  applyLink: (draft: LinkApply) => void
  openBookmarkDialog: () => void
  applyBookmark: (name: string) => void
  openImageDialog: () => void
  applyImage: (draft: ImageApply) => void
  openAudioDialog: () => void
  applyAudio: (draft: AudioApply) => void
  openYoutubeDialog: () => void
  applyYoutube: (draft: YoutubeApply) => void
  openImageProperties: (tab?: ImageDialogTab) => void
  applyImageProperties: (draft: ImagePropertiesApply) => void
  insertHorizontalRule: () => void
  insertPageBreak: () => void
  insertPageBefore: () => void
  insertPageAfter: () => void
  isMultiPagesEnabled: () => boolean
  hasSelectedPage: () => boolean
  getActivePageHtml: () => string
  getAllPagesHtml: () => string[]
  openTableDialog: () => void
  applyTable: (draft: TableApply) => void
  openTableProperties: () => void
  applyTableProperties: (draft: TablePropertiesApply) => void
  openCellProperties: () => void
  applyCellProperties: (draft: CellPropertiesApply) => void
  openRowProperties: () => void
  applyRowProperties: (draft: RowPropertiesApply) => void
  insertRowBelow: () => void
  insertRowBefore: () => void
  deleteRow: () => void
  insertColumnAfter: () => void
  insertColumnBefore: () => void
  deleteColumn: () => void
  mergeCells: () => void
  unmergeCells: () => void
  cut: () => void | Promise<void>
  copy: () => void | Promise<void>
  deleteSelection: () => void
  isLink: () => boolean
  isImageSelected: () => boolean
  isInTable: () => boolean
  canMergeCells: () => boolean
  canUnmergeCells: () => boolean
  clearFormatting: () => void
  hasTextSelection: () => boolean
  toggleFormatBrush: () => void
  isFormatBrushActive: () => boolean
  onSave?: (html: string | string[]) => void | Promise<void>
  onOpen?: () => string | string[] | null | Promise<string | null>
  addComment: () => void
  toggleCommentsVisible: () => void
  areCommentsVisible: () => boolean
  canAddComment: () => boolean
  isCommentsEnabled: () => boolean
  getCommentThreads: () => CommentThread[]
  setCommentThreads: (threads: CommentThread[]) => void
  openCommentThread: (id: string) => void
  isContentLocked: () => boolean
}

export type EditorCommand = () => void | Promise<void>

export type EditorCommands = {
  save: () => Promise<void>
  open: () => Promise<void>
  print: () => void
  undo: () => void
  redo: () => void
  setVisualMode: () => void
  setHtmlMode: () => void
  toggleFullscreen: () => void
  openCustomizeToolbar: () => void
  openDocumentPreview: () => void
  toggleReadAloud: () => void
  setLightMode: () => void
  setDarkMode: () => void
  setPageZoomFitWidth: () => void
  setPageZoomFitPage: () => void
  setPageZoom50: () => void
  setPageZoom75: () => void
  setPageZoom100: () => void
  setPageZoom125: () => void
  setPageZoom150: () => void
  setPageZoom200: () => void
  setToolbarPositionTop: () => void
  setToolbarPositionLeft: () => void
  setToolbarPositionRight: () => void
  setToolbarPositionBottom: () => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleStrikethrough: () => void
  setFontSize: (size: number, unit?: FontSizeUnit) => void
  setFontSizeUnit: (unit: FontSizeUnit) => void
  setFontFamily: (family: string | null) => void
  setFontColor: (color: string | null) => void
  setHighlightColor: (color: string | null) => void
  setParagraphStyle: (tag: ParagraphStyleTag) => void
  alignLeft: () => void
  alignCenter: () => void
  alignRight: () => void
  alignJustify: () => void
  indent: () => void
  outdent: () => void
  toggleBulletList: () => void
  toggleNumberedList: () => void
  openFontProperties: (tab?: FontDialogTab) => void
  applyFontProperties: (draft: FontPropertiesApply) => void
  openParagraphProperties: (tab?: ParagraphDialogTab) => void
  applyParagraphProperties: (draft: ParagraphPropertiesApply) => void
  openPageProperties: (tab?: PageDialogTab) => void
  applyPageProperties: (draft: PagePropertiesApply) => void
  openCustomParagraphStyleDialog: (id?: string) => void
  applyCustomParagraphStyle: (id: string) => void
  openLinkDialog: (tab?: LinkDialogTab) => void
  applyLink: (draft: LinkApply) => void
  openBookmarkDialog: () => void
  applyBookmark: (name: string) => void
  openImageDialog: () => void
  applyImage: (draft: ImageApply) => void
  openAudioDialog: () => void
  applyAudio: (draft: AudioApply) => void
  openYoutubeDialog: () => void
  applyYoutube: (draft: YoutubeApply) => void
  openImageProperties: (tab?: ImageDialogTab) => void
  applyImageProperties: (draft: ImagePropertiesApply) => void
  insertHorizontalRule: () => void
  insertPageBreak: () => void
  insertPageBefore: () => void
  insertPageAfter: () => void
  openTableDialog: () => void
  applyTable: (draft: TableApply) => void
  openTableProperties: () => void
  applyTableProperties: (draft: TablePropertiesApply) => void
  openCellProperties: () => void
  applyCellProperties: (draft: CellPropertiesApply) => void
  openRowProperties: () => void
  applyRowProperties: (draft: RowPropertiesApply) => void
  insertRowBelow: () => void
  insertRowBefore: () => void
  deleteRow: () => void
  insertColumnAfter: () => void
  insertColumnBefore: () => void
  deleteColumn: () => void
  mergeCells: () => void
  unmergeCells: () => void
  cut: () => Promise<void>
  copy: () => Promise<void>
  deleteSelection: () => void
  clearFormatting: () => void
  toggleFormatBrush: () => void
  addComment: () => void
  toggleCommentsVisible: () => void
}

export function runEditorCommand(commands: EditorCommands, name: string): void {
  const fn = (commands as unknown as Record<string, EditorCommand | undefined>)[name]
  void fn?.()
}

export type EditorQueries = {
  isVisualMode: () => boolean
  isHtmlMode: () => boolean
  isFullscreen: () => boolean
  isLightMode: () => boolean
  isDarkMode: () => boolean
  isPageZoomFitWidth: () => boolean
  isPageZoomFitPage: () => boolean
  isPageZoom50: () => boolean
  isPageZoom75: () => boolean
  isPageZoom100: () => boolean
  isPageZoom125: () => boolean
  isPageZoom150: () => boolean
  isPageZoom200: () => boolean
  isToolbarPositionTop: () => boolean
  isToolbarPositionLeft: () => boolean
  isToolbarPositionRight: () => boolean
  isToolbarPositionBottom: () => boolean
  canUndo: () => boolean
  canRedo: () => boolean
  isBold: () => boolean
  isItalic: () => boolean
  isUnderline: () => boolean
  isStrikethrough: () => boolean
  getFontSize: () => number | null
  getFontSizeUnit: () => FontSizeUnit
  isFontSizeMixed: () => boolean
  getFontFamily: () => string | null
  isFontFamilyMixed: () => boolean
  getFontFaces: () => FontFace[]
  getFontColor: () => string | null
  isFontColorMixed: () => boolean
  getHighlightColor: () => string | null
  isHighlightColorMixed: () => boolean
  getParagraphStyle: () => ParagraphStyleTag | null
  isParagraphStyleMixed: () => boolean
  isAlignLeft: () => boolean
  isAlignCenter: () => boolean
  isAlignRight: () => boolean
  isAlignJustify: () => boolean
  canOutdent: () => boolean
  isBulletList: () => boolean
  isNumberedList: () => boolean
  customParagraphStylesEnabled: () => boolean
  getCustomParagraphStyles: () => CustomParagraphStyle[]
  isCustomParagraphStylesLoading: () => boolean
  isLink: () => boolean
  isImageSelected: () => boolean
  isInTable: () => boolean
  canMergeCells: () => boolean
  canUnmergeCells: () => boolean
  hasTextSelection: () => boolean
  isReadingAloud: () => boolean
  canReadAloud: () => boolean
  isFormatBrushActive: () => boolean
  isMultiPagesEnabled: () => boolean
  hasSelectedPage: () => boolean
  canAddComment: () => boolean
  areCommentsVisible: () => boolean
  isCommentsEnabled: () => boolean
}

export type { FontFace, FontFamilyQuery, FontSizeQuery, InlineColorQuery, ListType, ParagraphStyleTag, TextAlign, ParagraphPropertiesApply, ParagraphBoxApply, ImagePropertiesApply, TableApply, TablePropertiesApply, CellPropertiesApply, RowPropertiesApply }
export type { PageAtRuleApply } from './pageAtRule'
