import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { createCustomActionCommands, mergeCustomActions } from '../core/customActions'
import { createEditorCommands, createEditorQueries } from '../core/commands'
import type { CommandContext, AudioApply, FontDialogTab, FontPropertiesApply, ImageApply, ImageDialogTab, ImagePropertiesApply, LinkApply, LinkDialogTab, PageDialogTab, PagePropertiesApply, ParagraphDialogTab, ParagraphPropertiesApply, TableApply, TablePropertiesApply, CellPropertiesApply, RowPropertiesApply, YoutubeApply } from '../core/commandTypes'
import {
  applyPendingFontMarksOnInsert,
  emptyFontMarkState,
  FONT_MARKS,
  fontMarkStateEqual,
  hasPendingFontMarks,
  mergePendingFontMarks,
  queryInheritedFontMarks,
  toggleFontMarkInDocument,
  togglePendingFontMark,
  type FontMark,
  type FontMarkState,
  type PendingFontMarks,
} from '../core/marks'
import {
  queryBlockFormat,
  setBlockFormatInDocument,
  type BlockFormatQuery,
  type ParagraphStyleTag,
} from '../core/blockFormat'
import {
  canOutdentInDocument,
  indentInDocument,
  outdentInDocument,
} from '../core/indent'
import {
  queryList,
  toggleListInDocument,
  type ListQuery,
  type ListType,
} from '../core/lists'
import {
  applyCustomParagraphInDocument,
  applyParagraphPropertiesInDocument,
  emptyParagraphPropertiesApply,
  paragraphApplyToStyle,
  queryParagraphProperties,
} from '../core/paragraphProperties'
import {
  applyPagePropertiesInDocument,
  emptyPagePropertiesApply,
  queryPageProperties,
} from '../core/pageProperties'
import {
  queryTextAlign,
  setTextAlignInDocument,
  type TextAlign,
  type TextAlignQuery,
} from '../core/textAlign'
import {
  collectDocumentFontStylesheets,
  collectPreviewFontStylesheets,
  extractFontStylesheets,
  FONT_STYLESHEET_ATTR,
  hasPendingFontFamily,
  mergeFontFaces,
  prependFontStylesheets,
  queryInheritedFontFamily,
  setFontFamilyInDocument,
  type FontFamilyQuery,
  type PendingFontFamily,
} from '../core/fontFamily'
import {
  queryFontSizeMetrics,
  queryInheritedFontSize,
  setFontSizeInDocument,
  type FontSizeQuery,
  type FontSizeValue,
} from '../core/fontSize'
import {
  clampFontSize,
  convertFontSize,
  DEFAULT_FONT_SIZE_UNIT,
  type FontSizeUnit,
} from '../core/fontSizeUnits'
import {
  hasPendingInlineColors,
  queryInheritedInlineColor,
  setInlineColorInDocument,
  type InlineColorKind,
  type InlineColorQuery,
  type PendingColor,
} from '../core/inlineColor'
import {
  describeSelection,
  insertAtSelection,
  rangeToRestore,
  shouldKeepStoredVisualSelection,
  snapshotSelection,
  type SelectionSnapshot,
} from '../core/selection'
import { applyLinkInDocument, defaultLinkAttrs, isLinkActive, queryLinkAtSelection } from '../core/link'
import { insertBookmarkInDocument, listBookmarks } from '../core/bookmark'
import {
  copySelectionInDocument,
  cutSelectionInDocument,
  deleteSelectionInDocument,
} from '../core/clipboard'
import { clearFormattingInDocument } from '../core/clearFormatting'
import {
  compressCustomCss,
  formatCustomCssForDisplay,
  hasPendingCustomCss,
  queryCustomCssAtSelection,
  setCustomCssInDocument,
} from '../core/customCss'
import { createReadAloudSession, isSpeechSynthesisSupported, resolveReadAloudText } from '../core/readAloud'
import { insertAudioInDocument } from '../core/audio'
import { closestImage, insertImageInDocument, selectImageInDocument } from '../core/image'
import { insertYoutubeInDocument, insertVideoInDocument } from '../core/youtube'
import { insertHorizontalRuleInDocument } from '../core/horizontalRule'
import { writeImagePixelSize } from '../core/imageResize'
import {
  applyImagePropertiesInDocument,
  defaultImagePropertiesApply,
  imageAspectRatio,
  imageAtSelection,
  queryImageAtSelection,
} from '../core/imageProperties'
import {
  canMergeCellsInDocument,
  canUnmergeCellsInDocument,
  closestTable,
  closestCell,
  cellsInSelection,
  deleteColumnInDocument,
  deleteRowInDocument,
  insertColumnInDocument,
  insertRowInDocument,
  insertTableInDocument,
  mergeCellsInDocument,
  selectCellInDocument,
  tabInTable,
  tableAtSelection,
  unmergeCellsInDocument,
} from '../core/table'
import {
  applyTablePropertiesInDocument,
  defaultTablePropertiesApply,
  queryTableAtSelection,
} from '../core/tableProperties'
import {
  applyCellPropertiesInDocument,
  defaultCellPropertiesApply,
  queryCellAtSelection,
} from '../core/cellProperties'
import {
  applyRowPropertiesInDocument,
  defaultRowPropertiesApply,
  queryRowAtSelection,
} from '../core/rowProperties'
import { useAutoSave } from '../hooks/useAutoSave'
import { useControllableState } from '../hooks/useControllableState'
import { ChromeThemeProvider, chromeThemeProps } from '../chrome/ChromeTheme'
import { CloseIcon } from '../icons'
import { LocaleProvider, useT } from '../i18n/LocaleProvider'
import { FontPropertiesDialog } from '../modules/format/FontPropertiesDialog'
import { ParagraphPropertiesDialog } from '../modules/format/ParagraphPropertiesDialog'
import { PagePropertiesDialog } from '../modules/format/PagePropertiesDialog'
import { CustomParagraphStyleDialog } from '../modules/format/CustomParagraphStyleDialog'
import { CustomCssDialog } from '../modules/format/CustomCssDialog'
import { BookmarkDialog } from '../modules/insert/BookmarkDialog'
import { AudioDialog } from '../modules/insert/AudioDialog'
import { ImageDialog } from '../modules/insert/ImageDialog'
import { ImagePropertiesDialog } from '../modules/insert/ImagePropertiesDialog'
import { ImageResizeOverlay } from '../modules/insert/ImageResizeOverlay'
import { LinkDialog } from '../modules/insert/LinkDialog'
import { YoutubeDialog } from '../modules/insert/YoutubeDialog'
import { TableDialog } from '../modules/table/TableDialog'
import { TablePropertiesDialog } from '../modules/table/TablePropertiesDialog'
import { CellPropertiesDialog } from '../modules/table/CellPropertiesDialog'
import { RowPropertiesDialog } from '../modules/table/RowPropertiesDialog'
import { DocumentPreviewDialog } from '../modules/view/DocumentPreviewDialog'
import {
  readDarkModeFromStorage,
  writeDarkModeToStorage,
} from '../modules/view/darkModePersistence'
import {
  parseToolbarPosition,
  readToolbarPositionFromStorage,
  writeToolbarPositionToStorage,
} from '../modules/view/toolbarPositionPersistence'
import { ContextMenu, shouldOpenEditorContextMenu, type ContextMenuKind } from '../modules/contextMenu'
import { useHtmlFileDrop } from '../modules/file/useHtmlFileDrop'
import { createDocumentHistory } from '../modules/history'
import { defaultToolbarCatalog, defaultToolbarLayout, EditorToolbar } from '../toolbar'
import { filterAllowedChrome } from '../toolbar/allowedChrome'
import { CustomizeToolbarDialog } from '../toolbar/CustomizeToolbarDialog'
import {
  applyToolbarCustomization,
  readToolbarCustomizationFromStorage,
  writeToolbarCustomizationToStorage,
} from '../toolbar/toolbarCustomization'
import type {
  CustomActionApi,
  CustomAudioInsert,
  CustomImageInsert,
  CustomParagraphStyle,
  CustomParagraphStyleFont,
  CustomParagraphStyleParagraph,
  CustomVideoInsert,
  EditorMode,
  EditorProps,
  ToolbarCustomization,
  ToolbarPosition,
} from '../types'
import { HtmlSurface } from './HtmlSurface'
import { VisualSurface } from './VisualSurface'
import styles from './Editor.module.css'

