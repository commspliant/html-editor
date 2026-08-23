import type { ComponentType } from 'react'
import type { FontSizeUnit } from './core/fontSizeUnits'
import type { FontFace } from './core/fontFamily'
import type { ListType } from './core/lists'
import type { FontMarkState } from './core/marks'
import type {
  BoxSides,
  BreakBeforeAfterValue,
  BreakInsideValue,
  CssLength,
  LineHeightValue,
  ParagraphBorder,
  ParagraphShadow,
} from './core/paragraphBox'
import type { TextAlign } from './core/textAlign'
import type { Locale } from './i18n/types'
import type { IconProps } from './icons'

export type {
  BoxSides,
  BreakBeforeAfterValue,
  BreakInsideValue,
  CssLength,
  LineHeightValue,
  ParagraphBorder,
  ParagraphShadow,
}

export type CustomFont = FontFace

export type { Locale }

export type EditorMode = 'visual' | 'html'

export type PageZoomPercent = 50 | 75 | 100 | 125 | 150 | 200

export type PageZoomPreset = 'fitWidth' | 'fitPage' | PageZoomPercent

export type CustomActionShowIn = 'menu' | 'toolbar' | 'both'

export type CustomActionSelection = {
  /** Selected plain text, or an empty string when the caret is collapsed */
  text: string
  collapsed: boolean
  /** Visual: offset in `textContent`. HTML: textarea index. */
  start: number
  end: number
}

export type CustomActionApi = {
  mode: EditorMode
  selection: CustomActionSelection
  getHtml: () => string
  /** Replace the entire document */
  setHtml: (html: string) => void
  /**
   * Insert HTML at the caret, or replace the selection.
   * Pass `formattedText` to insert visible text instead of parsing markup.
   */
  insertHtml: (html: string, formattedText?: string) => void
  /** Insert formatted text at the caret, or replace the selection */
  insertText: (text: string) => void
}

export type CustomAction = {
  id: string
  /** Visible name (menu item text; also tooltip and aria fallback) */
  label: string
  /** Toolbar tooltip. Defaults to `label`. */
  tooltip?: string
  /** Optional icon. Defaults to the built-in custom-action icon. */
  icon?: ComponentType<IconProps>
  showIn: CustomActionShowIn
  /**
   * Menu placement. Ignored when `showIn` is `'toolbar'`.
   * Built-in ids: `'file'` | `'edit'` | `'view'`. Other ids create a new top-level menu.
   * Default: `'custom'`.
   */
  menu?: { id?: string; label?: string }
  /**
   * Toolbar group. Ignored when `showIn` is `'menu'`.
   * Built-in ids: `'file'` | `'edit'` | `'view'`. Other ids create a group before Full screen.
   * Default: `'custom'`.
   */
  toolbarGroup?: string
  onAction: (api: CustomActionApi) => void | Promise<void>
}

export type EditorBorder = {
  /** CSS border-width. Default `1px`. */
  width?: string
  /** CSS border-color. Default `#d0d0d0`. */
  color?: string
  /** CSS border-radius. Default `6px`. */
  radius?: string
  /** CSS box-shadow, or `'none'`. Default none. */
  shadow?: string | 'none'
}

export type CustomParagraphStyleFont = {
  size: number | null
  unit: FontSizeUnit
  marks: FontMarkState
  fontFamily: string | null
  fontColor: string | null
  highlightColor: string | null
}

export type CustomParagraphStyleParagraph = {
  align?: TextAlign
  list?: ListType | null
  margin?: BoxSides
  padding?: BoxSides
  lineHeight?: LineHeightValue | null
  border?: ParagraphBorder
  borderRadius?: CssLength | null
  boxShadow?: ParagraphShadow | null
  backgroundColor?: string | null
  opacity?: number | null
  breakInside?: BreakInsideValue
  breakAfter?: BreakBeforeAfterValue
  breakBefore?: BreakBeforeAfterValue
}

