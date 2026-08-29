import type { MessageKey } from '../../i18n/types'

export type HelpCategoryId =
  | 'getStarted'
  | 'file'
  | 'edit'
  | 'insert'
  | 'format'
  | 'table'
  | 'view'
  | 'keyboard'

export type HelpTopicId =
  | 'getStarted'
  | 'switchModes'
  | 'searchHelp'
  | 'saveDocument'
  | 'openDocument'
  | 'printDocument'
  | 'undoRedo'
  | 'pageProperties'
  | 'deletePage'
  | 'insertTable'
  | 'insertImage'
  | 'insertLink'
  | 'insertBookmark'
  | 'insertMedia'
  | 'pageBreak'
  | 'insertPage'
  | 'insertComment'
  | 'formatFont'
  | 'paragraphStyles'
  | 'textColor'
  | 'alignLists'
  | 'clearFormatting'
  | 'customCss'
  | 'tableRowsColumns'
  | 'mergeCells'
  | 'customizeToolbar'
  | 'zoom'
  | 'darkMode'
  | 'preview'
  | 'fullscreen'
  | 'ruler'
  | 'keyboardShortcuts'

export type HelpArticle = {
  id: HelpTopicId
  category: HelpCategoryId
  titleKey: MessageKey
  bodyKey: MessageKey
  keywordsKey: MessageKey
  related: HelpTopicId[]
}