export function Editor({
  value,
  defaultValue = '',
  onChange,
  onAutoSave,
  mode: modeProp,
  defaultMode = 'visual',
  onModeChange,
  fullscreen: fullscreenProp,
  defaultFullscreen = false,
  onFullscreenChange,
  placeholder,
  disabled,
  readOnly = false,
  className,
  locale = 'en',
  toolbarBackground,
  menuColor,
  menuBackground,
  menuFontSize,
  menuFontFamily,
  border,
  menuVisible = true,
  toolbarVisible = true,
  allowedChrome,
  customActions,
  customFonts,
  transformHtml,
  loadCustomParagraphStyles,
  onSaveCustomParagraphStyle,
  onDeleteCustomParagraphStyle,
  customImagePicker,
  disableBuiltinImageInsert,
  customAudioPicker,
  disableBuiltinAudioInsert,
  customVideoPicker,
  disableBuiltinVideoInsert,
  disableHtmlFileDrop = false,
  toolbarCustomization,
  darkMode = false,
  darkModePersistence,
  toolbarPosition = 'top',
  toolbarPositionPersistence,
}: EditorProps) {
  const locked = Boolean(disabled || readOnly)
  const [html, setHtml] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const [mode, setMode] = useControllableState<EditorMode>({
    value: modeProp,
    defaultValue: defaultMode,
    onChange: onModeChange,
  })
  const [fullscreen, setFullscreen] = useControllableState({
    value: fullscreenProp,
    defaultValue: defaultFullscreen,
    onChange: onFullscreenChange,
  })
  const visualRef = useRef<HTMLDivElement>(null)
  const htmlAreaRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<ReturnType<typeof createDocumentHistory> | null>(null)
  if (historyRef.current === null) {
    historyRef.current = createDocumentHistory(html)
  }
  const history = historyRef.current
  const htmlRef = useRef(html)
  htmlRef.current = html
  const modeRef = useRef(mode)
  modeRef.current = mode
  const fullscreenRef = useRef(fullscreen)
  fullscreenRef.current = fullscreen
  const selectionRef = useRef<SelectionSnapshot | null>(null)
  const [, setReadingAloudTick] = useState(0)
  const readAloudSessionRef = useRef<ReturnType<typeof createReadAloudSession> | null>(null)
  if (readAloudSessionRef.current === null) {
    readAloudSessionRef.current = createReadAloudSession(() => {
      setReadingAloudTick((tick) => tick + 1)
    })
  }
  const transformHtmlRef = useRef(transformHtml)
  transformHtmlRef.current = transformHtml
  const pendingMarksRef = useRef<PendingFontMarks>({})
  const pendingFontSizeRef = useRef<FontSizeValue | null>(null)
  const pendingFontFamilyRef = useRef<PendingFontFamily>(null)
  const pendingFontColorRef = useRef<PendingColor | null>(null)
  const pendingHighlightColorRef = useRef<PendingColor | null>(null)
  const pendingCustomCssRef = useRef<string | null>(null)
  const pendingAnchorRef = useRef<{ start: number; end: number } | null>(null)
  const [markState, setMarkState] = useState<FontMarkState>(emptyFontMarkState)
  const markStateRef = useRef(markState)
  markStateRef.current = markState
  const preferredUnitRef = useRef<FontSizeUnit>(DEFAULT_FONT_SIZE_UNIT)
  const [fontSizeState, setFontSizeState] = useState<FontSizeQuery>({
    value: null,
    unit: DEFAULT_FONT_SIZE_UNIT,
    mixed: false,
  })
  const fontSizeStateRef = useRef(fontSizeState)
  fontSizeStateRef.current = fontSizeState
  const [fontFamilyState, setFontFamilyState] = useState<FontFamilyQuery>({
    value: null,
    mixed: false,
  })
  const fontFamilyStateRef = useRef(fontFamilyState)
  fontFamilyStateRef.current = fontFamilyState
  const [fontColorState, setFontColorState] = useState<InlineColorQuery>({
    value: null,
    mixed: false,
  })
  const fontColorStateRef = useRef(fontColorState)
  fontColorStateRef.current = fontColorState
  const [highlightColorState, setHighlightColorState] = useState<InlineColorQuery>({
    value: null,
    mixed: false,
  })
  const highlightColorStateRef = useRef(highlightColorState)
  highlightColorStateRef.current = highlightColorState
  const [paragraphStyleState, setParagraphStyleState] = useState<BlockFormatQuery>({
    tag: null,
    mixed: false,
  })
  const paragraphStyleStateRef = useRef(paragraphStyleState)
  paragraphStyleStateRef.current = paragraphStyleState
  const [textAlignState, setTextAlignState] = useState<TextAlignQuery>({
    align: 'left',
    mixed: false,
  })
  const textAlignStateRef = useRef(textAlignState)
  textAlignStateRef.current = textAlignState
  const [listState, setListState] = useState<ListQuery>({ type: null, mixed: false })
  const listStateRef = useRef(listState)
  listStateRef.current = listState
  const [canOutdentState, setCanOutdentState] = useState(false)
  const canOutdentStateRef = useRef(canOutdentState)
  canOutdentStateRef.current = canOutdentState
  const [hasTextSelectionState, setHasTextSelectionState] = useState(false)
  const hasTextSelectionStateRef = useRef(hasTextSelectionState)
  hasTextSelectionStateRef.current = hasTextSelectionState
  const [linkActive, setLinkActive] = useState(false)
  const linkActiveRef = useRef(linkActive)
  linkActiveRef.current = linkActive
  const [fontDialog, setFontDialog] = useState<{ open: boolean; tab: FontDialogTab }>({
    open: false,
    tab: 'general',
  })
  const [customizeToolbarOpen, setCustomizeToolbarOpen] = useState(false)
  const [documentPreview, setDocumentPreview] = useState({ open: false, html: '' })
  const [toolbarSettings, setToolbarSettings] = useState<ToolbarCustomization | null>(null)
  const [toolbarSettingsLoading, setToolbarSettingsLoading] = useState(false)
  const [toolbarSettingsBusy, setToolbarSettingsBusy] = useState(false)
  const [dark, setDark] = useState(() => {
    if (darkModePersistence) return darkMode
    return readDarkModeFromStorage() ?? darkMode
  })
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition>(() => {
    if (toolbarPositionPersistence) return toolbarPosition
    return readToolbarPositionFromStorage() ?? toolbarPosition
  })
  const [paragraphDialog, setParagraphDialog] = useState<{
    open: boolean
    tab: ParagraphDialogTab
    value: ParagraphPropertiesApply
  }>({
    open: false,
    tab: 'general',
    value: emptyParagraphPropertiesApply(),
  })
  const [customCssDialog, setCustomCssDialog] = useState<{ open: boolean; value: string }>({
    open: false,
    value: '',
  })
  const [pageDialog, setPageDialog] = useState<{
    open: boolean
    tab: PageDialogTab
    value: PagePropertiesApply
  }>({
    open: false,
    tab: 'font',
    value: emptyPagePropertiesApply(),
  })
  const [customStyles, setCustomStyles] = useState<CustomParagraphStyle[]>([])
  const [customStylesLoading, setCustomStylesLoading] = useState(false)
  const [customStyleBusy, setCustomStyleBusy] = useState(false)
  const [customStyleDialog, setCustomStyleDialog] = useState<
    | { open: false }
    | { open: true; mode: 'create'; font: CustomParagraphStyleFont; paragraph: CustomParagraphStyleParagraph }
    | { open: true; mode: 'edit'; style: CustomParagraphStyle }
  >({ open: false })
  const [linkDialog, setLinkDialog] = useState<{
    open: boolean
    tab: LinkDialogTab
    href: string
    title: string
    targetBlank: boolean
    textDecorationNone: boolean
    hoverMode: 'color' | 'html'
    hoverColor: string | null
    hoverHtml: string
    bookmarks: { id: string }[]
    selectedBookmarkId: string
  }>({
    open: false,
    tab: 'link',
    href: '',
    title: '',
    targetBlank: false,
    textDecorationNone: false,
    hoverMode: 'color',
    hoverColor: null,
    hoverHtml: '',
    bookmarks: [],
    selectedBookmarkId: '',
  })
  const [bookmarkDialog, setBookmarkDialog] = useState<{
    open: boolean
    existingIds: string[]
  }>({
    open: false,
    existingIds: [],
  })
  const [imageDialog, setImageDialog] = useState({ open: false })
  const [audioDialog, setAudioDialog] = useState({ open: false })
  const [youtubeDialog, setYoutubeDialog] = useState({ open: false })
  const [imageProperties, setImageProperties] = useState<{
    open: boolean
    tab: ImageDialogTab
    value: ImagePropertiesApply
    aspectRatio: number
  }>({
    open: false,
    tab: 'general',
    value: defaultImagePropertiesApply(),
    aspectRatio: 1,
  })
  const [tableDialog, setTableDialog] = useState({ open: false })
  const [tableProperties, setTableProperties] = useState<{
    open: boolean
    value: TablePropertiesApply
  }>({
    open: false,
    value: defaultTablePropertiesApply(),
  })
  const [cellProperties, setCellProperties] = useState<{
    open: boolean
    value: CellPropertiesApply
  }>({
    open: false,
    value: defaultCellPropertiesApply(),
  })
  const [rowProperties, setRowProperties] = useState<{
    open: boolean
    value: RowPropertiesApply
  }>({
    open: false,
    value: defaultRowPropertiesApply(),
  })
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    x: number
    y: number
    kind: ContextMenuKind
    inTable: boolean
    canMergeCells: boolean
    canUnmergeCells: boolean
  }>({ open: false, x: 0, y: 0, kind: 'caret', inTable: false, canMergeCells: false, canUnmergeCells: false })
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const selectedImageRef = useRef(selectedImage)
  selectedImageRef.current = selectedImage
  const [inTable, setInTable] = useState(false)
  const inTableRef = useRef(inTable)
  inTableRef.current = inTable
  const [canMergeCells, setCanMergeCells] = useState(false)
  const canMergeCellsRef = useRef(canMergeCells)
  canMergeCellsRef.current = canMergeCells
  const [canUnmergeCells, setCanUnmergeCells] = useState(false)
  const canUnmergeCellsRef = useRef(canUnmergeCells)
  canUnmergeCellsRef.current = canUnmergeCells
  const lastVisualPointerTypeRef = useRef<string | undefined>(undefined)
  const customStylesRef = useRef(customStyles)
  customStylesRef.current = customStyles
  const customStylesLoadingRef = useRef(customStylesLoading)
  customStylesLoadingRef.current = customStylesLoading
  const customParagraphStylesEnabled = Boolean(
    loadCustomParagraphStyles && onSaveCustomParagraphStyle,
  )
  const customParagraphStylesEnabledRef = useRef(customParagraphStylesEnabled)
  customParagraphStylesEnabledRef.current = customParagraphStylesEnabled
  const loadCustomParagraphStylesRef = useRef(loadCustomParagraphStyles)
  loadCustomParagraphStylesRef.current = loadCustomParagraphStyles
  const onSaveCustomParagraphStyleRef = useRef(onSaveCustomParagraphStyle)
  onSaveCustomParagraphStyleRef.current = onSaveCustomParagraphStyle
  const onDeleteCustomParagraphStyleRef = useRef(onDeleteCustomParagraphStyle)
  onDeleteCustomParagraphStyleRef.current = onDeleteCustomParagraphStyle
  const customImagePickerRef = useRef(customImagePicker)
  customImagePickerRef.current = customImagePicker
  const customAudioPickerRef = useRef(customAudioPicker)
  customAudioPickerRef.current = customAudioPicker
  const customVideoPickerRef = useRef(customVideoPicker)
  customVideoPickerRef.current = customVideoPicker
  const toolbarCustomizationRef = useRef(toolbarCustomization)
  toolbarCustomizationRef.current = toolbarCustomization
  const darkModePersistenceRef = useRef(darkModePersistence)
  darkModePersistenceRef.current = darkModePersistence
  const toolbarPositionPersistenceRef = useRef(toolbarPositionPersistence)
  toolbarPositionPersistenceRef.current = toolbarPositionPersistence
  const darkRef = useRef(dark)
  darkRef.current = dark
  const toolbarPosRef = useRef(toolbarPos)
  toolbarPosRef.current = toolbarPos
  const disableBuiltinImageInsertRef = useRef(disableBuiltinImageInsert)
  disableBuiltinImageInsertRef.current = disableBuiltinImageInsert
  const disableBuiltinAudioInsertRef = useRef(disableBuiltinAudioInsert)
  disableBuiltinAudioInsertRef.current = disableBuiltinAudioInsert
  const disableBuiltinVideoInsertRef = useRef(disableBuiltinVideoInsert)
  disableBuiltinVideoInsertRef.current = disableBuiltinVideoInsert
  const customStyleLoadGenerationRef = useRef(0)
  const toolbarLoadGenerationRef = useRef(0)
  const toolbarSaveGenerationRef = useRef(0)
  const darkModeLoadGenerationRef = useRef(0)
  const darkModeSaveGenerationRef = useRef(0)
  const toolbarPositionLoadGenerationRef = useRef(0)
  const toolbarPositionSaveGenerationRef = useRef(0)
  const fontFaces = useMemo(() => mergeFontFaces(customFonts), [customFonts])
  const fontFacesRef = useRef(fontFaces)
  fontFacesRef.current = fontFaces
  const previewFontKey = useMemo(
    () => collectPreviewFontStylesheets(html, fontFaces).join('\n'),
    [html, fontFaces],
  )

  useEffect(() => {
    const hrefs = previewFontKey ? previewFontKey.split('\n') : []
    const links = hrefs.map((href) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.setAttribute(FONT_STYLESHEET_ATTR, '')
      document.head.append(link)
      return link
    })
    return () => {
      for (const link of links) link.remove()
    }
  }, [previewFontKey])

  const reloadCustomStyles = useCallback(async () => {
    const load = loadCustomParagraphStylesRef.current
    if (!load) return
    const generation = ++customStyleLoadGenerationRef.current
    setCustomStylesLoading(true)
    try {
      const next = await load()
      if (generation !== customStyleLoadGenerationRef.current) return
      setCustomStyles(next)
    } catch {
      /* keep previous styles */
    } finally {
      if (generation === customStyleLoadGenerationRef.current) {
        setCustomStylesLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!loadCustomParagraphStyles || !onSaveCustomParagraphStyle) {
      setCustomStyles([])
      setCustomStylesLoading(false)
      return
    }
    void reloadCustomStyles()
  }, [loadCustomParagraphStyles, onSaveCustomParagraphStyle, reloadCustomStyles])

  const persistToolbarSettings = useCallback(async (next: ToolbarCustomization | null) => {
    setToolbarSettings(next)
    const host = toolbarCustomizationRef.current
    if (host?.load && host.save) {
      const generation = ++toolbarSaveGenerationRef.current
      setToolbarSettingsBusy(true)
      try {
        await host.save(next)
      } catch {
        /* keep local settings */
      } finally {
        if (generation === toolbarSaveGenerationRef.current) {
          setToolbarSettingsBusy(false)
        }
      }
      return
    }
    writeToolbarCustomizationToStorage(next)
  }, [])

  useEffect(() => {
    const host = toolbarCustomization
    if (!host?.load || !host.save) {
      setToolbarSettings(readToolbarCustomizationFromStorage())
      setToolbarSettingsLoading(false)
      setToolbarSettingsBusy(false)
      return
    }
    const generation = ++toolbarLoadGenerationRef.current
    setToolbarSettingsLoading(true)
    void (async () => {
      try {
        const next = await host.load()
        if (generation !== toolbarLoadGenerationRef.current) return
        setToolbarSettings(next)
      } catch {
        if (generation !== toolbarLoadGenerationRef.current) return
        setToolbarSettings(null)
      } finally {
        if (generation === toolbarLoadGenerationRef.current) {
          setToolbarSettingsLoading(false)
        }
      }
    })()
    return () => {
      toolbarLoadGenerationRef.current += 1
    }
  }, [toolbarCustomization])

  const persistDarkMode = useCallback(async (next: boolean) => {
    setDark(next)
    const host = darkModePersistenceRef.current
    if (host?.load && host.save) {
      const generation = ++darkModeSaveGenerationRef.current
      try {
        await host.save(next)
      } catch {
        /* keep local theme */
      } finally {
        if (generation !== darkModeSaveGenerationRef.current) return
      }
      return
    }
    writeDarkModeToStorage(next)
  }, [])

  useEffect(() => {
    const host = darkModePersistence
    if (!host?.load || !host.save) {
      setDark(readDarkModeFromStorage() ?? darkMode)
      return
    }
    const generation = ++darkModeLoadGenerationRef.current
    void (async () => {
      try {
        const next = await host.load()
        if (generation !== darkModeLoadGenerationRef.current) return
        setDark(typeof next === 'boolean' ? next : darkMode)
      } catch {
        if (generation !== darkModeLoadGenerationRef.current) return
        setDark(darkMode)
      }
    })()
    return () => {
      darkModeLoadGenerationRef.current += 1
    }
  }, [darkModePersistence, darkMode])

  const persistToolbarPosition = useCallback(async (next: ToolbarPosition) => {
    setToolbarPos(next)
    const host = toolbarPositionPersistenceRef.current
    if (host?.load && host.save) {
      const generation = ++toolbarPositionSaveGenerationRef.current
      try {
        await host.save(next)
      } catch {
        /* keep local position */
      } finally {
        if (generation !== toolbarPositionSaveGenerationRef.current) return
      }
      return
    }
    writeToolbarPositionToStorage(next)
  }, [])

  useEffect(() => {
    const host = toolbarPositionPersistence
    if (!host?.load || !host.save) {
      setToolbarPos(readToolbarPositionFromStorage() ?? toolbarPosition)
      return
    }
    const generation = ++toolbarPositionLoadGenerationRef.current
    void (async () => {
      try {
        const next = await host.load()
        if (generation !== toolbarPositionLoadGenerationRef.current) return
        setToolbarPos(parseToolbarPosition(next) ?? toolbarPosition)
      } catch {
        if (generation !== toolbarPositionLoadGenerationRef.current) return
        setToolbarPos(toolbarPosition)
      }
    })()
    return () => {
      toolbarPositionLoadGenerationRef.current += 1
    }
  }, [toolbarPositionPersistence, toolbarPosition])

  const commitHtml = useCallback(
    (next: string) => {
      const transformed = transformHtmlRef.current?.(next) ?? next
      setHtml(transformed)
      return transformed
    },
    [setHtml],
  )

  const recordHtml = useCallback(
    (next: string, coalesce: boolean) => {
      const transformed = commitHtml(next)
      history.record(transformed, { coalesce })
      return transformed
    },
    [commitHtml, history],
  )

  const onHtmlFileDrop = useCallback(
    (next: string) => {
      recordHtml(next, false)
    },
    [recordHtml],
  )
  const htmlFileDrop = useHtmlFileDrop({
    enabled: !locked && !disableHtmlFileDrop,
    onHtml: onHtmlFileDrop,
  })

  const recordVisualHtml = useCallback(
    (body: string, coalesce: boolean) => {
      return recordHtml(
        prependFontStylesheets(
          body,
          collectDocumentFontStylesheets(body, htmlRef.current, fontFacesRef.current),
        ),
        coalesce,
      )
    },
    [recordHtml],
  )

  const undo = useCallback(() => {
    const next = history.undo()
    if (next === null) return
    history.markApplying()
    commitHtml(next)
  }, [commitHtml, history])

  const redo = useCallback(() => {
    const next = history.redo()
    if (next === null) return
    history.markApplying()
    commitHtml(next)
  }, [commitHtml, history])

  useEffect(() => {
    history.syncExternal(html)
  }, [html, history])

  const captureSelection = useCallback(() => {
    selectionRef.current = snapshotSelection({
      mode: modeRef.current,
      visualEl: visualRef.current,
      htmlEl: htmlAreaRef.current,
    })
  }, [])

  const refreshTableState = useCallback((root: HTMLElement | null) => {
    if (!root || modeRef.current !== 'visual') {
      setInTable(false)
      setCanMergeCells(false)
      setCanUnmergeCells(false)
      return
    }
    setInTable(tableAtSelection(root) !== null)
    setCanMergeCells(canMergeCellsInDocument(root))
    setCanUnmergeCells(canUnmergeCellsInDocument(root))
  }, [])

  const captureChromeSelection = useCallback(() => {
    const next = snapshotSelection({
      mode: modeRef.current,
      visualEl: visualRef.current,
      htmlEl: htmlAreaRef.current,
    })
    const prev = selectionRef.current
    if (shouldKeepStoredVisualSelection(prev, next)) return
    selectionRef.current = next
  }, [])

  const refreshFontSizeState = useCallback(() => {
    const root = visualRef.current
    if (modeRef.current !== 'visual' || !root) {
      setFontSizeState({ value: null, unit: preferredUnitRef.current, mixed: false })
      return
    }
    const next = queryInheritedFontSize(root, preferredUnitRef.current)
    if (pendingFontSizeRef.current) {
      next.value = pendingFontSizeRef.current.value
      next.unit = pendingFontSizeRef.current.unit
      next.mixed = false
    }
    preferredUnitRef.current = next.unit
    setFontSizeState((prev) =>
      prev.value === next.value && prev.unit === next.unit && prev.mixed === next.mixed
        ? prev
        : next,
    )
  }, [])

  const refreshFontFamilyState = useCallback(() => {
    const root = visualRef.current
    if (modeRef.current !== 'visual' || !root) {
      setFontFamilyState({ value: null, mixed: false })
      return
    }
    const next = queryInheritedFontFamily(root)
    if (pendingFontFamilyRef.current) {
      next.value = pendingFontFamilyRef.current.value
      next.mixed = false
    }
    setFontFamilyState((prev) =>
      prev.value === next.value && prev.mixed === next.mixed ? prev : next,
    )
  }, [])

  const refreshColorState = useCallback(() => {
    const root = visualRef.current
    if (modeRef.current !== 'visual' || !root) {
      setFontColorState({ value: null, mixed: false })
      setHighlightColorState({ value: null, mixed: false })
      return
    }
    const font = queryInheritedInlineColor(root, 'color')
    if (pendingFontColorRef.current) {
      font.value = pendingFontColorRef.current.value
      font.mixed = false
    }
    const highlight = queryInheritedInlineColor(root, 'backgroundColor')
    if (pendingHighlightColorRef.current) {
      highlight.value = pendingHighlightColorRef.current.value
      highlight.mixed = false
    }
    setFontColorState((prev) =>
      prev.value === font.value && prev.mixed === font.mixed ? prev : font,
    )
    setHighlightColorState((prev) =>
      prev.value === highlight.value && prev.mixed === highlight.mixed ? prev : highlight,
    )
  }, [])

  const refreshParagraphStyleState = useCallback(() => {
    const root = visualRef.current
    if (modeRef.current !== 'visual' || !root) {
      setParagraphStyleState({ tag: null, mixed: false })
      return
    }
    const next = queryBlockFormat(root)
    setParagraphStyleState((prev) => (prev.tag === next.tag && prev.mixed === next.mixed ? prev : next))
  }, [])

  const refreshParagraphChromeState = useCallback(() => {
    const root = visualRef.current
    if (modeRef.current !== 'visual' || !root) {
      setTextAlignState({ align: null, mixed: false })
      setListState({ type: null, mixed: false })
      setCanOutdentState(false)
      setLinkActive(false)
      return
    }
    const align = queryTextAlign(root)
    setTextAlignState((prev) =>
      prev.align === align.align && prev.mixed === align.mixed ? prev : align,
    )
    const list = queryList(root)
    setListState((prev) => (prev.type === list.type && prev.mixed === list.mixed ? prev : list))
    const canOutdent = canOutdentInDocument(root)
    setCanOutdentState((prev) => (prev === canOutdent ? prev : canOutdent))
    const nextLink = isLinkActive(root)
    setLinkActive((prev) => (prev === nextLink ? prev : nextLink))
  }, [])

  const refreshMarkState = useCallback(() => {
    const root = visualRef.current
    if (modeRef.current !== 'visual' || !root) {
      setMarkState(emptyFontMarkState())
      setHasTextSelectionState(false)
      refreshFontSizeState()
      refreshFontFamilyState()
      refreshColorState()
      refreshParagraphStyleState()
      refreshParagraphChromeState()
      return
    }
    const snapshot = selectionRef.current
    const nextHasTextSelection = Boolean(snapshot && !snapshot.collapsed)
    setHasTextSelectionState((prev) => (prev === nextHasTextSelection ? prev : nextHasTextSelection))
    const next = mergePendingFontMarks(queryInheritedFontMarks(root), pendingMarksRef.current)
    setMarkState((prev) => (fontMarkStateEqual(prev, next) ? prev : next))
    refreshFontSizeState()
    refreshFontFamilyState()
    refreshColorState()
    refreshParagraphStyleState()
    refreshParagraphChromeState()
  }, [refreshFontSizeState, refreshFontFamilyState, refreshColorState, refreshParagraphStyleState, refreshParagraphChromeState])

  const clearPendingMarksIfSelectionMoved = useCallback(() => {
    const snapshot = selectionRef.current
    const anchor = pendingAnchorRef.current
    if (!anchor || !snapshot) return
    if (
      snapshot.collapsed &&
      snapshot.start === anchor.start &&
      snapshot.end === anchor.end
    ) {
      return
    }
    pendingMarksRef.current = {}
    pendingFontSizeRef.current = null
    pendingFontFamilyRef.current = null
    pendingFontColorRef.current = null
    pendingHighlightColorRef.current = null
    pendingCustomCssRef.current = null
    pendingAnchorRef.current = null
  }, [])

  useEffect(() => {
    if (mode === 'visual') {
      refreshMarkState()
      return
    }
    pendingMarksRef.current = {}
    pendingFontSizeRef.current = null
    pendingFontFamilyRef.current = null
    pendingFontColorRef.current = null
    pendingHighlightColorRef.current = null
    pendingCustomCssRef.current = null
    pendingAnchorRef.current = null
    setMarkState(emptyFontMarkState())
    setFontSizeState({ value: null, unit: preferredUnitRef.current, mixed: false })
    setFontFamilyState({ value: null, mixed: false })
    setFontColorState({ value: null, mixed: false })
    setHighlightColorState({ value: null, mixed: false })
    setParagraphStyleState({ tag: null, mixed: false })
    setTextAlignState({ align: null, mixed: false })
    setListState({ type: null, mixed: false })
    setCanOutdentState(false)
    setHasTextSelectionState(false)
  }, [mode, html, refreshMarkState])

  const applyInsert = useCallback(
    (snapshot: SelectionSnapshot, content: string, asHtml: boolean) => {
      insertAtSelection({
        snapshot,
        visualEl: visualRef.current,
        htmlEl: htmlAreaRef.current,
        getHtml: () => {
          if (modeRef.current === 'visual' && visualRef.current) {
            return visualRef.current.innerHTML
          }
          return htmlRef.current
        },
        setHtml: (next) => {
          if (modeRef.current === 'visual') {
            recordVisualHtml(extractFontStylesheets(next).body, false)
            return
          }
          recordHtml(next, false)
        },
        content,
        asHtml,
      })
    },
    [recordHtml, recordVisualHtml],
  )

  const handleModeChange = useCallback(
    (next: EditorMode) => {
      if (modeRef.current === 'visual' && next === 'html' && visualRef.current) {
        const flushed = visualRef.current.innerHTML
        const serialized = prependFontStylesheets(
          flushed,
          collectDocumentFontStylesheets(flushed, htmlRef.current, fontFacesRef.current),
        )
        if (serialized !== htmlRef.current) {
          recordHtml(serialized, true)
        }
      }
      setMode(next)
    },
    [recordHtml, setMode],
  )

  useEffect(() => {
    if (!fullscreen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [fullscreen])

  useEffect(() => {
    if (!fullscreen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented) return
      if (fontDialog.open || customCssDialog.open || paragraphDialog.open || pageDialog.open || tableDialog.open || tableProperties.open || cellProperties.open || rowProperties.open || customizeToolbarOpen || documentPreview.open) return
      event.preventDefault()
      setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [fullscreen, setFullscreen, fontDialog.open, customCssDialog.open, paragraphDialog.open, pageDialog.open, tableDialog.open, tableProperties.open, cellProperties.open, rowProperties.open, customizeToolbarOpen, documentPreview.open])

  useEffect(() => {
    const onSelectionChange = () => {
      if (modeRef.current !== 'visual' || !visualRef.current) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const node = sel.anchorNode
      if (!node || (!visualRef.current.contains(node) && visualRef.current !== node)) return
      captureSelection()
      clearPendingMarksIfSelectionMoved()
      refreshMarkState()
      setSelectedImage(imageAtSelection(visualRef.current))
      refreshTableState(visualRef.current)
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [captureSelection, clearPendingMarksIfSelectionMoved, refreshMarkState, refreshTableState])

  useEffect(() => {
    if (mode !== 'html') return
    const el = htmlAreaRef.current
    if (!el) return
    const save = () => captureSelection()
    el.addEventListener('select', save)
    el.addEventListener('keyup', save)
    el.addEventListener('mouseup', save)
    return () => {
      el.removeEventListener('select', save)
      el.removeEventListener('keyup', save)
      el.removeEventListener('mouseup', save)
    }
  }, [mode, captureSelection])

  useLayoutEffect(() => {
    if (mode !== 'visual' || locked) {
      setSelectedImage(null)
      return
    }
    const root = visualRef.current
    if (!root) return
    const live = imageAtSelection(root)
    setSelectedImage((prev) => {
      if (live) return live
      if (prev && prev.isConnected && root.contains(prev)) return prev
      return null
    })
  }, [html, mode, locked])

  const restoreVisualRange = useCallback((root: HTMLElement) => {
    const live = snapshotSelection({
      mode: 'visual',
      visualEl: root,
      htmlEl: htmlAreaRef.current,
    })
    const stored = selectionRef.current
    const snapshot = shouldKeepStoredVisualSelection(stored, live)
      ? stored
      : live.visualRange
        ? live
        : stored ?? live

    selectionRef.current = snapshot
    root.focus()
    const range = rangeToRestore(root, snapshot)
    if (range) {
      const sel = window.getSelection()
      try {
        sel?.removeAllRanges()
        sel?.addRange(range)
        selectionRef.current = { ...snapshot, visualRange: range }
      } catch {
        /* range may have been detached */
      }
    }
    return selectionRef.current ?? snapshot
  }, [])

  const applyFontSize = useCallback(
    (size: number, unit?: FontSizeUnit) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      const nextUnit = unit ?? preferredUnitRef.current
      const clamped = clampFontSize(size, nextUnit)
      if (!clamped) return
      preferredUnitRef.current = clamped.unit
      const snapshot = restoreVisualRange(root)

      if (snapshot.collapsed) {
        pendingFontSizeRef.current = clamped
        pendingAnchorRef.current = { start: snapshot.start, end: snapshot.end }
        refreshMarkState()
        return
      }

      pendingFontSizeRef.current = null
      if (!setFontSizeInDocument(root, clamped.value, clamped.unit)) return
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyFontFamily = useCallback(
    (family: string | null) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      const snapshot = restoreVisualRange(root)

      if (snapshot.collapsed) {
        pendingFontFamilyRef.current = { value: family }
        pendingAnchorRef.current = { start: snapshot.start, end: snapshot.end }
        refreshMarkState()
        return
      }

      pendingFontFamilyRef.current = null
      if (!setFontFamilyInDocument(root, family)) return
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyInlineColor = useCallback(
    (kind: InlineColorKind, color: string | null) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      const snapshot = restoreVisualRange(root)
      const pendingRef = kind === 'color' ? pendingFontColorRef : pendingHighlightColorRef

      if (snapshot.collapsed) {
        pendingRef.current = { value: color }
        pendingAnchorRef.current = { start: snapshot.start, end: snapshot.end }
        refreshMarkState()
        return
      }

      pendingRef.current = null
      if (!setInlineColorInDocument(root, kind, color)) return
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyProperties = useCallback(
    (draft: FontPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      const snapshot = restoreVisualRange(root)
      setFontDialog({ open: false, tab: 'general' })

      if (snapshot.collapsed) {
        if (draft.size !== null) {
          const clamped = clampFontSize(draft.size, draft.unit)
          if (clamped) {
            pendingFontSizeRef.current = clamped
            preferredUnitRef.current = clamped.unit
          }
        }
        const inherited = queryInheritedFontMarks(root)
        const pending: PendingFontMarks = {}
        for (const mark of FONT_MARKS) {
          if (draft.marks[mark] !== inherited[mark]) pending[mark] = draft.marks[mark]
        }
        pendingMarksRef.current = pending
        if (!draft.fontColorMixed) {
          pendingFontColorRef.current = { value: draft.fontColor }
        }
        if (!draft.highlightColorMixed) {
          pendingHighlightColorRef.current = { value: draft.highlightColor }
        }
        if (!draft.fontFamilyMixed) {
          pendingFontFamilyRef.current = { value: draft.fontFamily }
        }
        pendingAnchorRef.current = { start: snapshot.start, end: snapshot.end }
        refreshMarkState()
        return
      }

      pendingMarksRef.current = {}
      pendingFontSizeRef.current = null
      pendingFontFamilyRef.current = null
      pendingFontColorRef.current = null
      pendingHighlightColorRef.current = null
      pendingAnchorRef.current = null
      if (draft.size !== null) {
        const clamped = clampFontSize(draft.size, draft.unit)
        if (clamped) {
          preferredUnitRef.current = clamped.unit
          setFontSizeInDocument(root, clamped.value, clamped.unit)
        }
      }
      const currentMarks = queryInheritedFontMarks(root)
      for (const mark of FONT_MARKS) {
        if (draft.marks[mark] !== currentMarks[mark]) {
          toggleFontMarkInDocument(root, mark)
        }
      }
      if (!draft.fontFamilyMixed) {
        setFontFamilyInDocument(root, draft.fontFamily)
      }
      if (!draft.fontColorMixed) {
        setInlineColorInDocument(root, 'color', draft.fontColor)
      }
      if (!draft.highlightColorMixed) {
        setInlineColorInDocument(root, 'backgroundColor', draft.highlightColor)
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyParagraphProperties = useCallback(
    (draft: ParagraphPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setParagraphDialog((prev) => ({ ...prev, open: false }))
      if (!applyParagraphPropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyCustomCss = useCallback(
    (css: string) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      const snapshot = restoreVisualRange(root)
      setCustomCssDialog((prev) => ({ ...prev, open: false }))
      if (!compressCustomCss(css)) {
        captureSelection()
        refreshMarkState()
        return
      }

      if (snapshot.collapsed) {
        pendingCustomCssRef.current = css
        pendingAnchorRef.current = { start: snapshot.start, end: snapshot.end }
        refreshMarkState()
        return
      }

      pendingCustomCssRef.current = null
      if (!setCustomCssInDocument(root, css)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyPageProperties = useCallback(
    (draft: PagePropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setPageDialog((prev) => ({ ...prev, open: false }))
      if (!applyPagePropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyLink = useCallback(
    (draft: LinkApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setLinkDialog((prev) => ({ ...prev, open: false }))
      if (!applyLinkInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyBookmark = useCallback(
    (name: string) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setBookmarkDialog((prev) => ({ ...prev, open: false }))
      if (!insertBookmarkInDocument(root, name)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyImage = useCallback(
    (draft: ImageApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setImageDialog({ open: false })
      if (!insertImageInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyAudio = useCallback(
    (draft: AudioApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setAudioDialog({ open: false })
      if (!insertAudioInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyYoutube = useCallback(
    (draft: YoutubeApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setYoutubeDialog({ open: false })
      if (!insertYoutubeInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyTable = useCallback(
    (draft: TableApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setTableDialog({ open: false })
      if (!insertTableInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
      refreshTableState(root)
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const applyTableProperties = useCallback(
    (draft: TablePropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setTableProperties((prev) => ({ ...prev, open: false }))
      if (!applyTablePropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyCellProperties = useCallback(
    (draft: CellPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setCellProperties((prev) => ({ ...prev, open: false }))
      if (!applyCellPropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
      refreshTableState(root)
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const applyRowProperties = useCallback(
    (draft: RowPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setRowProperties((prev) => ({ ...prev, open: false }))
      if (!applyRowPropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const runTableStructure = useCallback(
    (mutate: (root: HTMLElement) => boolean) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      if (!mutate(root)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
      refreshTableState(root)
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const insertCustomImage = useCallback(
    (image: CustomImageInsert) => {
      applyImage({
        src: image.src,
        alt: image.alt ?? '',
        title: image.title ?? '',
        css: image.css,
      })
    },
    [applyImage],
  )

  const insertCustomAudio = useCallback(
    (audio: CustomAudioInsert) => {
      applyAudio({
        src: audio.src,
        title: audio.title ?? '',
        css: audio.css,
      })
    },
    [applyAudio],
  )

  const insertCustomVideo = useCallback(
    (video: CustomVideoInsert) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setYoutubeDialog({ open: false })
      if (!insertVideoInDocument(root, {
        src: video.src,
        title: video.title ?? '',
        css: video.css,
      })) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyImageProperties = useCallback(
    (draft: ImagePropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      setImageProperties((prev) => ({ ...prev, open: false }))
      if (!applyImagePropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtml(root.innerHTML, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const handleImageResize = useCallback(
    (width: number, height: number) => {
      if (!selectedImage?.isConnected) return
      writeImagePixelSize(selectedImage, width, height)
    },
    [selectedImage],
  )

  const handleImageResizeEnd = useCallback(() => {
    const root = visualRef.current
    if (!root || !selectedImage?.isConnected) return
    recordVisualHtml(root.innerHTML, false)
    selectImageInDocument(root, selectedImage)
    captureSelection()
    refreshMarkState()
  }, [selectedImage, recordVisualHtml, captureSelection, refreshMarkState])

  const getDocumentHtml = useCallback(() => {
    if (modeRef.current === 'visual' && visualRef.current) {
      const flushed = visualRef.current.innerHTML
      const serialized = prependFontStylesheets(
        flushed,
        collectDocumentFontStylesheets(flushed, htmlRef.current, fontFacesRef.current),
      )
      if (serialized !== htmlRef.current) {
        return recordHtml(serialized, true)
      }
    }
    return htmlRef.current
  }, [recordHtml])

  useAutoSave({ onAutoSave, getHtml: getDocumentHtml })

  useEffect(() => {
    return () => {
      readAloudSessionRef.current?.cancel()
    }
  }, [])

  const commandContext: CommandContext = useMemo(
    () => ({
      getHtml: getDocumentHtml,
      setHtml: (next) => {
        recordHtml(next, false)
      },
      getMode: () => modeRef.current,
      setMode: handleModeChange,
      getFullscreen: () => fullscreenRef.current,
      setFullscreen,
      getDarkMode: () => darkRef.current,
      setDarkMode: (next) => {
        void persistDarkMode(next)
      },
      getToolbarPosition: () => toolbarPosRef.current,
      setToolbarPosition: (next) => {
        void persistToolbarPosition(next)
      },
      openCustomizeToolbar: () => {
        setCustomizeToolbarOpen(true)
      },
      openDocumentPreview: () => {
        setDocumentPreview({ open: true, html: getDocumentHtml() })
      },
      toggleReadAloud: () => {
        const session = readAloudSessionRef.current
        if (!session) return
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRef.current,
            htmlEl: htmlAreaRef.current,
          })
        const text = resolveReadAloudText(describeSelection(snapshot), getDocumentHtml())
        if (!text) return
        session.toggle(text)
      },
      isReadingAloud: () => readAloudSessionRef.current?.isSpeaking() ?? false,
      canReadAloud: () => {
        if (!isSpeechSynthesisSupported()) return false
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRef.current,
            htmlEl: htmlAreaRef.current,
          })
        return resolveReadAloudText(describeSelection(snapshot), getDocumentHtml()) !== null
      },
      undo,
      redo,
      canUndo: () => history.canUndo(),
      canRedo: () => history.canRedo(),
      getSelection: () => {
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRef.current,
            htmlEl: htmlAreaRef.current,
          })
        return describeSelection(snapshot)
      },
      insertText: (text: string) => {
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRef.current,
            htmlEl: htmlAreaRef.current,
          })
        applyInsert(snapshot, text, false)
      },
      insertHtml: (markup: string, formattedText?: string) => {
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRef.current,
            htmlEl: htmlAreaRef.current,
          })
        const asHtml = formattedText === undefined
        applyInsert(snapshot, asHtml ? markup : formattedText, asHtml)
      },
      toggleFontMark: (mark: FontMark) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        const snapshot = restoreVisualRange(root)

        if (snapshot.collapsed) {
          const inherited = queryInheritedFontMarks(root)
          pendingMarksRef.current = togglePendingFontMark(pendingMarksRef.current, inherited, mark)
          pendingAnchorRef.current = { start: snapshot.start, end: snapshot.end }
          refreshMarkState()
          return
        }

        pendingMarksRef.current = {}
        pendingAnchorRef.current = null
        if (!toggleFontMarkInDocument(root, mark)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      clearFormatting: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        const snapshot = restoreVisualRange(root)
        if (snapshot.collapsed) return
        pendingMarksRef.current = {}
        pendingFontSizeRef.current = null
        pendingFontFamilyRef.current = null
        pendingFontColorRef.current = null
        pendingHighlightColorRef.current = null
        pendingCustomCssRef.current = null
        pendingAnchorRef.current = null
        if (!clearFormattingInDocument(root)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      isFontMarkActive: (mark: FontMark) => markStateRef.current[mark],
      hasTextSelection: () => modeRef.current === 'visual' && hasTextSelectionStateRef.current,
      setFontSize: (size: number, unit?: FontSizeUnit) => {
        applyFontSize(size, unit)
      },
      setFontSizeUnit: (unit: FontSizeUnit) => {
        const root = visualRef.current
        const current = fontSizeStateRef.current
        if (modeRef.current !== 'visual' || !root || current.value === null || current.mixed) {
          preferredUnitRef.current = unit
          setFontSizeState((prev) => ({ ...prev, unit }))
          return
        }
        const snapshot = restoreVisualRange(root)
        const metrics = queryFontSizeMetrics(root, snapshot.visualRange?.startContainer ?? root)
        const converted = convertFontSize(
          current.value,
          current.unit,
          unit,
          metrics.parentPx,
          metrics.rootPx,
        )
        applyFontSize(converted, unit)
      },
      getFontSize: () => fontSizeStateRef.current.value,
      getFontSizeUnit: () => fontSizeStateRef.current.unit,
      isFontSizeMixed: () => fontSizeStateRef.current.mixed,
      setFontFamily: (family: string | null) => {
        applyFontFamily(family)
      },
      getFontFamily: () => fontFamilyStateRef.current.value,
      isFontFamilyMixed: () => fontFamilyStateRef.current.mixed,
      getFontFaces: () => fontFacesRef.current,
      setFontColor: (color: string | null) => {
        applyInlineColor('color', color)
      },
      setHighlightColor: (color: string | null) => {
        applyInlineColor('backgroundColor', color)
      },
      getFontColor: () => fontColorStateRef.current.value,
      isFontColorMixed: () => fontColorStateRef.current.mixed,
      getHighlightColor: () => highlightColorStateRef.current.value,
      isHighlightColorMixed: () => highlightColorStateRef.current.mixed,
      setParagraphStyle: (tag: ParagraphStyleTag) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!setBlockFormatInDocument(root, tag)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      getParagraphStyle: () => paragraphStyleStateRef.current.tag,
      isParagraphStyleMixed: () => paragraphStyleStateRef.current.mixed,
      setTextAlign: (align: TextAlign) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!setTextAlignInDocument(root, align)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      getTextAlign: () => textAlignStateRef.current.align,
      isTextAlignMixed: () => textAlignStateRef.current.mixed,
      indent: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!indentInDocument(root)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      outdent: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!outdentInDocument(root)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      canOutdent: () => modeRef.current === 'visual' && canOutdentStateRef.current,
      toggleList: (type: ListType) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!toggleListInDocument(root, type)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      isBulletList: () => listStateRef.current.type === 'ul' && !listStateRef.current.mixed,
      isNumberedList: () => listStateRef.current.type === 'ol' && !listStateRef.current.mixed,
      openFontProperties: (tab?: FontDialogTab) => {
        if (modeRef.current !== 'visual') return
        setFontDialog({ open: true, tab: tab ?? 'general' })
      },
      applyFontProperties: (draft: FontPropertiesApply) => {
        applyProperties(draft)
      },
      openCustomCss: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        const query = root ? queryCustomCssAtSelection(root) : { value: null, mixed: false }
        const value =
          query.mixed || !query.value ? '' : formatCustomCssForDisplay(query.value)
        setCustomCssDialog({ open: true, value })
      },
      applyCustomCss: (css: string) => {
        applyCustomCss(css)
      },
      openParagraphProperties: (tab?: ParagraphDialogTab) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        setParagraphDialog({
          open: true,
          tab: tab ?? 'general',
          value: root ? queryParagraphProperties(root) : emptyParagraphPropertiesApply(),
        })
      },
      applyParagraphProperties: (draft: ParagraphPropertiesApply) => {
        applyParagraphProperties(draft)
      },
      openPageProperties: (tab?: PageDialogTab) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        setPageDialog({
          open: true,
          tab: tab ?? 'font',
          value: root ? queryPageProperties(root) : emptyPagePropertiesApply(),
        })
      },
      applyPageProperties: (draft: PagePropertiesApply) => {
        applyPageProperties(draft)
      },
      openCustomParagraphStyleDialog: (id?: string) => {
        if (modeRef.current !== 'visual') return
        if (!customParagraphStylesEnabledRef.current) return
        if (id) {
          const style = customStylesRef.current.find((item) => item.id === id)
          if (!style) return
          setCustomStyleDialog({ open: true, mode: 'edit', style })
          return
        }
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        setCustomStyleDialog({
          open: true,
          mode: 'create',
          font: {
            size: fontSizeStateRef.current.mixed ? null : fontSizeStateRef.current.value,
            unit: fontSizeStateRef.current.unit,
            marks: { ...markStateRef.current },
            fontFamily: fontFamilyStateRef.current.mixed ? null : fontFamilyStateRef.current.value,
            fontColor: fontColorStateRef.current.mixed ? null : fontColorStateRef.current.value,
            highlightColor: highlightColorStateRef.current.mixed
              ? null
              : highlightColorStateRef.current.value,
          },
          paragraph: paragraphApplyToStyle(
            root ? queryParagraphProperties(root) : emptyParagraphPropertiesApply(),
          ),
        })
      },
      applyCustomParagraphStyle: (id: string) => {
        const style = customStylesRef.current.find((item) => item.id === id)
        if (!style) return
        applyProperties({
          size: style.font.size,
          unit: style.font.unit,
          marks: style.font.marks,
          fontFamily: style.font.fontFamily ?? null,
          fontFamilyMixed: false,
          fontColor: style.font.fontColor,
          highlightColor: style.font.highlightColor,
          fontColorMixed: false,
          highlightColorMixed: false,
        })
        if (!style.paragraph) return
        const root = visualRef.current
        if (!root || modeRef.current !== 'visual') return
        restoreVisualRange(root)
        if (!applyCustomParagraphInDocument(root, style.paragraph)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      customParagraphStylesEnabled: () => customParagraphStylesEnabledRef.current,
      getCustomParagraphStyles: () => customStylesRef.current,
      isCustomParagraphStylesLoading: () => customStylesLoadingRef.current,
      openLinkDialog: (tab?: LinkDialogTab) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        const attrs = root ? queryLinkAtSelection(root) : defaultLinkAttrs()
        const bookmarks = root ? listBookmarks(root) : []
        const href = attrs?.href ?? ''
        const fromHash = href.startsWith('#') ? href.slice(1) : ''
        const selectedBookmarkId = bookmarks.some((entry) => entry.id === fromHash) ? fromHash : ''
        setLinkDialog({
          open: true,
          tab: tab ?? 'link',
          href,
          title: attrs?.title ?? '',
          targetBlank: attrs?.targetBlank ?? false,
          textDecorationNone: attrs?.textDecorationNone ?? false,
          hoverMode: attrs?.hoverMode ?? 'color',
          hoverColor: attrs?.hoverColor ?? null,
          hoverHtml: attrs?.hoverHtml ?? '',
          bookmarks,
          selectedBookmarkId,
        })
      },
      applyLink: (draft: LinkApply) => {
        applyLink(draft)
      },
      openBookmarkDialog: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        setBookmarkDialog({
          open: true,
          existingIds: root ? listBookmarks(root).map((entry) => entry.id) : [],
        })
      },
      applyBookmark: (name: string) => {
        applyBookmark(name)
      },
      openImageDialog: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        const picker = customImagePickerRef.current
        if (disableBuiltinImageInsertRef.current && picker) {
          picker.onPick(insertCustomImage)
          return
        }
        setImageDialog({ open: true })
      },
      applyImage: (draft: ImageApply) => {
        applyImage(draft)
      },
      openAudioDialog: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        const picker = customAudioPickerRef.current
        if (disableBuiltinAudioInsertRef.current && picker) {
          picker.onPick(insertCustomAudio)
          return
        }
        setAudioDialog({ open: true })
      },
      applyAudio: (draft: AudioApply) => {
        applyAudio(draft)
      },
      openYoutubeDialog: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        const picker = customVideoPickerRef.current
        if (disableBuiltinVideoInsertRef.current && picker) {
          picker.onPick(insertCustomVideo)
          return
        }
        setYoutubeDialog({ open: true })
      },
      applyYoutube: (draft: YoutubeApply) => {
        applyYoutube(draft)
      },
      openImageProperties: (tab?: ImageDialogTab) => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        const img = imageAtSelection(root)
        const value = queryImageAtSelection(root)
        if (!img || !value) return
        setImageProperties({
          open: true,
          tab: tab ?? 'general',
          value,
          aspectRatio: imageAspectRatio(img),
        })
      },
      applyImageProperties: (draft: ImagePropertiesApply) => {
        applyImageProperties(draft)
      },
      insertHorizontalRule: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!insertHorizontalRuleInDocument(root)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      openTableDialog: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (root) restoreVisualRange(root)
        setTableDialog({ open: true })
      },
      applyTable: (draft: TableApply) => {
        applyTable(draft)
      },
      openTableProperties: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        const value = queryTableAtSelection(root)
        if (!value) return
        setTableProperties({ open: true, value })
      },
      applyTableProperties: (draft: TablePropertiesApply) => {
        applyTableProperties(draft)
      },
      openCellProperties: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        const value = queryCellAtSelection(root)
        if (!value) return
        setCellProperties({ open: true, value })
      },
      applyCellProperties: (draft: CellPropertiesApply) => {
        applyCellProperties(draft)
      },
      openRowProperties: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        const value = queryRowAtSelection(root)
        if (!value) return
        setRowProperties({ open: true, value })
      },
      applyRowProperties: (draft: RowPropertiesApply) => {
        applyRowProperties(draft)
      },
      insertRowBelow: () => {
        runTableStructure((root) => insertRowInDocument(root, 'below'))
      },
      insertRowBefore: () => {
        runTableStructure((root) => insertRowInDocument(root, 'before'))
      },
      deleteRow: () => {
        runTableStructure((root) => deleteRowInDocument(root))
      },
      insertColumnAfter: () => {
        runTableStructure((root) => insertColumnInDocument(root, 'after'))
      },
      insertColumnBefore: () => {
        runTableStructure((root) => insertColumnInDocument(root, 'before'))
      },
      deleteColumn: () => {
        runTableStructure((root) => deleteColumnInDocument(root))
      },
      mergeCells: () => {
        runTableStructure((root) => mergeCellsInDocument(root))
      },
      unmergeCells: () => {
        runTableStructure((root) => unmergeCellsInDocument(root))
      },
      cut: async () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!(await cutSelectionInDocument(root))) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      copy: async () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        await copySelectionInDocument(root)
      },
      deleteSelection: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!deleteSelectionInDocument(root)) return
        recordVisualHtml(root.innerHTML, false)
        captureSelection()
        refreshMarkState()
      },
      isLink: () => linkActiveRef.current,
      isImageSelected: () => modeRef.current === 'visual' && selectedImageRef.current !== null,
      isInTable: () => modeRef.current === 'visual' && inTableRef.current,
      canMergeCells: () => modeRef.current === 'visual' && canMergeCellsRef.current,
      canUnmergeCells: () => modeRef.current === 'visual' && canUnmergeCellsRef.current,
    }),
    [recordHtml, recordVisualHtml, handleModeChange, setFullscreen, persistDarkMode, persistToolbarPosition, applyInsert, undo, redo, captureSelection, refreshMarkState, restoreVisualRange, applyFontSize, applyFontFamily, applyInlineColor, applyProperties, applyCustomCss, applyParagraphProperties, applyPageProperties, applyLink, applyBookmark, applyImage, applyAudio, applyYoutube, applyImageProperties, applyTable, applyTableProperties, applyCellProperties, applyRowProperties, runTableStructure, insertCustomImage, insertCustomAudio, insertCustomVideo, getDocumentHtml],
  )

  const createActionApi = useCallback((): CustomActionApi => {
    const snapshot =
      selectionRef.current ??
      snapshotSelection({
        mode: modeRef.current,
        visualEl: visualRef.current,
        htmlEl: htmlAreaRef.current,
      })
    return {
      mode: snapshot.mode,
      selection: describeSelection(snapshot),
      getHtml: commandContext.getHtml,
      setHtml: (next) => {
        recordHtml(next, false)
      },
      insertText: (text) => applyInsert(snapshot, text, false),
      insertHtml: (markup, formattedText) => {
        const asHtml = formattedText === undefined
        applyInsert(snapshot, asHtml ? markup : formattedText, asHtml)
      },
    }
  }, [applyInsert, commandContext.getHtml, recordHtml])

  const { catalog, layout: baseLayout } = useMemo(
    () => mergeCustomActions(customActions, defaultToolbarCatalog, defaultToolbarLayout),
    [customActions],
  )
  const allowedLayout = useMemo(
    () => filterAllowedChrome(baseLayout, allowedChrome),
    [baseLayout, allowedChrome],
  )
  const layout = useMemo(
    () => ({
      ...allowedLayout,
      iconGroups: applyToolbarCustomization(allowedLayout.iconGroups, toolbarSettings),
    }),
    [allowedLayout, toolbarSettings],
  )

  const commands = useMemo(
    () => ({
      ...createEditorCommands(commandContext),
      ...createCustomActionCommands(customActions, createActionApi),
    }),
    [commandContext, customActions, createActionApi],
  )
  const queries = useMemo(
    () => createEditorQueries(commandContext),
    [commandContext, markState, fontSizeState, fontFamilyState, fontColorState, highlightColorState, paragraphStyleState, customStyles, customStylesLoading, customParagraphStylesEnabled, fontFaces, selectedImage, inTable, canMergeCells, canUnmergeCells, hasTextSelectionState, dark, toolbarPos],
  )

  const handleVisualBeforeInput = useCallback(
    (event: InputEvent) => {
      if (locked) return
      if (
        (event.inputType !== 'insertText' && event.inputType !== 'insertReplacementText') ||
        !event.data
      ) {
        return
      }
      if (
        !hasPendingFontMarks(pendingMarksRef.current) &&
        !pendingFontSizeRef.current &&
        !hasPendingFontFamily(pendingFontFamilyRef.current) &&
        !hasPendingInlineColors({
          color: pendingFontColorRef.current,
          backgroundColor: pendingHighlightColorRef.current,
        }) &&
        !hasPendingCustomCss(pendingCustomCssRef.current)
      ) {
        return
      }
      const root = visualRef.current
      if (!root) return
      event.preventDefault()
      applyPendingFontMarksOnInsert(
        root,
        event.data,
        pendingMarksRef.current,
        pendingFontSizeRef.current,
        {
          color: pendingFontColorRef.current,
          backgroundColor: pendingHighlightColorRef.current,
        },
        pendingFontFamilyRef.current,
        pendingCustomCssRef.current,
      )
      pendingMarksRef.current = {}
      pendingFontSizeRef.current = null
      pendingFontFamilyRef.current = null
      pendingFontColorRef.current = null
      pendingHighlightColorRef.current = null
      pendingCustomCssRef.current = null
      pendingAnchorRef.current = null
      recordVisualHtml(root.innerHTML, true)
      captureSelection()
      refreshMarkState()
    },
    [locked, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const handleVisualContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (locked) return
      if (!shouldOpenEditorContextMenu(event, lastVisualPointerTypeRef.current)) return
      event.preventDefault()
      event.stopPropagation()
      const root = visualRef.current
      if (!root) return
      restoreVisualRange(root)
      const img = closestImage(root, event.target as Node)
      const cell = closestCell(root, event.target as Node)
      if (cell && !cellsInSelection(root).includes(cell)) selectCellInDocument(root, cell)
      const tableFlags = {
        inTable: closestTable(root, event.target as Node) !== null,
        canMergeCells: canMergeCellsInDocument(root),
        canUnmergeCells: canUnmergeCellsInDocument(root),
      }
      if (img) {
        selectImageInDocument(root, img)
        captureSelection()
        setSelectedImage(img)
        setContextMenu({
          open: true,
          x: event.clientX,
          y: event.clientY,
          kind: 'image',
          ...tableFlags,
          inTable: closestTable(root, img) !== null,
        })
        return
      }
      const snapshot = snapshotSelection({
        mode: 'visual',
        visualEl: root,
        htmlEl: htmlAreaRef.current,
      })
      selectionRef.current = snapshot
      setContextMenu({
        open: true,
        x: event.clientX,
        y: event.clientY,
        kind: snapshot.collapsed ? 'caret' : 'text',
        ...tableFlags,
      })
    },
    [locked, captureSelection, restoreVisualRange],
  )

  const handleVisualPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      lastVisualPointerTypeRef.current = event.pointerType
      if (locked) return
      const root = visualRef.current
      if (!root) return
      const img = closestImage(root, event.target as Node)
      if (!img) {
        setSelectedImage(null)
        return
      }
      event.preventDefault()
      selectImageInDocument(root, img)
      captureSelection()
      setSelectedImage(img)
    },
    [locked, captureSelection],
  )

  const handleHistoryKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (locked) return
      if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (modeRef.current !== 'visual') return
        const root = visualRef.current
        if (!root) return
        const target = event.target
        if (!(target instanceof Node) || !root.contains(target)) return
        restoreVisualRange(root)
        const result = tabInTable(root, event.shiftKey)
        if (!result) return
        event.preventDefault()
        if (typeof result === 'object' && result.changed) {
          recordVisualHtml(root.innerHTML, false)
        }
        captureSelection()
        refreshMarkState()
        refreshTableState(root)
        return
      }
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (key === 'b' && !event.shiftKey) {
        event.preventDefault()
        commandContext.toggleFontMark('bold')
        return
      }
      if (key === 'i' && !event.shiftKey) {
        event.preventDefault()
        commandContext.toggleFontMark('italic')
        return
      }
      if (key === 'u' && !event.shiftKey) {
        event.preventDefault()
        commandContext.toggleFontMark('underline')
        return
      }
      if (key === 'x' && event.shiftKey) {
        event.preventDefault()
        commandContext.toggleFontMark('strikethrough')
        return
      }
      if (key === 'p' && !event.shiftKey) {
        event.preventDefault()
        commands.print()
      }
    },
    [locked, undo, redo, commandContext, commands, restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const rootClassName = [styles.root, chromeThemeProps(dark).className, fullscreen ? styles.fullscreen : '', className]
    .filter(Boolean)
    .join(' ')
  const rootStyle = editorChromeStyle({
    toolbarBackground,
    menuColor,
    menuBackground,
    menuFontSize,
    menuFontFamily,
    border,
  })
  const themeAttr = chromeThemeProps(dark)['data-wysiwyg-theme']

  return (
    <LocaleProvider locale={locale}>
      <ChromeThemeProvider dark={dark}>
      <div
        className={rootClassName}
        style={rootStyle}
        data-fullscreen={fullscreen ? '' : undefined}
        data-wysiwyg-theme={themeAttr}
        data-toolbar-position={toolbarPos}
        onKeyDown={handleHistoryKeyDown}
      >
        {menuVisible ? (
          <div className={styles.menuChrome} onPointerDownCapture={captureChromeSelection}>
            <EditorToolbar
              catalog={catalog}
              layout={layout}
              commands={commands}
              queries={queries}
              disabled={locked}
              menuVisible
              toolbarVisible={false}
            />
          </div>
        ) : null}
        <div
          className={styles.body}
          data-icon-dock={toolbarVisible ? toolbarPos : undefined}
        >
          {toolbarVisible && (toolbarPos === 'top' || toolbarPos === 'left') ? (
            <div className={styles.iconChrome} onPointerDownCapture={captureChromeSelection}>
              <EditorToolbar
                catalog={catalog}
                layout={layout}
                commands={commands}
                queries={queries}
                disabled={locked}
                menuVisible={false}
                toolbarVisible
                position={toolbarPos}
              />
            </div>
          ) : null}
          <div
            className={styles.workspace}
            onDragEnter={htmlFileDrop.onDragEnter}
            onDragOver={htmlFileDrop.onDragOver}
            onDragLeave={htmlFileDrop.onDragLeave}
            onDrop={htmlFileDrop.onDrop}
          >
            {mode === 'visual' ? (
              <VisualSurface
                ref={visualRef}
                html={extractFontStylesheets(html).body}
                onChange={(next) => recordVisualHtml(next, true)}
                onBeforeInput={handleVisualBeforeInput}
                onPointerDown={handleVisualPointerDown}
                onContextMenu={handleVisualContextMenu}
                placeholder={placeholder}
                disabled={locked}
              />
            ) : (
              <HtmlSurface
                ref={htmlAreaRef}
                html={html}
                onChange={(next) => recordHtml(next, true)}
                placeholder={placeholder}
                disabled={locked}
              />
            )}
            {htmlFileDrop.dragging ? <HtmlFileDropOverlay /> : null}
          </div>
          {toolbarVisible && (toolbarPos === 'bottom' || toolbarPos === 'right') ? (
            <div className={styles.iconChrome} onPointerDownCapture={captureChromeSelection}>
              <EditorToolbar
                catalog={catalog}
                layout={layout}
                commands={commands}
                queries={queries}
                disabled={locked}
                menuVisible={false}
                toolbarVisible
                position={toolbarPos}
              />
            </div>
          ) : null}
        </div>
        {fullscreen ? <ExitFullscreenButton onClick={() => setFullscreen(false)} /> : null}
        <CustomizeToolbarDialog
          open={customizeToolbarOpen}
          catalog={catalog}
          groups={allowedLayout.iconGroups}
          settings={toolbarSettings}
          loading={toolbarSettingsLoading}
          busy={toolbarSettingsBusy}
          disabled={locked}
          onChange={(next) => {
            void persistToolbarSettings(next)
          }}
          onReset={() => {
            void persistToolbarSettings(null)
          }}
          onClose={() => setCustomizeToolbarOpen(false)}
        />
        <DocumentPreviewDialog
          open={documentPreview.open}
          html={documentPreview.html}
          onClose={() => setDocumentPreview({ open: false, html: documentPreview.html })}
        />
        <FontPropertiesDialog
          open={fontDialog.open}
          tab={fontDialog.tab}
          size={fontSizeState.value}
          unit={fontSizeState.unit}
          marks={markState}
          fontFamily={fontFamilyState.value}
          fontFamilyMixed={fontFamilyState.mixed}
          fontColor={fontColorState.value}
          fontColorMixed={fontColorState.mixed}
          highlightColor={highlightColorState.value}
          highlightColorMixed={highlightColorState.mixed}
          fonts={fontFaces}
          disabled={locked}
          onTabChange={(tab) => setFontDialog({ open: true, tab })}
          onApply={(draft) => commandContext.applyFontProperties(draft)}
          onClose={() => setFontDialog({ open: false, tab: fontDialog.tab })}
        />
        <ParagraphPropertiesDialog
          open={paragraphDialog.open}
          tab={paragraphDialog.tab}
          value={paragraphDialog.value}
          disabled={locked}
          onTabChange={(tab) => setParagraphDialog({ ...paragraphDialog, open: true, tab })}
          onApply={(draft) => commandContext.applyParagraphProperties(draft)}
          onClose={() => setParagraphDialog({ ...paragraphDialog, open: false })}
        />
        <CustomCssDialog
          open={customCssDialog.open}
          value={customCssDialog.value}
          disabled={locked}
          onApply={(css) => commandContext.applyCustomCss(css)}
          onClose={() => setCustomCssDialog((prev) => ({ ...prev, open: false }))}
        />
        <PagePropertiesDialog
          open={pageDialog.open}
          tab={pageDialog.tab}
          value={pageDialog.value}
          fonts={fontFaces}
          disabled={locked}
          onTabChange={(tab) => setPageDialog({ ...pageDialog, open: true, tab })}
          onApply={(draft) => commandContext.applyPageProperties(draft)}
          onClose={() => setPageDialog({ ...pageDialog, open: false })}
        />
        <CustomParagraphStyleDialog
          open={customStyleDialog.open}
          mode={customStyleDialog.open ? customStyleDialog.mode : 'create'}
          styleId={customStyleDialog.open && customStyleDialog.mode === 'edit' ? customStyleDialog.style.id : undefined}
          name={customStyleDialog.open && customStyleDialog.mode === 'edit' ? customStyleDialog.style.name : ''}
          font={
            customStyleDialog.open
              ? customStyleDialog.mode === 'edit'
                ? customStyleDialog.style.font
                : customStyleDialog.font
              : {
                  size: null,
                  unit: DEFAULT_FONT_SIZE_UNIT,
                  marks: emptyFontMarkState(),
                  fontFamily: null,
                  fontColor: null,
                  highlightColor: null,
                }
          }
          paragraph={
            customStyleDialog.open
              ? customStyleDialog.mode === 'edit'
                ? customStyleDialog.style.paragraph
                : customStyleDialog.paragraph
              : undefined
          }
          canDelete={Boolean(onDeleteCustomParagraphStyle)}
          fonts={fontFaces}
          busy={customStyleBusy}
          disabled={locked}
          onSave={async (style) => {
            const save = onSaveCustomParagraphStyleRef.current
            if (!save) return
            setCustomStyleBusy(true)
            try {
              await save(style)
              setCustomStyleDialog({ open: false })
              await reloadCustomStyles()
            } finally {
              setCustomStyleBusy(false)
            }
          }}
          onDelete={async (id) => {
            const remove = onDeleteCustomParagraphStyleRef.current
            if (!remove) return
            setCustomStyleBusy(true)
            try {
              await remove(id)
              setCustomStyleDialog({ open: false })
              await reloadCustomStyles()
            } finally {
              setCustomStyleBusy(false)
            }
          }}
          onClose={() => setCustomStyleDialog({ open: false })}
        />
        <LinkDialog
          open={linkDialog.open}
          tab={linkDialog.tab}
          href={linkDialog.href}
          title={linkDialog.title}
          targetBlank={linkDialog.targetBlank}
          textDecorationNone={linkDialog.textDecorationNone}
          hoverMode={linkDialog.hoverMode}
          hoverColor={linkDialog.hoverColor}
          hoverHtml={linkDialog.hoverHtml}
          bookmarks={linkDialog.bookmarks}
          selectedBookmarkId={linkDialog.selectedBookmarkId}
          disabled={locked}
          onTabChange={(tab) => setLinkDialog({ ...linkDialog, open: true, tab })}
          onApply={(draft) => commandContext.applyLink(draft)}
          onClose={() => setLinkDialog({ ...linkDialog, open: false })}
        />
        <BookmarkDialog
          open={bookmarkDialog.open}
          existingIds={bookmarkDialog.existingIds}
          disabled={locked}
          onApply={(name) => commandContext.applyBookmark(name)}
          onClose={() => setBookmarkDialog({ ...bookmarkDialog, open: false })}
        />
        <ImageDialog
          open={imageDialog.open}
          disabled={locked}
          customImagePicker={customImagePicker}
          onApply={(draft) => commandContext.applyImage(draft)}
          onCustomPick={() => {
            setImageDialog({ open: false })
            customImagePicker?.onPick(insertCustomImage)
          }}
          onClose={() => setImageDialog({ open: false })}
        />
        <AudioDialog
          open={audioDialog.open}
          disabled={locked}
          customAudioPicker={customAudioPicker}
          onApply={(draft) => commandContext.applyAudio(draft)}
          onCustomPick={() => {
            setAudioDialog({ open: false })
            customAudioPicker?.onPick(insertCustomAudio)
          }}
          onClose={() => setAudioDialog({ open: false })}
        />
        <YoutubeDialog
          open={youtubeDialog.open}
          disabled={locked}
          customVideoPicker={customVideoPicker}
          onApply={(draft) => commandContext.applyYoutube(draft)}
          onCustomPick={() => {
            setYoutubeDialog({ open: false })
            customVideoPicker?.onPick(insertCustomVideo)
          }}
          onClose={() => setYoutubeDialog({ open: false })}
        />
        <ImagePropertiesDialog
          open={imageProperties.open}
          tab={imageProperties.tab}
          value={imageProperties.value}
          aspectRatio={imageProperties.aspectRatio}
          disabled={locked}
          onTabChange={(tab) => setImageProperties((prev) => ({ ...prev, tab }))}
          onApply={(draft) => commandContext.applyImageProperties(draft)}
          onClose={() => setImageProperties((prev) => ({ ...prev, open: false }))}
        />
        <TableDialog
          open={tableDialog.open}
          disabled={locked}
          onApply={(draft) => commandContext.applyTable(draft)}
          onClose={() => setTableDialog({ open: false })}
        />
        <TablePropertiesDialog
          open={tableProperties.open}
          value={tableProperties.value}
          disabled={locked}
          onApply={(draft) => commandContext.applyTableProperties(draft)}
          onClose={() => setTableProperties((prev) => ({ ...prev, open: false }))}
        />
        <CellPropertiesDialog
          open={cellProperties.open}
          value={cellProperties.value}
          disabled={locked}
          onApply={(draft) => commandContext.applyCellProperties(draft)}
          onClose={() => setCellProperties((prev) => ({ ...prev, open: false }))}
        />
        <RowPropertiesDialog
          open={rowProperties.open}
          value={rowProperties.value}
          disabled={locked}
          onApply={(draft) => commandContext.applyRowProperties(draft)}
          onClose={() => setRowProperties((prev) => ({ ...prev, open: false }))}
        />
        {mode === 'visual' && !locked && selectedImage?.isConnected ? (
          <ImageResizeOverlay
            img={selectedImage}
            onResize={handleImageResize}
            onResizeEnd={handleImageResizeEnd}
          />
        ) : null}
        <ContextMenu
          open={contextMenu.open}
          x={contextMenu.x}
          y={contextMenu.y}
          kind={contextMenu.kind}
          inTable={contextMenu.inTable}
          canMergeCells={contextMenu.canMergeCells}
          canUnmergeCells={contextMenu.canUnmergeCells}
          commands={commands}
          onClose={() => setContextMenu((prev) => ({ ...prev, open: false }))}
        />
      </div>
      </ChromeThemeProvider>
    </LocaleProvider>
  )
}

function editorChromeStyle({
  toolbarBackground,
  menuColor,
  menuBackground,
  menuFontSize,
  menuFontFamily,
  border,
}: Pick<
  EditorProps,
  | 'toolbarBackground'
  | 'menuColor'
  | 'menuBackground'
  | 'menuFontSize'
  | 'menuFontFamily'
  | 'border'
>): CSSProperties | undefined {
  const style: Record<string, string> = {}
  if (toolbarBackground) style['--wysiwyg-toolbar-background'] = toolbarBackground
  if (menuColor) style['--wysiwyg-menu-color'] = menuColor
  if (menuBackground) style['--wysiwyg-menu-background'] = menuBackground
  if (menuFontSize) style['--wysiwyg-menu-font-size'] = menuFontSize
  if (menuFontFamily) style['--wysiwyg-menu-font-family'] = menuFontFamily
  if (border === 'none') {
    style['--wysiwyg-border-width'] = '0'
    style['--wysiwyg-border-radius'] = '0'
    style['--wysiwyg-border-shadow'] = 'none'
  } else if (border) {
    if (border.width) style['--wysiwyg-border-width'] = border.width
    if (border.color) style['--wysiwyg-border-color'] = border.color
    if (border.radius) style['--wysiwyg-border-radius'] = border.radius
    if (border.shadow) style['--wysiwyg-border-shadow'] = border.shadow
  }
  return Object.keys(style).length ? (style as CSSProperties) : undefined
}

function ExitFullscreenButton({ onClick }: { onClick: () => void }) {
  const t = useT()
  return (
    <button
      type="button"
      className={styles.exitFullscreen}
      aria-label={t('exitFullscreenAria')}
      onClick={onClick}
    >
      <CloseIcon className={styles.exitFullscreenIcon} />
    </button>
  )
}

function HtmlFileDropOverlay() {
  const t = useT()
  return (
    <div className={styles.htmlFileDropOverlay} aria-hidden="true">
      {t('htmlFileDropOverlay')}
    </div>
  )
}
