import type { ComponentType } from 'react'
import type { FontSizeUnit } from './core/fontSizeUnits'
import type { FontFace } from './core/fontFamily'
import type { ListType } from './core/lists'
import type { FontMarkState } from './core/marks'
import type {
  BoxSides,
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
  CssLength,
  LineHeightValue,
  ParagraphBorder,
  ParagraphShadow,
}

export type CustomFont = FontFace

export type { Locale }

export type EditorMode = 'visual' | 'html'

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

export type ToolbarCustomization = {
  /** Icon group ids in display order. Full screen is always pinned last. */
  groupOrder: string[]
  /** Toolbar item ids that should be hidden from the icon toolbar. */
  hiddenItemIds: string[]
}

export type ToolbarCustomizationPersistence = {
  load: () => ToolbarCustomization | null | Promise<ToolbarCustomization | null>
  save: (settings: ToolbarCustomization | null) => void | Promise<void>
}

export type EditorProps = {
  value?: string
  defaultValue?: string
  onChange?: (html: string) => void
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
  customActions?: CustomAction[]
  /**
   * Extra document font faces appended after the built-in web-safe list.
   * Duplicate `family` values are ignored. Optional `css` stylesheet URLs are
   * loaded in the editor and prepended to exported HTML when that face is used.
   */
  customFonts?: CustomFont[]
  /**
   * Optional map over document HTML before it is stored and passed to `onChange`.
   * Runs on every edit (visual, HTML source, open, file drop, insert, `setHtml`).
   * Does not run for the inbound `value` / `defaultValue`.
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
   * When true, dropping an HTML file on the editor does not replace the document.
   * File → Open is unchanged. Default `false` (drop is allowed).
   */
  disableHtmlFileDrop?: boolean
  /**
   * Host-owned toolbar layout persistence. When set (both `load` and `save`),
   * the library does not use localStorage. Omit to persist in the browser.
   */
  toolbarCustomization?: ToolbarCustomizationPersistence
}