export const HELP_CATEGORIES: HelpCategoryId[] = [
  'getStarted',
  'file',
  'edit',
  'insert',
  'format',
  'table',
  'view',
  'keyboard',
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getStarted',
    category: 'getStarted',
    titleKey: 'helpTopicGetStartedTitle',
    bodyKey: 'helpTopicGetStartedBody',
    keywordsKey: 'helpTopicGetStartedKeywords',
    related: ['switchModes', 'searchHelp', 'keyboardShortcuts'],
  },
  {
    id: 'switchModes',
    category: 'getStarted',
    titleKey: 'helpTopicSwitchModesTitle',
    bodyKey: 'helpTopicSwitchModesBody',
    keywordsKey: 'helpTopicSwitchModesKeywords',
    related: ['getStarted', 'preview'],
  },
  {
    id: 'searchHelp',
    category: 'getStarted',
    titleKey: 'helpTopicSearchHelpTitle',
    bodyKey: 'helpTopicSearchHelpBody',
    keywordsKey: 'helpTopicSearchHelpKeywords',
    related: ['getStarted', 'keyboardShortcuts'],
  },
  {
    id: 'saveDocument',
    category: 'file',
    titleKey: 'helpTopicSaveDocumentTitle',
    bodyKey: 'helpTopicSaveDocumentBody',
    keywordsKey: 'helpTopicSaveDocumentKeywords',
    related: ['openDocument', 'printDocument'],
  },
  {
    id: 'openDocument',
    category: 'file',
    titleKey: 'helpTopicOpenDocumentTitle',
    bodyKey: 'helpTopicOpenDocumentBody',
    keywordsKey: 'helpTopicOpenDocumentKeywords',
    related: ['saveDocument', 'printDocument'],
  },
  {
    id: 'printDocument',
    category: 'file',
    titleKey: 'helpTopicPrintDocumentTitle',
    bodyKey: 'helpTopicPrintDocumentBody',
    keywordsKey: 'helpTopicPrintDocumentKeywords',
    related: ['saveDocument', 'preview'],
  },
  {
    id: 'undoRedo',
    category: 'edit',
    titleKey: 'helpTopicUndoRedoTitle',
    bodyKey: 'helpTopicUndoRedoBody',
    keywordsKey: 'helpTopicUndoRedoKeywords',
    related: ['keyboardShortcuts', 'clearFormatting'],
  },
  {
    id: 'pageProperties',
    category: 'edit',
    titleKey: 'helpTopicPagePropertiesTitle',
    bodyKey: 'helpTopicPagePropertiesBody',
    keywordsKey: 'helpTopicPagePropertiesKeywords',
    related: ['insertPage', 'deletePage'],
  },
  {
    id: 'deletePage',
    category: 'edit',
    titleKey: 'helpTopicDeletePageTitle',
    bodyKey: 'helpTopicDeletePageBody',
    keywordsKey: 'helpTopicDeletePageKeywords',
    related: ['insertPage', 'pageProperties'],
  },
  {
    id: 'insertTable',
    category: 'insert',
    titleKey: 'helpTopicInsertTableTitle',
    bodyKey: 'helpTopicInsertTableBody',
    keywordsKey: 'helpTopicInsertTableKeywords',
    related: ['tableRowsColumns', 'mergeCells'],
  },
  {
    id: 'insertImage',
    category: 'insert',
    titleKey: 'helpTopicInsertImageTitle',
    bodyKey: 'helpTopicInsertImageBody',
    keywordsKey: 'helpTopicInsertImageKeywords',
    related: ['insertLink', 'pageProperties'],
  },
  {
    id: 'insertLink',
    category: 'insert',
    titleKey: 'helpTopicInsertLinkTitle',
    bodyKey: 'helpTopicInsertLinkBody',
    keywordsKey: 'helpTopicInsertLinkKeywords',
    related: ['insertBookmark', 'insertImage'],
  },
  {
    id: 'insertBookmark',
    category: 'insert',
    titleKey: 'helpTopicInsertBookmarkTitle',
    bodyKey: 'helpTopicInsertBookmarkBody',
    keywordsKey: 'helpTopicInsertBookmarkKeywords',
    related: ['insertLink'],
  },
  {
    id: 'insertMedia',
    category: 'insert',
    titleKey: 'helpTopicInsertMediaTitle',
    bodyKey: 'helpTopicInsertMediaBody',
    keywordsKey: 'helpTopicInsertMediaKeywords',
    related: ['insertImage', 'insertLink'],
  },
  {
    id: 'pageBreak',
    category: 'insert',
    titleKey: 'helpTopicPageBreakTitle',
    bodyKey: 'helpTopicPageBreakBody',
    keywordsKey: 'helpTopicPageBreakKeywords',
    related: ['insertPage', 'printDocument'],
  },
  {
    id: 'insertPage',
    category: 'insert',
    titleKey: 'helpTopicInsertPageTitle',
    bodyKey: 'helpTopicInsertPageBody',
    keywordsKey: 'helpTopicInsertPageKeywords',
    related: ['pageBreak', 'deletePage'],
  },
  {
    id: 'insertComment',
    category: 'insert',
    titleKey: 'helpTopicInsertCommentTitle',
    bodyKey: 'helpTopicInsertCommentBody',
    keywordsKey: 'helpTopicInsertCommentKeywords',
    related: ['preview'],
  },
  {
    id: 'formatFont',
    category: 'format',
    titleKey: 'helpTopicFormatFontTitle',
    bodyKey: 'helpTopicFormatFontBody',
    keywordsKey: 'helpTopicFormatFontKeywords',
    related: ['paragraphStyles', 'textColor', 'keyboardShortcuts'],
  },
  {
    id: 'paragraphStyles',
    category: 'format',
    titleKey: 'helpTopicParagraphStylesTitle',
    bodyKey: 'helpTopicParagraphStylesBody',
    keywordsKey: 'helpTopicParagraphStylesKeywords',
    related: ['formatFont', 'alignLists'],
  },
  {
    id: 'textColor',
    category: 'format',
    titleKey: 'helpTopicTextColorTitle',
    bodyKey: 'helpTopicTextColorBody',
    keywordsKey: 'helpTopicTextColorKeywords',
    related: ['formatFont', 'clearFormatting'],
  },
  {
    id: 'alignLists',
    category: 'format',
    titleKey: 'helpTopicAlignListsTitle',
    bodyKey: 'helpTopicAlignListsBody',
    keywordsKey: 'helpTopicAlignListsKeywords',
    related: ['paragraphStyles', 'formatFont'],
  },
  {
    id: 'clearFormatting',
    category: 'format',
    titleKey: 'helpTopicClearFormattingTitle',
    bodyKey: 'helpTopicClearFormattingBody',
    keywordsKey: 'helpTopicClearFormattingKeywords',
    related: ['formatFont', 'customCss'],
  },
  {
    id: 'customCss',
    category: 'format',
    titleKey: 'helpTopicCustomCssTitle',
    bodyKey: 'helpTopicCustomCssBody',
    keywordsKey: 'helpTopicCustomCssKeywords',
    related: ['formatFont', 'clearFormatting'],
  },
  {
    id: 'tableRowsColumns',
    category: 'table',
    titleKey: 'helpTopicTableRowsColumnsTitle',
    bodyKey: 'helpTopicTableRowsColumnsBody',
    keywordsKey: 'helpTopicTableRowsColumnsKeywords',
    related: ['insertTable', 'mergeCells', 'keyboardShortcuts'],
  },
  {
    id: 'mergeCells',
    category: 'table',
    titleKey: 'helpTopicMergeCellsTitle',
    bodyKey: 'helpTopicMergeCellsBody',
    keywordsKey: 'helpTopicMergeCellsKeywords',
    related: ['insertTable', 'tableRowsColumns'],
  },
  {
    id: 'customizeToolbar',
    category: 'view',
    titleKey: 'helpTopicCustomizeToolbarTitle',
    bodyKey: 'helpTopicCustomizeToolbarBody',
    keywordsKey: 'helpTopicCustomizeToolbarKeywords',
    related: ['zoom', 'fullscreen'],
  },
  {
    id: 'zoom',
    category: 'view',
    titleKey: 'helpTopicZoomTitle',
    bodyKey: 'helpTopicZoomBody',
    keywordsKey: 'helpTopicZoomKeywords',
    related: ['preview', 'fullscreen'],
  },
  {
    id: 'darkMode',
    category: 'view',
    titleKey: 'helpTopicDarkModeTitle',
    bodyKey: 'helpTopicDarkModeBody',
    keywordsKey: 'helpTopicDarkModeKeywords',
    related: ['customizeToolbar'],
  },
  {
    id: 'preview',
    category: 'view',
    titleKey: 'helpTopicPreviewTitle',
    bodyKey: 'helpTopicPreviewBody',
    keywordsKey: 'helpTopicPreviewKeywords',
    related: ['printDocument', 'switchModes'],
  },
  {
    id: 'fullscreen',
    category: 'view',
    titleKey: 'helpTopicFullscreenTitle',
    bodyKey: 'helpTopicFullscreenBody',
    keywordsKey: 'helpTopicFullscreenKeywords',
    related: ['zoom', 'keyboardShortcuts'],
  },
  {
    id: 'ruler',
    category: 'view',
    titleKey: 'helpTopicRulerTitle',
    bodyKey: 'helpTopicRulerBody',
    keywordsKey: 'helpTopicRulerKeywords',
    related: ['pageProperties', 'alignLists'],
  },
  {
    id: 'keyboardShortcuts',
    category: 'keyboard',
    titleKey: 'helpTopicKeyboardShortcutsTitle',
    bodyKey: 'helpTopicKeyboardShortcutsBody',
    keywordsKey: 'helpTopicKeyboardShortcutsKeywords',
    related: ['getStarted', 'undoRedo', 'formatFont'],
  },
]

export const HELP_ARTICLE_BY_ID = Object.fromEntries(
  HELP_ARTICLES.map((article) => [article.id, article]),
) as Record<HelpTopicId, HelpArticle>

export const DEFAULT_HELP_TOPIC: HelpTopicId = 'getStarted'
