export { Editor } from './components/Editor'
export {
  normalizeContract,
  resolveEditorCapabilities,
  validateHtmlAgainstCapabilities,
  validatePagesAgainstCapabilities,
  formatCapabilityViolationMessage,
  formatCapabilityViolationLocation,
  isPageLayoutAllowed,
} from './capabilities'
export type {
  CapabilityValidationResult,
  CapabilityViolation,
  EditorCapabilityProfile,
  NormalizedContract,
  RenderingCapabilities,
} from './capabilities'
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
  PinnedPageBodySelection,
  CustomAudioInsert,
  CustomAudioPicker,
  CustomBackgroundImagePicker,
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