export type CustomParagraphStyle = {
  id: string
  name: string
  font: CustomParagraphStyleFont
  paragraph?: CustomParagraphStyleParagraph
}

export type CustomImageInsert = {
  /** http(s), relative path, or raster data URL */
  src: string
  alt?: string
  title?: string
  /** Extra inline CSS on the inserted `<img>` */
  css?: string
}

export type CustomImagePicker = {
  /** Third source / navigation button label (host copy) */
  text: string
  description: string
  buttonCaption: string
  /**
   * Called when the custom source button is clicked, or when
   * `disableBuiltinImageInsert` is set and Insert → Image runs.
   * Call `insertImage` when the host picker finishes.
   */
  onPick: (insertImage: (image: CustomImageInsert) => void) => void
}

export type CustomAudioInsert = {
  /** http(s), relative path, or audio data URL */
  src: string
  title?: string
  /** Extra inline CSS on the inserted `<audio>` */
  css?: string
}

export type CustomAudioPicker = {
  text: string
  description: string
  buttonCaption: string
  /**
   * Called when the custom source button is clicked, or when
   * `disableBuiltinAudioInsert` is set and Insert → Audio runs.
   * Call `insertAudio` when the host picker finishes.
   */
  onPick: (insertAudio: (audio: CustomAudioInsert) => void) => void
}

export type CustomVideoInsert = {
  /** YouTube watch/embed URL, or http(s) video URL */
  src: string
  title?: string
  /** Extra inline CSS on the inserted `<iframe>` or `<video>` */
  css?: string
}

export type CustomVideoPicker = {
  text: string
  description: string
  buttonCaption: string
  /**
   * Called when the custom source button is clicked, or when
   * `disableBuiltinVideoInsert` is set and Insert → YouTube video runs.
   * Call `insertVideo` when the host picker finishes.
   */
  onPick: (insertVideo: (video: CustomVideoInsert) => void) => void
}

export type ToolbarCustomization = {
  /** Icon group ids in display order. Full screen is always pinned last. */
  groupOrder: string[]
  /** Toolbar item ids that should be hidden from the icon toolbar. */
  hiddenItemIds: string[]
}

/**
 * Host allowlist for chrome. The two lists do not cross-filter: hiding a menu
 * does not hide its toolbar buttons, and hiding a toolbar button does not hide
 * the matching menu item. Omit the prop, or either field, to leave that surface
 * unfiltered.
 */
export type AllowedChrome = {
  /** Top-level menu ids (`file`, `edit`, `insert`, `table`, `view`, `format`, plus custom). Omit to show every menu. */
  menus?: string[]
  /** Icon-toolbar item ids. Omit to show every toolbar button. */
  toolbar?: string[]
}

export type ToolbarCustomizationPersistence = {
  load: () => ToolbarCustomization | null | Promise<ToolbarCustomization | null>
  save: (settings: ToolbarCustomization | null) => void | Promise<void>
}

export type DarkModePersistence = {
  load: () => boolean | null | Promise<boolean | null>
  save: (darkMode: boolean) => void | Promise<void>
}

export type ToolbarPosition = 'top' | 'left' | 'right' | 'bottom'

export type ToolbarPositionPersistence = {
  load: () => ToolbarPosition | null | Promise<ToolbarPosition | null>
  save: (position: ToolbarPosition) => void | Promise<void>
}

export type CommentMessage = {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
}

export type TextCommentAnchor = {
  type: 'text'
  text: string
  start?: number
  end?: number
  prefix?: string
  suffix?: string
}

export type ImageCommentAnchor = {
  type: 'image'
  elementId?: string
  src?: string
}

export type CommentAnchor = TextCommentAnchor | ImageCommentAnchor

export type CommentThread = {
  id: string
  anchor: CommentAnchor
  messages: CommentMessage[]
  createdAt: string
  resolvedAt?: string | null
  resolvedBy?: string | null
}

export type CommentAuthor = {
  userId: string
  userName: string
}

