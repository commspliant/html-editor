export { Editor } from './components/Editor'
export { stripCommentAnchors } from './core/comments/sanitize'
export { sanitizeDocumentHtml, sanitizePageHtml } from './core/sanitizeHtml'
export {
  PAGE_SEPARATOR,
  joinPagesToHtml,
  splitPagesFromHtml,
} from './core/multiPage'
export type { PageAtRuleApply, PageSizePreset } from './core/pageAtRule'
export type { DefaultPageProperties } from './core/commandTypes'
export type {
  AllowedChrome,
  CommentAnchor,
  CommentAuthor,
  CommentMessage,
  CommentThread,
  CustomAction,
  CustomActionApi,
  CustomActionSelection,
  CustomActionShowIn,
  CustomAudioInsert,
  CustomAudioPicker,
  CustomFont,
  CustomImageInsert,
  CustomImagePicker,
  CustomParagraphStyle,
  CustomParagraphStyleFont,
  CustomParagraphStyleParagraph,
  CustomVideoInsert,
  CustomVideoPicker,
  DarkModePersistence,
  EditorBorder,
  EditorMode,
  EditorProps,
  Locale,
  ToolbarCustomization,
  ToolbarCustomizationPersistence,
  ToolbarPosition,
  ToolbarPositionPersistence,
} from './types'