export type EditorProps = {
  value?: string
  defaultValue?: string
  onChange?: (html: string) => void
  /**
   * When set, polls every second. If the document HTML changed since the last
   * auto-save, calls this with the current HTML (same as `onChange`, after
   * `transformHtml`). Omit to disable. The callback is not awaited.
   */
  onAutoSave?: (html: string | string[]) => void | Promise<void>
  /**
   * When set, File → Save calls this with the current document HTML (same as
   * `onChange`, after `transformHtml`) instead of the built-in local file picker.
   * When `enableMultiPages` is true, receives all pages as a string array.
   * The callback is awaited. Omit to keep the default save-to-file behavior.
   */
  onSave?: (html: string | string[]) => void | Promise<void>
  /**
   * When set, File → Open calls this instead of the built-in local file picker.
   * Return document HTML to replace the editor, or `null` to cancel. When
   * `enableMultiPages` is true, return all pages as a string array.
   * The callback is awaited. Omit to keep the default open-from-file behavior.
   */
  onOpen?: () => string | string[] | null | Promise<string | null>
  mode?: EditorMode
  defaultMode?: EditorMode
  onModeChange?: (mode: EditorMode) => void
  fullscreen?: boolean
  defaultFullscreen?: boolean
  onFullscreenChange?: (fullscreen: boolean) => void
  placeholder?: string
  disabled?: boolean
  /**
   * When true, neither surface can be edited and menus, toolbar, and dialogs
   * are grayed out. Same lock as `disabled`. Default `false`.
   */
  readOnly?: boolean
  className?: string
  locale?: Locale
  toolbarBackground?: string
  /** CSS color for menu bar text and dropdown items. Default `#444`. */
  menuColor?: string
  /** CSS color for the menu bar row and dropdown panel. Default `#fff`. */
  menuBackground?: string
  /** CSS font-size for menu bar triggers and dropdown items. Default `0.875rem`. */
  menuFontSize?: string
  /**
   * CSS font-family for menus. Default inherits `system-ui, sans-serif`.
   * The host must load any webfont before passing its family name.
   */
  menuFontFamily?: string
  /**
   * Outer border of the editor box. `'none'` removes width, radius, and shadow.
   * Object fields are independent; omitted fields keep library defaults.
   * Ignored while the editor is in fullscreen overlay.
   */
  border?: 'none' | EditorBorder
  menuVisible?: boolean
  toolbarVisible?: boolean
  /**
   * Host allowlist for which menus and icon-toolbar buttons appear.
   * Omit to show everything. The two lists are independent.
   */
  allowedChrome?: AllowedChrome
  customActions?: CustomAction[]
  /**
   * Extra document font faces appended after the built-in web-safe list.
   * Duplicate `family` values are ignored. Optional `css` stylesheet URLs are
   * loaded in the editor and prepended to exported HTML when that face is used.
   */
  customFonts?: CustomFont[]
  /**
   * When true (default), strip `<script>` tags and `javascript:` URLs from document HTML
   * on inbound `value` / `defaultValue` / `pages` and on every outbound write.
   * Set false to disable; use `transformHtml` for custom filtering instead.
   */
  sanitizeHtml?: boolean
  /**
   * Optional map over document HTML before it is stored and passed to `onChange`.
   * Runs after built-in sanitization when `sanitizeHtml` is true (default).
   * Runs on every edit (visual, HTML source, open, file drop, insert, `setHtml`).
   */
  transformHtml?: (html: string) => string
  /**
   * Load host-persisted custom paragraph styles. Called on mount and after save/delete.
   * Custom styles and “Add new” stay hidden unless this and `onSaveCustomParagraphStyle` are both set.
   */
  loadCustomParagraphStyles?: () => CustomParagraphStyle[] | Promise<CustomParagraphStyle[]>
  /** Persist a created or edited custom paragraph style. Name is always trimmed and non-empty. */
  onSaveCustomParagraphStyle?: (style: CustomParagraphStyle) => void | Promise<void>
  /** Persist deletion of a custom paragraph style. The Delete button is shown only when this is set. */
  onDeleteCustomParagraphStyle?: (id: string) => void | Promise<void>
  /**
   * Optional third Insert image source. Omit to keep File and URL only.
   * Host copy (`text`, `description`, `buttonCaption`) is not translated.
   */
  customImagePicker?: CustomImagePicker
  /**
   * Skip the Insert image dialog and call `customImagePicker.onPick` from the
   * toolbar or Insert menu. Has no effect unless `customImagePicker` is set.
   */
  disableBuiltinImageInsert?: boolean
  /**
   * Optional third Insert audio source. Omit to keep File and URL only.
   * Host copy (`text`, `description`, `buttonCaption`) is not translated.
   */
  customAudioPicker?: CustomAudioPicker
  /**
   * Skip the Insert audio dialog and call `customAudioPicker.onPick` from the
   * Insert menu. Has no effect unless `customAudioPicker` is set.
   */
  disableBuiltinAudioInsert?: boolean
  /**
   * Optional third Insert YouTube video source. Omit to keep URL only.
   * Host copy (`text`, `description`, `buttonCaption`) is not translated.
   */
  customVideoPicker?: CustomVideoPicker
  /**
   * Skip the Insert YouTube video dialog and call `customVideoPicker.onPick` from the
   * Insert menu. Has no effect unless `customVideoPicker` is set.
   */
  disableBuiltinVideoInsert?: boolean
  /**
   * When true, dropping an HTML file on the editor does not replace the document.
   * File → Open is unchanged. Default `false` (drop is allowed).
   */
  disableHtmlFileDrop?: boolean
  /**
   * Host-owned toolbar layout persistence. When set (both `load` and `save`),
   * the library does not use localStorage. Omit to persist in the browser.
   */
  toolbarCustomization?: ToolbarCustomizationPersistence
  /**
   * Initial chrome theme when nothing is persisted. Default `false` (light).
   * View → Light mode / Dark mode updates the live theme and persistence.
   */
  darkMode?: boolean
  /**
   * Host-owned dark-mode persistence. When set (both `load` and `save`),
   * the library does not use localStorage. Omit to persist in the browser.
   */
  darkModePersistence?: DarkModePersistence
  /**
   * Initial icon-toolbar dock when nothing is persisted. Default `'top'`.
   * View → Toolbar → Position updates the live layout and persistence.
   */
  toolbarPosition?: ToolbarPosition
  /**
   * Host-owned toolbar-position persistence. When set (both `load` and `save`),
   * the library does not use localStorage. Omit to persist in the browser.
   */
  toolbarPositionPersistence?: ToolbarPositionPersistence
  /**
   * When true, the editor manages multiple independent HTML pages in visual mode.
   * Default `false` (single document, unchanged behavior).
   */
  enableMultiPages?: boolean
  /** Controlled page HTML strings when `enableMultiPages` is true. */
  pages?: string[]
  /** Initial pages when uncontrolled and `enableMultiPages` is true. */
  defaultPages?: string[]
  /** Fires when any page changes while `enableMultiPages` is true. */
  onPagesChange?: (pages: string[], activePageIndex: number) => void
  /**
   * When true, comment chrome and thread state are enabled. Default `false`.
   */
  enableComments?: boolean
  /**
   * Initial comment highlight visibility when `enableComments` is true and
   * visibility is uncontrolled. Default `true` (highlights shown; View shows
   * "Hide comments").
   */
  defaultCommentsVisible?: boolean
  /** Identity used when posting comment messages. Required to enable Post in the panel. */
  commentAuthor?: CommentAuthor
  /** Controlled comment threads (metadata separate from document HTML). */
  comments?: CommentThread[]
  /** Initial comment threads when uncontrolled. Default `[]`. */
  defaultComments?: CommentThread[]
  /** Fires when comment threads change. */
  onCommentsChange?: (threads: CommentThread[]) => void
}
