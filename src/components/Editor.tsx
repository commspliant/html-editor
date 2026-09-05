import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { createCustomActionCommands, mergeCustomActions } from '../core/customActions'
import { createEditorCommands, createEditorQueries } from '../core/commands'
import type { CommandContext, AudioApply, FontDialogTab, FontPropertiesApply, ImageApply, ImageDialogTab, ImagePropertiesApply, LinkApply, LinkDialogTab, PageDialogTab, PagePropertiesApply, ParagraphDialogTab, ParagraphPropertiesApply, TableApply, TablePropertiesApply, CellPropertiesApply, RowPropertiesApply, YoutubeApply } from '../core/commandTypes'
import type { PageBackgroundImageApply } from '../core/pageBackgroundImage'
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
  applyParagraphBackgroundImageInDocument,
  queryParagraphBackgroundImage,
} from '../core/paragraphBackgroundImage'
import { collectSelectedBlocks } from '../core/blocks'
import {
  emptyPageBackgroundImageApply,
  normalizePageBackgroundLayerInHolder,
  repairPageBackgroundHtmlIfNeeded,
} from '../core/pageBackgroundImage'
import {
  applyDefaultPagePropertiesToPageHtml,
  applyPagePropertiesInDocument,
  emptyPagePropertiesApply,
  queryPageProperties,
  resetPageAtRuleInDocument,
} from '../core/pageProperties'
import {
  emptyPageAtRuleApply,
  preservePageAtRuleInBody,
  queryPageAtRule,
  stripPageAtRuleFromHtml,
} from '../core/pageAtRule'
import { stripPageChromeFromPageHtml } from '../core/stripPageChrome'
import {
  buildPageHtmlWithMarginPx,
  previewPageCanvasMargins,
  probePageCanvasDimensions,
  syncPageCanvasLayout,
  type PageMarginSidesPx,
} from '../core/pageCanvasLayout'
import { normalizeCaretInPageShell } from '../core/page'
import { createPageZoomMeasureScheduler, resolvePageZoomScale } from '../core/pageZoom'
import {
  joinPagesToHtml,
  normalizePages,
  pagesArraysEqual,
  closestPageSurface,
  PAGE_SURFACE_ATTR,
  queryPageSurface,
  queryPageSurfaceIndex,
  splitPagesFromHtml,
  emptyPageHtml,
  updatePageAt,
} from '../core/multiPage'
import { sanitizeDocumentHtml } from '../core/sanitizeHtml'
import {
  queryTextAlign,
  setTextAlignInDocument,
  type TextAlign,
  type TextAlignQuery,
} from '../core/textAlign'
import {
  collectDocumentFontStylesheets,
  extractFontStylesheets,
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
  htmlFromSnapshotRange,
  insertAtSelection,
  rangeToRestore,
  replaceRangeContents,
  resolvePinnedBodySelection,
  resolveActionSnapshot,
  resolveVisualInsertRange,
  shouldKeepStoredVisualSelection,
  snapshotSelection,
  type SelectionSnapshot,
} from '../core/selection'
import { applyLinkInDocument, defaultLinkAttrs, isLinkActive, queryLinkAtSelection } from '../core/link'
import { insertBookmarkInDocument, listBookmarks } from '../core/bookmark'
import {
  applyCommentAnchor,
  commentThreadElementAtPoint,
  selectCommentThreadAnchor,
  setCommentHighlightsVisible,
  snapshotCommentAnchor,
  threadIdAtSelection,
} from '../core/comments/anchors'
import {
  addMessageToThread,
  createCommentMessage,
  createCommentThread,
} from '../core/comments/threads'
import {
  copySelectionInDocument,
  cutSelectionInDocument,
  deleteSelectionInDocument,
} from '../core/clipboard'
import { clearFormattingInDocument } from '../core/clearFormatting'
import {
  applyCopiedFormat,
  selectionRangesEqual,
  snapshotFormatFromRoot,
  type CopiedFormat,
} from '../core/formatBrush'
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
import { documentsCanonicallyEqual } from '../core/documentEquality'
import { createImageRegistry, type ImageRegistry } from '../core/imageRegistry'
import { syncVisualBodyHtml } from '../core/visualBodySync'
import { insertYoutubeInDocument, insertVideoInDocument } from '../core/youtube'
import { insertHorizontalRuleInDocument } from '../core/horizontalRule'
import { insertPageBreakInDocument } from '../core/pageBreak'
import { writeImagePixelSize } from '../core/imageResize'
import {
  applyImagePropertiesInDocument,
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
  queryTableAtSelection,
} from '../core/tableProperties'
import {
  applyCellPropertiesInDocument,
  queryCellAtSelection,
} from '../core/cellProperties'
import {
  applyRowPropertiesInDocument,
  queryRowAtSelection,
} from '../core/rowProperties'
import { useAutoSave } from '../hooks/useAutoSave'
import { useEditorDialogState } from '../hooks/useEditorDialogState'
import { usePageStore } from '../hooks/usePageStore'
import { useControllableState } from '../hooks/useControllableState'
import { ChromeThemeProvider, chromeThemeProps } from '../chrome/ChromeTheme'
import { CloseIcon } from '../icons'
import { LocaleProvider, useT } from '../i18n/LocaleProvider'
import {
  readDarkModeFromStorage,
  writeDarkModeToStorage,
} from '../modules/view/darkModePersistence'
import {
  readPageZoomFromStorage,
  writePageZoomToStorage,
} from '../modules/view/pageZoomPersistence'
import {
  parseToolbarPosition,
  readToolbarPositionFromStorage,
  writeToolbarPositionToStorage,
} from '../modules/view/toolbarPositionPersistence'
import { shouldOpenEditorContextMenu, type ContextMenuKind } from '../modules/contextMenu'
import { CapabilitiesProvider } from '../capabilities/CapabilitiesContext'
import {
  filterCapabilitiesLayout,
  isToolbarItemAllowedByCapabilities,
  resolveEditorCapabilities,
  validatePagesAgainstCapabilities,
  isPageLayoutAllowed,
  type CapabilityValidationResult,
  type RenderingCapabilities,
} from '../capabilities'
import {
  mergeCapabilitiesCatalog,
  mergeCapabilitiesLayout,
} from '../modules/capabilities'
import { useHtmlFileDrop } from '../modules/file/useHtmlFileDrop'
import {
  createDocumentHistory,
  createMultiPageHistory,
  isMultiPageHistory,
  type DocumentHistory,
  type MultiPageHistory,
} from '../modules/history'
import { defaultToolbarCatalog, defaultToolbarLayout } from '../toolbar'
import { filterAllowedChrome } from '../toolbar/allowedChrome'
import {
  mergeCommentsCatalog,
  mergeCommentsLayout,
  type ChromeLockOptions,
} from '../toolbar/commentsChrome'
import { filterMultiPageLayout } from '../toolbar/multiPageChrome'
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
  CustomVideoInsert,
  EditorMode,
  EditorProps,
  PageZoomPreset,
  ToolbarCustomization,
  ToolbarPosition,
} from '../types'
import { type MultiPageVisualSurfaceHandle } from './MultiPageVisualSurface'
import {
  createMultiPageRulerMarginChangeHandler,
  createMultiPageRulerMarginPreviewHandler,
  createRulerIndentChangeHandler,
  createRulerMarginChangeHandler,
  createRulerMarginPreviewHandler,
} from './rulerDocumentHandlers'
import styles from './Editor.module.css'
import { EditorChrome } from './EditorChrome'
import { EditorWorkspaceFrame } from './EditorWorkspaceFrame'
import { createToolbarQueryRevisions } from '../toolbar/toolbarQueryRevisions'
import { buildToolbarShellProps } from '../toolbar/toolbarShellProps'
import { EditorShellProvider } from './EditorShellContext'
import { EditorWorkspaceHost, type EditorWorkspaceHandlers } from './EditorWorkspaceHost'
import type { EditorDocumentBridgeRef } from './editorDocumentBridgeTypes'

const PAGE_ZOOM_MEASURE_EPSILON = 0.005

export function Editor({
  value,
  defaultValue = '',
  onChange,
  onAutoSave,
  onSave,
  onOpen,
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
  workspaceBackground,
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
  sanitizeHtml = true,
  loadCustomParagraphStyles,
  onSaveCustomParagraphStyle,
  onDeleteCustomParagraphStyle,
  customImagePicker,
  disableBuiltinImageInsert,
  customBackgroundImagePicker,
  disableBuiltinBackgroundImageInsert,
  disableBuiltinBackgroundImageSources,
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
  enablePageProperties = false,
  defaultPageProperties,
  optimizeEmbeddedImages = false,
  enableMultiPages = false,
  pages: pagesProp,
  defaultPages,
  onPagesChange,
  defaultRulerVisible = true,
  rulerUnit = 'in',
  enableComments = false,
  defaultCommentsVisible = true,
  commentAuthor,
  comments: commentsProp,
  defaultComments = [],
  onCommentsChange,
  renderingCapabilities,
  onCapabilitiesValidation,
}: EditorProps) {
  const contentLocked = Boolean(disabled || readOnly)
  const chromeDisabled = Boolean(disabled)
  const pageLayoutAllowed = renderingCapabilities
    ? isPageLayoutAllowed(renderingCapabilities)
    : true
  const isControlledContent = enableMultiPages ? pagesProp !== undefined : value !== undefined
  const rawInitialPages = normalizePages(
    defaultPages ?? (defaultValue.trim() ? [defaultValue] : [emptyPageHtml()]),
  )
  let initialPages = rawInitialPages
  if (!isControlledContent && defaultPageProperties && pageLayoutAllowed) {
    initialPages = rawInitialPages.map((page) =>
      applyDefaultPagePropertiesToPageHtml(page, defaultPageProperties),
    )
  }
  if (!pageLayoutAllowed) {
    initialPages = initialPages.map(stripPageChromeFromPageHtml)
  }
  const imageRegistryRef = useRef<ImageRegistry | null>(null)
  if (optimizeEmbeddedImages && imageRegistryRef.current === null) {
    imageRegistryRef.current = createImageRegistry()
  }
  const storedInitialPagesRef = useRef<string[] | null>(null)
  if (storedInitialPagesRef.current === null) {
    storedInitialPagesRef.current =
      optimizeEmbeddedImages && imageRegistryRef.current
        ? initialPages.map((page) => imageRegistryRef.current!.externalizeHtml(page))
        : [...initialPages]
  }
  const initialHtmlRaw = enableMultiPages
    ? joinPagesToHtml(storedInitialPagesRef.current)
    : (storedInitialPagesRef.current[0] ?? '')
  const initialHtml = sanitizeHtml ? sanitizeDocumentHtml(initialHtmlRaw) : initialHtmlRaw
  const controlledHtmlRaw =
    enableMultiPages && pagesProp !== undefined ? joinPagesToHtml(normalizePages(pagesProp)) : value
  const controlledHtml = useMemo(() => {
    if (controlledHtmlRaw === undefined) return undefined
    return sanitizeHtml ? sanitizeDocumentHtml(controlledHtmlRaw) : controlledHtmlRaw
  }, [controlledHtmlRaw, sanitizeHtml])
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const optimizeEmbeddedImagesRef = useRef(optimizeEmbeddedImages)
  optimizeEmbeddedImagesRef.current = optimizeEmbeddedImages
  const externalizeStorageHtml = useCallback((html: string) => {
    if (!optimizeEmbeddedImagesRef.current || !imageRegistryRef.current) return html
    return imageRegistryRef.current.externalizeHtml(html)
  }, [])
  const hydrateExportHtml = useCallback((html: string) => {
    if (!optimizeEmbeddedImagesRef.current || !imageRegistryRef.current) return html
    return imageRegistryRef.current.hydrateHtml(html)
  }, [])
  const hydrateExportPages = useCallback(
    (pages: readonly string[]) => pages.map((page) => hydrateExportHtml(page)),
    [hydrateExportHtml],
  )
  const resolveEmbeddedImageDataUrl = useCallback(
    (id: string) => imageRegistryRef.current?.getDataUrl(id) ?? null,
    [],
  )
  const notifyHtmlChange = useCallback(
    (storedHtml: string) => {
      onChangeRef.current?.(hydrateExportHtml(storedHtml))
    },
    [hydrateExportHtml],
  )
  const [storageHtmlInitial] = useState(() => {
    if (optimizeEmbeddedImages && value !== undefined && !enableMultiPages) {
      const raw = sanitizeHtml ? sanitizeDocumentHtml(value) : value
      if (imageRegistryRef.current) {
        return imageRegistryRef.current.externalizeHtml(raw)
      }
      return raw
    }
    return initialHtml
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
  const [commentsVisible, setCommentsVisible] = useState(defaultCommentsVisible)
  const [rulerVisible, setRulerVisible] = useState(defaultRulerVisible)
  const rulerVisibleRef = useRef(rulerVisible)
  rulerVisibleRef.current = rulerVisible
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [commentThreads, setCommentThreadsState] = useControllableState({
    value: commentsProp,
    defaultValue: defaultComments,
    onChange: onCommentsChange,
  })
  const visualRootRef = useRef<HTMLElement | null>(null)
  const visualPropSyncGuardRef = useRef<(() => void) | null>(null)
  const commentPanelRef = useRef<HTMLDivElement | null>(null)
  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const multiPageVisualRef = useRef<MultiPageVisualSurfaceHandle>(null)
  const suppressPageFlushRef = useRef(false)
  const pendingInsertPageFocusRef = useRef<number | null>(null)
  const htmlAreaRef = useRef<HTMLTextAreaElement>(null)
  const enableMultiPagesRef = useRef(enableMultiPages)
  enableMultiPagesRef.current = enableMultiPages
  const defaultPagePropertiesRef = useRef(defaultPageProperties)
  defaultPagePropertiesRef.current = defaultPageProperties
  const pageLayoutAllowedRef = useRef(pageLayoutAllowed)
  pageLayoutAllowedRef.current = pageLayoutAllowed
  const enableCommentsRef = useRef(enableComments)
  enableCommentsRef.current = enableComments
  const readOnlyRef = useRef(readOnly)
  readOnlyRef.current = readOnly
  const contentLockedRef = useRef(contentLocked)
  contentLockedRef.current = contentLocked
  const commentsVisibleRef = useRef(commentsVisible)
  commentsVisibleRef.current = commentsVisible
  const commentThreadsRef = useRef(commentThreads)
  commentThreadsRef.current = commentThreads
  const onPagesChangeRef = useRef(onPagesChange)
  onPagesChangeRef.current = onPagesChange
  const pendingPagesNotifyRef = useRef<{
    pages: string[]
    activePageIndex: number
  } | null>(null)
  const pagesNotifyScheduledRef = useRef(false)
  const flushPagesChangeNotify = useCallback(() => {
    pagesNotifyScheduledRef.current = false
    const pending = pendingPagesNotifyRef.current
    pendingPagesNotifyRef.current = null
    if (!pending) return
    onPagesChangeRef.current?.(pending.pages, pending.activePageIndex)
  }, [])
  const schedulePagesChange = useCallback(
    (pages: readonly string[], activePageIndex: number) => {
      pendingPagesNotifyRef.current = {
        pages: [...pages],
        activePageIndex,
      }
      if (pagesNotifyScheduledRef.current) return
      pagesNotifyScheduledRef.current = true
      queueMicrotask(flushPagesChangeNotify)
    },
    [flushPagesChangeNotify],
  )
  const pagesPropRef = useRef(pagesProp)
  pagesPropRef.current = pagesProp
  const ingestedPagesProp = useMemo(() => {
    if (!optimizeEmbeddedImages || pagesProp === undefined) return pagesProp
    return normalizePages(pagesProp).map((page) => {
      const sanitized = sanitizeHtml ? sanitizeDocumentHtml(page) : page
      return imageRegistryRef.current?.externalizeHtml(sanitized) ?? sanitized
    })
  }, [optimizeEmbeddedImages, pagesProp, sanitizeHtml])
  const pageStore = usePageStore({
    enabled: enableMultiPages,
    pagesProp: ingestedPagesProp,
    defaultPages: storedInitialPagesRef.current ?? [emptyPageHtml()],
  })
  const documentBridgeRef = useRef<EditorDocumentBridgeRef['current']>(null)
  const workspaceHandlersRef = useRef<EditorWorkspaceHandlers>(null!)
  const [activePageIndex, setActivePageIndex] = useState(0)
  const activePageIndexRef = useRef(activePageIndex)
  activePageIndexRef.current = activePageIndex
  const htmlModePageHtmlRef = useRef(
    enableMultiPages ? (storedInitialPagesRef.current?.[0] ?? '') : '',
  )
  const htmlModeDirtyRef = useRef(false)
  const [hasSelectedPage, setHasSelectedPage] = useState(false)
  const hasSelectedPageRef = useRef(hasSelectedPage)
  hasSelectedPageRef.current = hasSelectedPage
  const [historyRevision, setHistoryRevision] = useState(0)
  const historyCanUndoRef = useRef(false)
  const historyCanRedoRef = useRef(false)
  const toolbarQueryRevisions = useMemo(() => createToolbarQueryRevisions(), [])
  const historyRef = useRef<DocumentHistory | MultiPageHistory | null>(null)
  if (historyRef.current === null) {
    historyRef.current = enableMultiPages
      ? createMultiPageHistory(storedInitialPagesRef.current ?? [emptyPageHtml()])
      : createDocumentHistory(externalizeStorageHtml(initialHtml))
  }
  const history = historyRef.current
  const bumpHistoryChromeIfNeeded = useCallback(() => {
    const canUndo = history.canUndo()
    const canRedo = history.canRedo()
    if (canUndo === historyCanUndoRef.current && canRedo === historyCanRedoRef.current) {
      return
    }
    historyCanUndoRef.current = canUndo
    historyCanRedoRef.current = canRedo
    setHistoryRevision((revision) => revision + 1)
  }, [history])
  const htmlRef = useRef(initialHtml)
  const pagesRef = useRef<string[]>(storedInitialPagesRef.current ?? [emptyPageHtml()])
  if (enableMultiPages) {
    pagesRef.current = pageStore.pages
  }
  const activePageHtmlRef = useRef('')
  const pageCanvasSizedRef = useRef(false)
  const documentDirtyRef = useRef(true)
  const autoSaveSnapshotRef = useRef('')
  const selectionRefreshRafRef = useRef<number | null>(null)
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
  const sanitizeHtmlRef = useRef(sanitizeHtml)
  sanitizeHtmlRef.current = sanitizeHtml
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
  const [formatBrushActiveState, setFormatBrushActiveState] = useState(false)
  const formatBrushActiveRef = useRef(formatBrushActiveState)
  formatBrushActiveRef.current = formatBrushActiveState
  const copiedFormatRef = useRef<CopiedFormat | null>(null)
  const formatBrushSourceRef = useRef<SelectionSnapshot | null>(null)
  const [linkActive, setLinkActive] = useState(false)
  const linkActiveRef = useRef(linkActive)
  linkActiveRef.current = linkActive
  const {
    fontDialog,
    setFontDialog,
    customizeToolbarOpen,
    setCustomizeToolbarOpen,
    documentPreview,
    setDocumentPreview,
    toolbarSettings,
    setToolbarSettings,
    toolbarSettingsLoading,
    setToolbarSettingsLoading,
    toolbarSettingsBusy,
    setToolbarSettingsBusy,
    paragraphDialog,
    setParagraphDialog,
    customCssDialog,
    setCustomCssDialog,
    pageDialog,
    setPageDialog,
    deletePageConfirmOpen,
    setDeletePageConfirmOpen,
    customStyleDialog,
    setCustomStyleDialog,
    linkDialog,
    setLinkDialog,
    bookmarkDialog,
    setBookmarkDialog,
    imageDialog,
    setImageDialog,
    audioDialog,
    setAudioDialog,
    youtubeDialog,
    setYoutubeDialog,
    imageProperties,
    setImageProperties,
    tableDialog,
    setTableDialog,
    tableProperties,
    setTableProperties,
    cellProperties,
    setCellProperties,
    rowProperties,
    setRowProperties,
    helpDialog,
    setHelpDialog,
    aboutDialogOpen,
    setAboutDialogOpen,
  } = useEditorDialogState()
  const [compatibilityPanelOpen, setCompatibilityPanelOpen] = useState(false)
  const [capabilitiesValidation, setCapabilitiesValidation] = useState<CapabilityValidationResult | null>(null)
  const onCapabilitiesValidationRef = useRef(onCapabilitiesValidation)
  onCapabilitiesValidationRef.current = onCapabilitiesValidation
  const capabilityProfile = useMemo(
    () => (renderingCapabilities ? resolveEditorCapabilities(renderingCapabilities) : undefined),
    [renderingCapabilities],
  )
  const [dark, setDark] = useState(() => {
    if (darkModePersistence) return darkMode
    return readDarkModeFromStorage() ?? darkMode
  })
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition>(() => {
    if (toolbarPositionPersistence) return toolbarPosition
    return readToolbarPositionFromStorage() ?? toolbarPosition
  })
  const [pageZoom, setPageZoom] = useState<PageZoomPreset>(
    () => readPageZoomFromStorage() ?? 'fitWidth',
  )
  const [pageZoomScale, setPageZoomScale] = useState(1)
  const [customStyles, setCustomStyles] = useState<CustomParagraphStyle[]>([])
  const [customStylesLoading, setCustomStylesLoading] = useState(false)
  const [customStyleBusy, setCustomStyleBusy] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    x: number
    y: number
    kind: ContextMenuKind
    inTable: boolean
    canMergeCells: boolean
    canUnmergeCells: boolean
    canDeletePage: boolean
    canAddComment: boolean
  }>({
    open: false,
    x: 0,
    y: 0,
    kind: 'caret',
    inTable: false,
    canMergeCells: false,
    canUnmergeCells: false,
    canDeletePage: false,
    canAddComment: false,
  })
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
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen
  const customImagePickerRef = useRef(customImagePicker)
  customImagePickerRef.current = customImagePicker
  const resolvedBackgroundImagePicker =
    customBackgroundImagePicker ?? customImagePicker
  const resolvedDisableBuiltinBackgroundImageInsert =
    disableBuiltinBackgroundImageInsert ?? disableBuiltinImageInsert ?? false
  const resolvedDisableBuiltinBackgroundImageSources =
    disableBuiltinBackgroundImageSources ?? disableBuiltinImageInsert ?? false
  const customBackgroundImagePickerRef = useRef(resolvedBackgroundImagePicker)
  customBackgroundImagePickerRef.current = resolvedBackgroundImagePicker
  const disableBuiltinBackgroundImageInsertRef = useRef(
    resolvedDisableBuiltinBackgroundImageInsert,
  )
  disableBuiltinBackgroundImageInsertRef.current = resolvedDisableBuiltinBackgroundImageInsert
  const disableBuiltinBackgroundImageSourcesRef = useRef(
    resolvedDisableBuiltinBackgroundImageSources,
  )
  disableBuiltinBackgroundImageSourcesRef.current = resolvedDisableBuiltinBackgroundImageSources
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
  const pageZoomRef = useRef(pageZoom)
  pageZoomRef.current = pageZoom
  const pageZoomScaleRef = useRef(pageZoomScale)
  pageZoomScaleRef.current = pageZoomScale
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
  const getActiveVisualRoot = useCallback((): HTMLElement | null => {
    if (enableMultiPagesRef.current) {
      const surface = multiPageVisualRef.current?.getActivePageRoot()
      if (surface instanceof HTMLElement) return surface
    }
    return visualRootRef.current
  }, [])
  const resolveSelectedPageIndex = useCallback((): number | null => {
    const surface = visualRootRef.current
    if (surface?.hasAttribute(PAGE_SURFACE_ATTR)) {
      const index = queryPageSurfaceIndex(surface)
      if (index !== null) return index
    }
    const fromMulti = multiPageVisualRef.current?.getActivePageIndex()
    if (typeof fromMulti === 'number') return fromMulti
    return activePageIndexRef.current
  }, [])
  const resolveActiveVisualRoot = useCallback((): HTMLElement | null => {
    if (enableMultiPagesRef.current) {
      const multi = multiPageVisualRef.current
      if (!multi) return null
      const index = resolveSelectedPageIndex()
      if (index === null) return null
      multi.ensurePageMounted(index)
      const container = multi.getContainer()
      const surface = container ? queryPageSurface(container, index) : null
      if (surface instanceof HTMLDivElement) {
        visualRootRef.current = surface
        return surface
      }
      return null
    }
    return visualRootRef.current
  }, [resolveSelectedPageIndex])
  const resolveActivePageHtml = useCallback((): string => {
    if (!enableMultiPagesRef.current) return htmlRef.current
    const index = resolveSelectedPageIndex() ?? activePageIndexRef.current
    return pagesRef.current[index] ?? ''
  }, [resolveSelectedPageIndex])
  useLayoutEffect(() => {
    if (!enableMultiPages) return
    const surface = multiPageVisualRef.current?.getActivePageRoot()
    if (surface instanceof HTMLDivElement) {
      visualRootRef.current = surface
    }
  }, [enableMultiPages, activePageIndex])
  const measurePageZoomRef = useRef<() => void>(() => {})
  const measuringPageZoomRef = useRef(false)

  const measurePageZoom = useCallback(() => {
    if (measuringPageZoomRef.current) return
    if (modeRef.current !== 'visual') return
    const workspace = workspaceRef.current
    if (!workspace) return

    measuringPageZoomRef.current = true
    try {
      const workspaceStyle = getComputedStyle(workspace)
      const padX =
        parseFloat(workspaceStyle.paddingLeft) + parseFloat(workspaceStyle.paddingRight)
      const padY =
        parseFloat(workspaceStyle.paddingTop) + parseFloat(workspaceStyle.paddingBottom)
      const availW = Math.max(0, workspace.clientWidth - padX)
      const availH = Math.max(0, workspace.clientHeight - padY)

      let pageW = 0
      let pageH = 0

      if (pageCanvasSizedRef.current) {
        const probed = probePageCanvasDimensions(queryPageAtRule(activePageHtmlRef.current))
        if (probed) {
          pageW = probed.width
          pageH = probed.height
        }
      } else {
        const surface = getActiveVisualRoot()
        const zoom = pageZoomScaleRef.current > 0 ? pageZoomScaleRef.current : 1
        pageW = (surface?.offsetWidth ?? 0) / zoom
        pageH = (surface?.offsetHeight ?? 0) / zoom
      }

      if (pageW <= 0) pageW = availW
      if (pageH <= 0) pageH = availH

      const nextScale = resolvePageZoomScale(
        pageZoomRef.current,
        availW,
        availH,
        pageW,
        pageH,
      )
      if (Math.abs(nextScale - pageZoomScaleRef.current) >= PAGE_ZOOM_MEASURE_EPSILON) {
        setPageZoomScale(nextScale)
      }
    } finally {
      measuringPageZoomRef.current = false
    }
  }, [getActiveVisualRoot])

  measurePageZoomRef.current = measurePageZoom

  useLayoutEffect(() => {
    if (mode !== 'visual') return
    const surface = getActiveVisualRoot()
    if (!surface || surface !== document.activeElement) return
    normalizeCaretInPageShell(surface)
  }, [mode, activePageIndex, getActiveVisualRoot])

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

  const persistPageZoom = useCallback((next: PageZoomPreset) => {
    pageZoomRef.current = next
    setPageZoom(next)
    writePageZoomToStorage(next)
    const workspace = workspaceRef.current
    if (workspace) {
      workspace.scrollTop = 0
      workspace.scrollLeft = 0
    }
    measurePageZoomRef.current()
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

  useLayoutEffect(() => {
    measurePageZoomRef.current()
    if (mode !== 'visual') return
    const workspace = workspaceRef.current
    if (!workspace || typeof ResizeObserver === 'undefined') return

    const scheduler = createPageZoomMeasureScheduler(() => {
      measurePageZoomRef.current()
    })
    const observer = new ResizeObserver(() => {
      scheduler.schedule()
    })
    observer.observe(workspace)
    return () => {
      observer.disconnect()
      scheduler.cancel()
    }
  }, [mode, activePageIndex, pageZoom, enableMultiPages])

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
    (next: string, options?: { fullReplace?: boolean }) => {
      const sanitized = sanitizeHtmlRef.current ? sanitizeDocumentHtml(next) : next
      const transformed = transformHtmlRef.current?.(sanitized) ?? sanitized
      const canonicallyEqual = documentsCanonicallyEqual(
        htmlRef.current,
        transformed,
        hydrateExportHtml,
      )
      if (options?.fullReplace && !canonicallyEqual && optimizeEmbeddedImagesRef.current) {
        imageRegistryRef.current?.clear()
      }
      const stored = externalizeStorageHtml(transformed)
      if (canonicallyEqual) {
        htmlRef.current = stored
        return { stored, stateUpdated: false }
      }
      if (stored !== htmlRef.current) {
        documentDirtyRef.current = true
      }
      const bridge = documentBridgeRef.current
      if (enableMultiPagesRef.current) {
        const pageStoreHandle = pageStore
        if (!pageStoreHandle) {
          htmlRef.current = stored
          return { stored, stateUpdated: false }
        }
        const result = pageStoreHandle.replacePages(splitPagesFromHtml(stored))
        htmlRef.current = result.joined
        pagesRef.current = result.pages
        if (modeRef.current === 'html' && !optimizeEmbeddedImagesRef.current) {
          bridge?.setHtml(stored)
        }
        schedulePagesChange(
          hydrateExportPages(result.pages),
          activePageIndexRef.current,
        )
        return { stored, stateUpdated: true }
      }
      if (optimizeEmbeddedImagesRef.current) {
        htmlRef.current = stored
        bridge?.setStorageHtml(stored)
        notifyHtmlChange(stored)
        return { stored, stateUpdated: true }
      }
      htmlRef.current = stored
      bridge?.setHtml(stored)
      return { stored, stateUpdated: true }
    },
    [externalizeStorageHtml, hydrateExportHtml, hydrateExportPages, notifyHtmlChange, schedulePagesChange],
  )

  const commitPages = useCallback(
    (
      nextPages: readonly string[],
      coalesce: boolean,
      editedIndex?: number,
      options?: { skipHistory?: boolean },
    ) => {
      const storedPages = nextPages.map((page) => externalizeStorageHtml(page))
      const pageStoreHandle = pageStore
      if (!pageStoreHandle) return joinPagesToHtml(storedPages)
      const result = pageStoreHandle.setPages(storedPages, { editedIndex })
      if (!result.changed) {
        return result.joined
      }
      pagesRef.current = result.pages
      documentDirtyRef.current = true
      htmlRef.current = result.joined
      if (
        pagesPropRef.current === undefined &&
        modeRef.current === 'html' &&
        !optimizeEmbeddedImagesRef.current
      ) {
        documentBridgeRef.current?.setHtml(result.joined)
      }
      schedulePagesChange(
        hydrateExportPages(result.pages),
        activePageIndexRef.current,
      )
      if (!options?.skipHistory && isMultiPageHistory(history)) {
        const { changedIndices, pages } = result
        if (changedIndices.length === 1) {
          const index = editedIndex ?? changedIndices[0]!
          history.recordPageEdit(index, pages[index] ?? '', { coalesce })
        } else if (changedIndices.length > 1) {
          history.recordReplaceAll(pages)
        } else if (editedIndex !== undefined) {
          history.recordPageEdit(editedIndex, pages[editedIndex] ?? '', { coalesce })
        } else {
          history.recordReplaceAll(pages)
        }
      }
      bumpHistoryChromeIfNeeded()
      return result.joined
    },
    [bumpHistoryChromeIfNeeded, externalizeStorageHtml, hydrateExportPages, history, pageStore, schedulePagesChange],
  )

  const syncVisualDocumentFromStorage = useCallback(
    (stored: string) => {
      if (modeRef.current !== 'visual') return
      const resolveDataUrl = optimizeEmbeddedImagesRef.current
        ? (id: string) => imageRegistryRef.current?.getDataUrl(id) ?? null
        : undefined
      const hydrate = optimizeEmbeddedImagesRef.current ? hydrateExportHtml : undefined
      visualPropSyncGuardRef.current?.()

      if (enableMultiPagesRef.current) {
        const container = multiPageVisualRef.current?.getContainer()
        if (!container) return
        const pages = splitPagesFromHtml(stored)
        for (let index = 0; index < pages.length; index += 1) {
          const surface = queryPageSurface(container, index)
          if (!surface) continue
          const body = stripPageAtRuleFromHtml(extractFontStylesheets(pages[index] ?? '').body)
          syncVisualBodyHtml(surface, body, {
            resolveDataUrl,
            hydrateEmbeddedImages: hydrate,
          })
        }
        return
      }

      const el = visualRootRef.current
      if (!el) return
      const body = stripPageAtRuleFromHtml(extractFontStylesheets(stored).body)
      syncVisualBodyHtml(el, body, {
        resolveDataUrl,
        hydrateEmbeddedImages: hydrate,
      })
    },
    [hydrateExportHtml],
  )

  const recordHtml = useCallback(
    (next: string, coalesce: boolean) => {
      const { stored, stateUpdated } = commitHtml(next, { fullReplace: !coalesce })
      if (!coalesce && stateUpdated) {
        syncVisualDocumentFromStorage(stored)
      }
      if (isMultiPageHistory(history)) {
        history.recordReplaceAll(splitPagesFromHtml(stored))
      } else {
        history.record(stored, { coalesce })
      }
      bumpHistoryChromeIfNeeded()
      return stored
    },
    [bumpHistoryChromeIfNeeded, commitHtml, history, syncVisualDocumentFromStorage],
  )

  const onHtmlFileDrop = useCallback(
    (next: string) => {
      if (enableMultiPagesRef.current) {
        const index = activePageIndexRef.current
        const currentPages = pagesRef.current
        const nextPages = currentPages.slice()
        nextPages[index] = next
        commitPages(nextPages, false, index)
        return
      }
      recordHtml(next, false)
    },
    [commitPages, recordHtml],
  )
  const htmlFileDrop = useHtmlFileDrop({
    enabled: !contentLocked && !disableHtmlFileDrop,
    onHtml: onHtmlFileDrop,
  })

  const recordVisualHtml = useCallback(
    (body: string, coalesce: boolean) => {
      visualPropSyncGuardRef.current?.()
      return recordHtml(
        prependFontStylesheets(
          body,
          collectDocumentFontStylesheets(body, htmlRef.current, fontFacesRef.current, {
            liveRoot: visualRootRef.current ?? undefined,
          }),
        ),
        coalesce,
      )
    },
    [recordHtml],
  )

  const recordVisualInputHtml = useCallback(
    (body: string, coalesce: boolean) => {
      return recordVisualHtml(preservePageAtRuleInBody(body, htmlRef.current), coalesce)
    },
    [recordVisualHtml],
  )

  const previewPageMarginDrag = useCallback(
    (surface: HTMLElement, pageHtml: string, sides: PageMarginSidesPx) => {
      previewPageCanvasMargins(surface, pageHtml, sides)
    },
    [],
  )

  const commitPageMarginDrag = useCallback(
    (surface: HTMLElement, pageHtml: string, sides: PageMarginSidesPx) => {
      const draft: PagePropertiesApply = {
        ...queryPageProperties(surface),
        atRule: queryPageAtRule(buildPageHtmlWithMarginPx(pageHtml, sides)),
      }
      return applyPagePropertiesInDocument(surface, draft)
    },
    [],
  )

  const serializePageBody = useCallback(
    (body: string, previousPageHtml: string, liveRoot?: HTMLElement) => {
      return prependFontStylesheets(
        body,
        collectDocumentFontStylesheets(body, previousPageHtml, fontFacesRef.current, {
          liveRoot,
        }),
      )
    },
    [],
  )

  const flushMultiPageHtml = useCallback(
    (options?: { allPages?: boolean }) => {
      const multi = multiPageVisualRef.current
      const container = multi?.getContainer()
      const currentPages = pageStore.pages.length > 0 ? pageStore.pages : pagesRef.current
      if (!container || !multi) return [...currentPages]

      const pageStoreHandle = pageStore
      if (!pageStoreHandle) return [...currentPages]

      const dirty = pageStoreHandle.dirtyPagesRef.current
      const flushAll = options?.allPages === true
      const active = activePageIndexRef.current

      let changed = false
      const nextPages = currentPages.map((previous, index) => {
        const needsFlush = flushAll || dirty.has(index) || index === active
        if (!needsFlush) return previous
        const surface = queryPageSurface(container, index)
        let flushed: string | null = null
        if (surface) {
          normalizePageBackgroundLayerInHolder(surface)
          flushed = surface.innerHTML
        } else {
          flushed = multi.flushPageHtml(index)
        }
        if (flushed === null) {
          const previousBody = stripPageAtRuleFromHtml(extractFontStylesheets(previous).body)
          const repairedBody = repairPageBackgroundHtmlIfNeeded(previousBody)
          if (repairedBody === previousBody) return previous
          const serialized = serializePageBody(
            preservePageAtRuleInBody(repairedBody, extractFontStylesheets(previous).body),
            previous,
          )
          if (serialized !== previous) changed = true
          return serialized
        }
        const body = preservePageAtRuleInBody(flushed, extractFontStylesheets(previous).body)
        const serialized = serializePageBody(body, previous, surface ?? undefined)
        if (serialized !== previous) changed = true
        return serialized
      })

      if (changed) {
        const storedPages = optimizeEmbeddedImagesRef.current
          ? nextPages.map((page) => externalizeStorageHtml(page))
          : nextPages
        const result = pageStoreHandle.setPages(storedPages)
        htmlRef.current = result.joined
      }
      pageStoreHandle.markPagesClean()
      const resultPages = changed ? pageStoreHandle.pages : currentPages
      return optimizeEmbeddedImagesRef.current
        ? resultPages.map((page) => externalizeStorageHtml(page))
        : [...resultPages]
    },
    [externalizeStorageHtml, pageStore, serializePageBody],
  )

  const recordPageVisualHtml = useCallback(
    (index: number, body: string, coalesce: boolean) => {
      const nextPage = serializePageBody(body, pagesRef.current[index] ?? '')
      const updated = updatePageAt(pagesRef.current, index, nextPage)
      if (!updated.changed) return
      commitPages(updated.pages, coalesce, index)
    },
    [commitPages, serializePageBody],
  )

  const recordPageHtmlSource = useCallback(
    (index: number, pageHtml: string, coalesce: boolean) => {
      const previous = pagesRef.current[index] ?? ''
      const body = extractFontStylesheets(pageHtml).body
      const repairedBody = repairPageBackgroundHtmlIfNeeded(body)
      const nextPage =
        repairedBody === body
          ? pageHtml
          : serializePageBody(
              preservePageAtRuleInBody(repairedBody, extractFontStylesheets(previous).body),
              previous,
            )
      const updated = updatePageAt(pagesRef.current, index, nextPage)
      if (!updated.changed) return
      commitPages(updated.pages, coalesce, index)
    },
    [commitPages, serializePageBody],
  )

  const recordActivePageHtml = useCallback(
    (pageHtml: string, coalesce: boolean) => {
      const body = extractFontStylesheets(pageHtml).body
      if (enableMultiPagesRef.current) {
        recordPageVisualHtml(activePageIndexRef.current, body, coalesce)
      } else {
        recordVisualHtml(body, coalesce)
      }
    },
    [recordPageVisualHtml, recordVisualHtml],
  )

  const recordVisualHtmlFromRoot = useCallback(
    (root: HTMLElement, coalesce: boolean, pageHtmlOverride?: string) => {
      const bodySource = pageHtmlOverride
        ? extractFontStylesheets(pageHtmlOverride).body
        : root.innerHTML
      const resolveBody = (previousFullHtml: string) =>
        pageHtmlOverride
          ? bodySource
          : preservePageAtRuleInBody(bodySource, extractFontStylesheets(previousFullHtml).body)
      if (!enableMultiPagesRef.current) {
        recordVisualHtml(resolveBody(htmlRef.current), coalesce)
        return
      }
      const container = multiPageVisualRef.current?.getContainer()
      if (!container) {
        recordVisualHtml(resolveBody(htmlRef.current), coalesce)
        return
      }
      for (let index = 0; index < pagesRef.current.length; index += 1) {
        if (queryPageSurface(container, index) === root) {
          recordPageVisualHtml(index, resolveBody(pagesRef.current[index] ?? ''), coalesce)
          return
        }
      }
      recordVisualHtml(resolveBody(htmlRef.current), coalesce)
    },
    [recordPageVisualHtml, recordVisualHtml],
  )

  const recordCommentAnchorsFromRoot = useCallback(
    (root: HTMLElement, coalesce: boolean) => {
      if (readOnlyRef.current) return
      recordVisualHtmlFromRoot(root, coalesce)
    },
    [recordVisualHtmlFromRoot],
  )

  const singlePageRulerMarginPreview = useMemo(
    () =>
      createRulerMarginPreviewHandler(
        () => visualRootRef.current,
        () => htmlRef.current,
        previewPageMarginDrag,
      ),
    [previewPageMarginDrag],
  )

  const singlePageRulerMarginChange = useMemo(
    () =>
      createRulerMarginChangeHandler(
        () => visualRootRef.current,
        () => htmlRef.current,
        commitPageMarginDrag,
        (pageHtml) => recordVisualHtml(extractFontStylesheets(pageHtml).body, false),
      ),
    [commitPageMarginDrag, recordVisualHtml],
  )

  const singlePageRulerIndentChange = useMemo(
    () =>
      createRulerIndentChangeHandler(
        () => visualRootRef.current,
        rulerUnit ?? 'in',
        (surface) => recordVisualHtmlFromRoot(surface, false),
      ),
    [rulerUnit, recordVisualHtmlFromRoot],
  )

  const multiPageRulerMarginPreview = useMemo(
    () =>
      createMultiPageRulerMarginPreviewHandler(
        (pageIndex) => {
          const container = multiPageVisualRef.current?.getContainer()
          return container ? queryPageSurface(container, pageIndex) : null
        },
        (pageIndex) => pagesRef.current[pageIndex] ?? '',
        previewPageMarginDrag,
      ),
    [previewPageMarginDrag],
  )

  const multiPageRulerMarginChange = useMemo(
    () =>
      createMultiPageRulerMarginChangeHandler(
        (pageIndex) => {
          const container = multiPageVisualRef.current?.getContainer()
          return container ? queryPageSurface(container, pageIndex) : null
        },
        (pageIndex) => pagesRef.current[pageIndex] ?? '',
        commitPageMarginDrag,
        (pageIndex, pageHtml) =>
          recordPageVisualHtml(pageIndex, extractFontStylesheets(pageHtml).body, false),
      ),
    [commitPageMarginDrag, recordPageVisualHtml],
  )

  const multiPageRulerIndentChange = useMemo(
    () =>
      createRulerIndentChangeHandler(
        () => {
          const container = multiPageVisualRef.current?.getContainer()
          return container
            ? queryPageSurface(container, activePageIndexRef.current)
            : null
        },
        rulerUnit ?? 'in',
        (surface) => recordVisualHtmlFromRoot(surface, false),
      ),
    [rulerUnit, recordVisualHtmlFromRoot],
  )

  const getActivePageHtml = useCallback(() => {
    const pages = enableMultiPagesRef.current
      ? flushMultiPageHtml()
      : [htmlRef.current]
    return pages[activePageIndexRef.current] ?? pages[0] ?? ''
  }, [flushMultiPageHtml])

  const getAllPagesHtml = useCallback(() => {
    if (!enableMultiPagesRef.current) return [htmlRef.current]
    if (modeRef.current === 'html') {
      const pages = pagesRef.current.slice()
      pages[activePageIndexRef.current] = htmlModePageHtmlRef.current
      return pages
    }
    return flushMultiPageHtml({ allPages: true })
  }, [flushMultiPageHtml])

  const runInsertPageAt = useCallback(
    (insertAt: number) => {
      if (!enableMultiPagesRef.current || modeRef.current !== 'visual') return
      if (!hasSelectedPageRef.current) return
      suppressPageFlushRef.current = true
      const currentPages = flushMultiPageHtml()
      const clampedInsertAt = Math.max(0, Math.min(insertAt, currentPages.length))
      const nextPages = [...currentPages]
      const blank =
        pageLayoutAllowedRef.current && defaultPagePropertiesRef.current
          ? applyDefaultPagePropertiesToPageHtml(
              emptyPageHtml(),
              defaultPagePropertiesRef.current,
            )
          : emptyPageHtml()
      nextPages.splice(clampedInsertAt, 0, blank)
      const storedPages = nextPages.map((page) => externalizeStorageHtml(page))
      commitPages(nextPages, false, undefined, { skipHistory: true })
      if (isMultiPageHistory(history)) {
        history.recordInsertPage(clampedInsertAt, storedPages)
      }
      activePageIndexRef.current = clampedInsertAt
      setActivePageIndex(clampedInsertAt)
      setHasSelectedPage(true)
      pendingInsertPageFocusRef.current = clampedInsertAt
    },
    [flushMultiPageHtml, commitPages, history, externalizeStorageHtml],
  )

  const runInsertPageBefore = useCallback(() => {
    const sourceIndex = resolveSelectedPageIndex()
    if (sourceIndex === null || !hasSelectedPageRef.current) return
    runInsertPageAt(sourceIndex)
  }, [runInsertPageAt, resolveSelectedPageIndex])

  const runInsertPageAfter = useCallback(() => {
    const sourceIndex = resolveSelectedPageIndex()
    if (sourceIndex === null || !hasSelectedPageRef.current) return
    runInsertPageAt(sourceIndex + 1)
  }, [runInsertPageAt, resolveSelectedPageIndex])

  const runDeleteSelectedPage = useCallback(() => {
    if (!enableMultiPagesRef.current || modeRef.current !== 'visual') return
    if (!hasSelectedPageRef.current) return
    suppressPageFlushRef.current = true
    const currentPages = flushMultiPageHtml()
    if (currentPages.length <= 1) {
      suppressPageFlushRef.current = false
      return
    }
    const index = resolveSelectedPageIndex()
    if (index === null) {
      suppressPageFlushRef.current = false
      return
    }
    const deletedPage = currentPages[index] ?? ''
    const nextPages = currentPages.filter((_, i) => i !== index)
    const storedDeletedPage = externalizeStorageHtml(deletedPage)
    const storedNextPages = nextPages.map((page) => externalizeStorageHtml(page))
    commitPages(nextPages, false, undefined, { skipHistory: true })
    if (isMultiPageHistory(history)) {
      history.recordDeletePage(index, storedDeletedPage, storedNextPages)
    }
    const nextIndex = Math.min(index, nextPages.length - 1)
    activePageIndexRef.current = nextIndex
    setActivePageIndex(nextIndex)
    setHasSelectedPage(true)
  }, [flushMultiPageHtml, commitPages, history, resolveSelectedPageIndex, externalizeStorageHtml])

  useEffect(() => {
    if (!enableMultiPages) {
      setHasSelectedPage(false)
    }
  }, [enableMultiPages])

  useEffect(() => {
    return () => {
      if (!pendingPagesNotifyRef.current) return
      pagesNotifyScheduledRef.current = false
      flushPagesChangeNotify()
    }
  }, [flushPagesChangeNotify])

  const applyPagesFromHistory = useCallback(
    (pages: readonly string[]) => {
      const result = pageStore.replacePages([...pages])
      htmlRef.current = result.joined
      pagesRef.current = result.pages
      documentDirtyRef.current = true
      schedulePagesChange(
        hydrateExportPages(result.pages),
        activePageIndexRef.current,
      )
      const nextIndex = Math.max(0, Math.min(activePageIndexRef.current, result.pages.length - 1))
      if (nextIndex !== activePageIndexRef.current) {
        activePageIndexRef.current = nextIndex
        setActivePageIndex(nextIndex)
      }
      if (
        pagesPropRef.current === undefined &&
        modeRef.current === 'html' &&
        !optimizeEmbeddedImagesRef.current
      ) {
        documentBridgeRef.current?.setHtml(result.joined)
      }
      visualPropSyncGuardRef.current?.()
      syncVisualDocumentFromStorage(result.joined)
      if (isMultiPageHistory(history)) {
        history.applyPresent(result.pages)
      }
    },
    [hydrateExportPages, history, pageStore, schedulePagesChange, syncVisualDocumentFromStorage],
  )

  const syncSelectedImageFromSelection = useCallback(() => {
    if (modeRef.current !== 'visual' || contentLocked) {
      setSelectedImage(null)
      return
    }
    const root = visualRootRef.current
    if (!root) return
    const live = imageAtSelection(root)
    setSelectedImage((prev) => {
      if (live) return live
      if (prev && prev.isConnected && root.contains(prev)) return prev
      return null
    })
  }, [contentLocked])

  const undo = useCallback(() => {
    if (isMultiPageHistory(history)) {
      const next = history.undo()
      if (next === null) return
      history.markApplying()
      applyPagesFromHistory(next)
      bumpHistoryChromeIfNeeded()
      return
    }
    const next = history.undo()
    if (next === null) return
    history.markApplying()
    commitHtml(next, { fullReplace: true })
    syncVisualDocumentFromStorage(next)
    history.finishApplying()
    syncSelectedImageFromSelection()
    bumpHistoryChromeIfNeeded()
  }, [applyPagesFromHistory, bumpHistoryChromeIfNeeded, commitHtml, history, syncSelectedImageFromSelection, syncVisualDocumentFromStorage])

  const redo = useCallback(() => {
    if (isMultiPageHistory(history)) {
      const next = history.redo()
      if (next === null) return
      history.markApplying()
      applyPagesFromHistory(next)
      bumpHistoryChromeIfNeeded()
      return
    }
    const next = history.redo()
    if (next === null) return
    history.markApplying()
    commitHtml(next, { fullReplace: true })
    syncVisualDocumentFromStorage(next)
    history.finishApplying()
    syncSelectedImageFromSelection()
    bumpHistoryChromeIfNeeded()
  }, [applyPagesFromHistory, bumpHistoryChromeIfNeeded, commitHtml, history, syncSelectedImageFromSelection, syncVisualDocumentFromStorage])

  useEffect(() => {
    if (enableMultiPages) {
      if (isMultiPageHistory(history)) {
        if (pagesProp !== undefined && !optimizeEmbeddedImages) {
          history.syncPages(pagesRef.current)
        } else {
          history.applyPresent(pagesRef.current)
        }
      }
      return
    }
    if (!isMultiPageHistory(history)) {
      history.syncExternal(htmlRef.current)
    }
  }, [enableMultiPages, optimizeEmbeddedImages, history, pagesProp])

  const captureSelection = useCallback(() => {
    selectionRef.current = snapshotSelection({
      mode: modeRef.current,
      visualEl: visualRootRef.current,
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
      visualEl: visualRootRef.current,
      htmlEl: htmlAreaRef.current,
    })
    const prev = selectionRef.current
    if (shouldKeepStoredVisualSelection(prev, next)) return
    selectionRef.current = next
  }, [])

  const refreshFontSizeState = useCallback(() => {
    const root = visualRootRef.current
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
    const root = visualRootRef.current
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
    const root = visualRootRef.current
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
    const root = visualRootRef.current
    if (modeRef.current !== 'visual' || !root) {
      setParagraphStyleState({ tag: null, mixed: false })
      return
    }
    const next = queryBlockFormat(root)
    setParagraphStyleState((prev) => (prev.tag === next.tag && prev.mixed === next.mixed ? prev : next))
  }, [])

  const refreshParagraphChromeState = useCallback(() => {
    const root = visualRootRef.current
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
    const root = visualRootRef.current
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
  }, [mode, refreshMarkState])

  const applyInsert = useCallback(
    (snapshot: SelectionSnapshot, content: string, asHtml: boolean) => {
      insertAtSelection({
        snapshot,
        visualEl: visualRootRef.current,
        htmlEl: htmlAreaRef.current,
        getHtml: () => {
          if (modeRef.current === 'visual' && visualRootRef.current) {
            return visualRootRef.current.innerHTML
          }
          return htmlRef.current
        },
        setHtml: (next) => {
          if (modeRef.current === 'visual') {
            const previousPageHtml = enableMultiPagesRef.current
              ? (pagesRef.current[activePageIndexRef.current] ?? '')
              : htmlRef.current
            recordActivePageHtml(
              preservePageAtRuleInBody(
                extractFontStylesheets(next).body,
                extractFontStylesheets(previousPageHtml).body,
              ),
              false,
            )
            return
          }
          recordHtml(next, false)
        },
        content,
        asHtml,
      })
    },
    [recordHtml, recordActivePageHtml],
  )

  const handleHtmlPageTabSelect = useCallback(
    (index: number) => {
      if (!enableMultiPagesRef.current || index === activePageIndexRef.current) return
      if (htmlModeDirtyRef.current) {
        recordPageHtmlSource(activePageIndexRef.current, htmlModePageHtmlRef.current, true)
      }
      htmlModeDirtyRef.current = false
      activePageIndexRef.current = index
      setActivePageIndex(index)
      const pageHtml = pagesRef.current[index] ?? ''
      htmlModePageHtmlRef.current = pageHtml
    },
    [recordPageHtmlSource],
  )

  const handleHtmlSurfaceChange = useCallback(
    (next: string) => {
      htmlModeDirtyRef.current = true
      if (enableMultiPagesRef.current) {
        if (optimizeEmbeddedImagesRef.current) {
          const stored = externalizeStorageHtml(next)
          htmlModePageHtmlRef.current = stored
          recordPageHtmlSource(activePageIndexRef.current, stored, true)
        } else {
          htmlModePageHtmlRef.current = next
          recordPageHtmlSource(activePageIndexRef.current, next, true)
        }
        return
      }
      recordHtml(next, true)
    },
    [externalizeStorageHtml, recordHtml, recordPageHtmlSource],
  )

  const handleModeChange = useCallback(
    (next: EditorMode) => {
      if (modeRef.current === 'visual' && next === 'html') {
        if (enableMultiPagesRef.current) {
          const pages = flushMultiPageHtml({ allPages: true })
          const index = activePageIndexRef.current
          const pageHtml = pages[index] ?? pages[0] ?? ''
          htmlModePageHtmlRef.current = pageHtml
          htmlModeDirtyRef.current = false
          htmlRef.current = joinPagesToHtml(pages)
          flushPagesChangeNotify()
        } else if (visualRootRef.current) {
          const flushed = preservePageAtRuleInBody(
            visualRootRef.current.innerHTML,
            extractFontStylesheets(htmlRef.current).body,
          )
          const serialized = prependFontStylesheets(
            flushed,
            collectDocumentFontStylesheets(flushed, htmlRef.current, fontFacesRef.current, {
              liveRoot: visualRootRef.current ?? undefined,
            }),
          )
          if (optimizeEmbeddedImagesRef.current) {
            const stored = externalizeStorageHtml(serialized)
            const previous = htmlRef.current
            documentBridgeRef.current?.setStorageHtml(stored)
            htmlRef.current = stored
            if (stored !== previous) {
              documentDirtyRef.current = true
              if (!isMultiPageHistory(history)) {
                history.record(stored, { coalesce: true })
              }
            }
          } else if (serialized !== htmlRef.current) {
            recordHtml(serialized, true)
          }
        }
      }
      if (modeRef.current === 'html' && next === 'visual' && enableMultiPagesRef.current) {
        if (htmlModeDirtyRef.current) {
          recordPageHtmlSource(activePageIndexRef.current, htmlModePageHtmlRef.current, true)
        }
        htmlModeDirtyRef.current = false
      }
      setMode(next)
      if (next !== 'visual') {
        setHasSelectedPage(false)
      }
    },
    [externalizeStorageHtml, flushPagesChangeNotify, history, recordHtml, recordPageHtmlSource, setMode, flushMultiPageHtml],
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
      if (fontDialog.open || customCssDialog.open || paragraphDialog.open || pageDialog.open || deletePageConfirmOpen || tableDialog.open || tableProperties.open || cellProperties.open || rowProperties.open || customizeToolbarOpen || documentPreview.open || helpDialog.open || aboutDialogOpen) return
      event.preventDefault()
      setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [fullscreen, setFullscreen, fontDialog.open, customCssDialog.open, paragraphDialog.open, pageDialog.open, deletePageConfirmOpen, tableDialog.open, tableProperties.open, cellProperties.open, rowProperties.open, customizeToolbarOpen, documentPreview.open, helpDialog.open, aboutDialogOpen])

  useEffect(() => {
    const onSelectionChange = () => {
      if (modeRef.current !== 'visual' || !visualRootRef.current) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const node = sel.anchorNode
      if (!node || (!visualRootRef.current.contains(node) && visualRootRef.current !== node)) return
      if (selectionRefreshRafRef.current !== null) return
      selectionRefreshRafRef.current = window.requestAnimationFrame(() => {
        selectionRefreshRafRef.current = null
        const root = visualRootRef.current
        if (!root || modeRef.current !== 'visual') return
        captureSelection()
        clearPendingMarksIfSelectionMoved()
        refreshMarkState()
        setSelectedImage(imageAtSelection(root))
        refreshTableState(root)
        if (enableCommentsRef.current && commentsVisibleRef.current) {
          if (!commentPanelRef.current?.contains(document.activeElement)) {
            const snapshot = selectionRef.current
            if (snapshot) {
              setActiveThreadId(threadIdAtSelection(root, snapshot))
            }
          }
        }
      })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      if (selectionRefreshRafRef.current !== null) {
        window.cancelAnimationFrame(selectionRefreshRafRef.current)
        selectionRefreshRafRef.current = null
      }
    }
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

  const deactivateFormatBrush = useCallback(() => {
    copiedFormatRef.current = null
    formatBrushSourceRef.current = null
    setFormatBrushActiveState(false)
  }, [])

  const tryApplyFormatBrush = useCallback(() => {
    if (!formatBrushActiveRef.current || !copiedFormatRef.current || !formatBrushSourceRef.current) {
      return
    }
    if (modeRef.current !== 'visual') return
    const root = visualRootRef.current
    if (!root) return
    captureSelection()
    const snapshot = selectionRef.current
    if (!snapshot || snapshot.collapsed) return
    if (selectionRangesEqual(snapshot, formatBrushSourceRef.current)) return
    restoreVisualRange(root)
    applyCopiedFormat(root, copiedFormatRef.current)
    recordVisualHtmlFromRoot(root, false)
    captureSelection()
    refreshMarkState()
    deactivateFormatBrush()
  }, [captureSelection, restoreVisualRange, recordVisualHtml, refreshMarkState, deactivateFormatBrush])

  const toggleFormatBrush = useCallback(() => {
    if (modeRef.current !== 'visual') {
      deactivateFormatBrush()
      return
    }
    if (formatBrushActiveRef.current) {
      deactivateFormatBrush()
      return
    }
    const root = visualRootRef.current
    if (!root) {
      deactivateFormatBrush()
      return
    }
    const snapshot = restoreVisualRange(root)
    if (snapshot.collapsed) {
      deactivateFormatBrush()
      return
    }
    copiedFormatRef.current = snapshotFormatFromRoot(root)
    formatBrushSourceRef.current = { ...snapshot }
    setFormatBrushActiveState(true)
    captureSelection()
  }, [deactivateFormatBrush, restoreVisualRange, captureSelection])

  const handleVisualMouseUp = useCallback(() => {
    tryApplyFormatBrush()
  }, [tryApplyFormatBrush])

  useEffect(() => {
    if (mode !== 'visual' || contentLocked) {
      deactivateFormatBrush()
    }
  }, [mode, contentLocked, deactivateFormatBrush])

  const applyFontSize = useCallback(
    (size: number, unit?: FontSizeUnit) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyFontFamily = useCallback(
    (family: string | null) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyInlineColor = useCallback(
    (kind: InlineColorKind, color: string | null) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyProperties = useCallback(
    (draft: FontPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyParagraphProperties = useCallback(
    (draft: ParagraphPropertiesApply, backgroundImage?: PageBackgroundImageApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setParagraphDialog((prev) => ({ ...prev, open: false }))
      let changed = applyParagraphPropertiesInDocument(root, draft)
      if (backgroundImage) {
        if (applyParagraphBackgroundImageInDocument(root, backgroundImage)) changed = true
      }
      if (!changed) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyCustomCss = useCallback(
    (css: string) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyPageProperties = useCallback(
    (draft: PagePropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = resolveActiveVisualRoot()
      if (!root) return
      restoreVisualRange(root)
      setPageDialog((prev) => ({ ...prev, open: false }))
      const currentPageHtml = resolveActivePageHtml()
      const atRuleChanged =
        JSON.stringify(draft.atRule) !==
        JSON.stringify(queryPageAtRule(extractFontStylesheets(currentPageHtml).body))
      const result = applyPagePropertiesInDocument(root, draft)
      if (atRuleChanged) {
        syncPageCanvasLayout(root, result.pageHtml)
      }
      if (!result.changed && !atRuleChanged) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false, result.pageHtml)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtmlFromRoot, captureSelection, refreshMarkState, resolveActiveVisualRoot, resolveActivePageHtml],
  )

  const applyLink = useCallback(
    (draft: LinkApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setLinkDialog((prev) => ({ ...prev, open: false }))
      if (!applyLinkInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyBookmark = useCallback(
    (name: string) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setBookmarkDialog((prev) => ({ ...prev, open: false }))
      if (!insertBookmarkInDocument(root, name)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyImage = useCallback(
    (draft: ImageApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setImageDialog({ open: false })
      if (!insertImageInDocument(root, draft, imageRegistryRef.current)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyAudio = useCallback(
    (draft: AudioApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setAudioDialog({ open: false })
      if (!insertAudioInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyYoutube = useCallback(
    (draft: YoutubeApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setYoutubeDialog({ open: false })
      if (!insertYoutubeInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyTable = useCallback(
    (draft: TableApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setTableDialog({ open: false })
      if (!insertTableInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
      refreshTableState(root)
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const applyTableProperties = useCallback(
    (draft: TablePropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setTableProperties((prev) => ({ ...prev, open: false }))
      if (!applyTablePropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyCellProperties = useCallback(
    (draft: CellPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setCellProperties((prev) => ({ ...prev, open: false }))
      if (!applyCellPropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
      refreshTableState(root)
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const applyRowProperties = useCallback(
    (draft: RowPropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setRowProperties((prev) => ({ ...prev, open: false }))
      if (!applyRowPropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const runTableStructure = useCallback(
    (mutate: (root: HTMLElement) => boolean) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      if (!mutate(root)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
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
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, false)
      captureSelection()
      refreshMarkState()
    },
    [restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const applyImageProperties = useCallback(
    (draft: ImagePropertiesApply) => {
      if (modeRef.current !== 'visual') return
      const root = visualRootRef.current
      if (!root) return
      restoreVisualRange(root)
      setImageProperties((prev) => ({ ...prev, open: false }))
      if (!applyImagePropertiesInDocument(root, draft)) {
        captureSelection()
        refreshMarkState()
        return
      }
      recordVisualHtmlFromRoot(root, false)
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
    const root = visualRootRef.current
    if (!root || !selectedImage?.isConnected) return
    recordVisualHtmlFromRoot(root, false)
    selectImageInDocument(root, selectedImage)
    captureSelection()
    refreshMarkState()
  }, [selectedImage, recordVisualHtml, captureSelection, refreshMarkState])

  const serializeSinglePageVisualHtml = useCallback((): string => {
    if (modeRef.current !== 'visual' || !visualRootRef.current) {
      return htmlRef.current
    }
    const flushed = preservePageAtRuleInBody(
      visualRootRef.current.innerHTML,
      extractFontStylesheets(htmlRef.current).body,
    )
    return prependFontStylesheets(
      flushed,
      collectDocumentFontStylesheets(flushed, htmlRef.current, fontFacesRef.current, {
        liveRoot: visualRootRef.current,
      }),
    )
  }, [])

  const getDocumentHtml = useCallback(() => {
    if (enableMultiPagesRef.current) {
      const joined = joinPagesToHtml(getAllPagesHtml())
      htmlRef.current = joined
      return hydrateExportHtml(joined)
    }
    if (documentDirtyRef.current) {
      const serialized =
        modeRef.current === 'visual' ? serializeSinglePageVisualHtml() : htmlRef.current
      if (serialized !== htmlRef.current) {
        htmlRef.current = serialized
      }
    }
    return hydrateExportHtml(htmlRef.current)
  }, [getAllPagesHtml, hydrateExportHtml, serializeSinglePageVisualHtml])

  const autoSaveRevisionRef = useRef(-1)

  const readAutoSaveSinglePageSnapshot = useCallback((): string => {
    if (!documentDirtyRef.current && autoSaveSnapshotRef.current) {
      return autoSaveSnapshotRef.current
    }
    const snapshot = documentDirtyRef.current
      ? modeRef.current === 'visual'
        ? serializeSinglePageVisualHtml()
        : htmlRef.current
      : htmlRef.current
    if (snapshot !== htmlRef.current) {
      htmlRef.current = snapshot
    }
    autoSaveSnapshotRef.current = snapshot
    documentDirtyRef.current = false
    return snapshot
  }, [serializeSinglePageVisualHtml])

  const readAutoSaveMultiPageSnapshot = useCallback((): string => {
    if (!documentDirtyRef.current && autoSaveSnapshotRef.current) {
      return autoSaveSnapshotRef.current
    }
    const pages = flushMultiPageHtml()
    const snapshot = JSON.stringify(pages)
    autoSaveSnapshotRef.current = snapshot
    autoSaveRevisionRef.current = pageStore.revision
    documentDirtyRef.current = false
    return snapshot
  }, [flushMultiPageHtml, pageStore.revision])

  const getAutoSaveComparisonHtml = useCallback(() => {
    if (enableMultiPagesRef.current) {
      return readAutoSaveMultiPageSnapshot()
    }
    return readAutoSaveSinglePageSnapshot()
  }, [readAutoSaveMultiPageSnapshot, readAutoSaveSinglePageSnapshot])

  useAutoSave({
    onAutoSave: onAutoSave
      ? async (comparisonHtml) => {
          documentDirtyRef.current = false
          const payload = enableMultiPagesRef.current
            ? hydrateExportPages(JSON.parse(comparisonHtml) as string[])
            : hydrateExportHtml(comparisonHtml)
          return onAutoSave(payload)
        }
      : undefined,
    getHtml: getAutoSaveComparisonHtml,
  })

  useEffect(() => {
    return () => {
      imageRegistryRef.current?.clear()
    }
  }, [])

  useEffect(() => {
    if (!optimizeEmbeddedImages || value === undefined || enableMultiPages) return
    const stored = externalizeStorageHtml(value)
    documentBridgeRef.current?.setStorageHtml(stored)
    htmlRef.current = stored
    if (!isMultiPageHistory(history)) {
      history.syncExternal(stored)
    }
  }, [enableMultiPages, externalizeStorageHtml, history, optimizeEmbeddedImages, value])

  useEffect(() => {
    if (!optimizeEmbeddedImages || !enableMultiPages || pagesProp === undefined) return
    if (documentDirtyRef.current) return
    const storedPages = normalizePages(pagesProp).map((page) => externalizeStorageHtml(page))
    if (pagesArraysEqual(storedPages, pagesRef.current)) return
    const result = pageStore.replacePages(storedPages)
    htmlRef.current = result.joined
    pagesRef.current = result.pages
    if (isMultiPageHistory(history)) {
      history.syncPages(result.pages)
    }
    if (modeRef.current === 'html') {
      const pageHtml = result.pages[activePageIndexRef.current] ?? ''
      htmlModePageHtmlRef.current = pageHtml
    }
  }, [enableMultiPages, externalizeStorageHtml, history, optimizeEmbeddedImages, pageStore, pagesProp])

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
      getPageZoom: () => pageZoomRef.current,
      setPageZoom: persistPageZoom,
      getToolbarPosition: () => toolbarPosRef.current,
      setToolbarPosition: (next) => {
        void persistToolbarPosition(next)
      },
      openCustomizeToolbar: () => {
        setCustomizeToolbarOpen(true)
      },
      openDocumentPreview: () => {
        setDocumentPreview({
          open: true,
          html: hydrateExportHtml(joinPagesToHtml(getAllPagesHtml())),
        })
      },
      openHelp: () => {
        setHelpDialog({ open: true, topicId: 'getStarted' })
      },
      openKeyboardShortcuts: () => {
        setHelpDialog({ open: true, topicId: 'keyboardShortcuts' })
      },
      openAbout: () => {
        setAboutDialogOpen(true)
      },
      openCompatibilityCheck: () => {
        if (!renderingCapabilities) return
        const pages = enableMultiPagesRef.current
          ? [...pagesRef.current]
          : [htmlRef.current]
        const result = validatePagesAgainstCapabilities(pages, renderingCapabilities)
        setCapabilitiesValidation(result)
        onCapabilitiesValidationRef.current?.(result)
        setCompatibilityPanelOpen(true)
      },
      toggleReadAloud: () => {
        const session = readAloudSessionRef.current
        if (!session) return
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRootRef.current,
            htmlEl: htmlAreaRef.current,
          })
        const text = resolveReadAloudText(describeSelection(snapshot), getDocumentHtml())
        if (!text) return
        session.toggle(text)
      },
      toggleRuler: () => {
        setRulerVisible((prev) => !prev)
      },
      isReadingAloud: () => readAloudSessionRef.current?.isSpeaking() ?? false,
      isRulerVisible: () => rulerVisibleRef.current,
      canReadAloud: () => {
        if (!isSpeechSynthesisSupported()) return false
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRootRef.current,
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
            visualEl: visualRootRef.current,
            htmlEl: htmlAreaRef.current,
          })
        return describeSelection(snapshot)
      },
      insertText: (text: string) => {
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRootRef.current,
            htmlEl: htmlAreaRef.current,
          })
        applyInsert(snapshot, text, false)
      },
      insertHtml: (markup: string, formattedText?: string) => {
        const snapshot =
          selectionRef.current ??
          snapshotSelection({
            mode: modeRef.current,
            visualEl: visualRootRef.current,
            htmlEl: htmlAreaRef.current,
          })
        const asHtml = formattedText === undefined
        applyInsert(snapshot, asHtml ? markup : formattedText, asHtml)
      },
      toggleFontMark: (mark: FontMark) => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
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
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      clearFormatting: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
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
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      toggleFormatBrush,
      isFormatBrushActive: () => formatBrushActiveRef.current,
      isFontMarkActive: (mark: FontMark) => markStateRef.current[mark],
      hasTextSelection: () => modeRef.current === 'visual' && hasTextSelectionStateRef.current,
      setFontSize: (size: number, unit?: FontSizeUnit) => {
        applyFontSize(size, unit)
      },
      setFontSizeUnit: (unit: FontSizeUnit) => {
        const root = visualRootRef.current
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
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!setBlockFormatInDocument(root, tag)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      getParagraphStyle: () => paragraphStyleStateRef.current.tag,
      isParagraphStyleMixed: () => paragraphStyleStateRef.current.mixed,
      setTextAlign: (align: TextAlign) => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!setTextAlignInDocument(root, align)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      getTextAlign: () => textAlignStateRef.current.align,
      isTextAlignMixed: () => textAlignStateRef.current.mixed,
      indent: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!indentInDocument(root)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      outdent: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!outdentInDocument(root)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      canOutdent: () => modeRef.current === 'visual' && canOutdentStateRef.current,
      toggleList: (type: ListType) => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!toggleListInDocument(root, type)) return
        recordVisualHtmlFromRoot(root, false)
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
        if (root) restoreVisualRange(root)
        setParagraphDialog({
          open: true,
          tab: tab ?? 'general',
          value: root ? queryParagraphProperties(root) : emptyParagraphPropertiesApply(),
          backgroundImage: root
            ? queryParagraphBackgroundImage(root)
            : emptyPageBackgroundImageApply(),
        })
      },
      applyParagraphProperties: (
        draft: ParagraphPropertiesApply,
        backgroundImage?: PageBackgroundImageApply,
      ) => {
        applyParagraphProperties(draft, backgroundImage)
      },
      openPageProperties: (tab?: PageDialogTab, paragraphTab?: ParagraphDialogTab) => {
        if (modeRef.current !== 'visual') return
        const root = resolveActiveVisualRoot()
        if (root) restoreVisualRange(root)
        const pageHtml = resolveActivePageHtml()
        const fromDom = root ? queryPageProperties(root) : emptyPagePropertiesApply()
        const nextTab =
          tab === 'print' && !enablePageProperties ? 'font' : (tab ?? 'font')
        setPageDialog({
          open: true,
          tab: nextTab,
          paragraphTab: paragraphTab ?? 'spacing',
          value: {
            ...fromDom,
            atRule: queryPageAtRule(extractFontStylesheets(pageHtml).body),
          },
        })
      },
      applyPageProperties: (draft: PagePropertiesApply) => {
        applyPageProperties(draft)
      },
      openPageBackgroundImage: () => {
        if (modeRef.current !== 'visual') return
        const root = resolveActiveVisualRoot()
        if (root) restoreVisualRange(root)
        const picker = customBackgroundImagePickerRef.current
        if (disableBuiltinBackgroundImageInsertRef.current && picker) {
          picker.onPick((image) => {
            const pageHtml = resolveActivePageHtml()
            const fromDom = root ? queryPageProperties(root) : emptyPagePropertiesApply()
            applyPageProperties({
              ...fromDom,
              backgroundImage: {
                ...fromDom.backgroundImage,
                src: image.src,
              },
              atRule: queryPageAtRule(extractFontStylesheets(pageHtml).body),
            })
          })
          return
        }
        const pageHtml = resolveActivePageHtml()
        const fromDom = root ? queryPageProperties(root) : emptyPagePropertiesApply()
        setPageDialog({
          open: true,
          tab: 'paragraph',
          paragraphTab: 'backgroundImage',
          value: {
            ...fromDom,
            atRule: queryPageAtRule(extractFontStylesheets(pageHtml).body),
          },
        })
      },
      openParagraphBackgroundImage: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (root) restoreVisualRange(root)
        const picker = customBackgroundImagePickerRef.current
        if (disableBuiltinBackgroundImageInsertRef.current && picker) {
          picker.onPick((image) => {
            const paragraph = root
              ? queryParagraphProperties(root)
              : emptyParagraphPropertiesApply()
            const backgroundImage = root
              ? queryParagraphBackgroundImage(root)
              : emptyPageBackgroundImageApply()
            applyParagraphProperties(paragraph, {
              ...backgroundImage,
              src: image.src,
            })
          })
          return
        }
        setParagraphDialog({
          open: true,
          tab: 'backgroundImage',
          value: root ? queryParagraphProperties(root) : emptyParagraphPropertiesApply(),
          backgroundImage: root
            ? queryParagraphBackgroundImage(root)
            : emptyPageBackgroundImageApply(),
        })
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
        if (!root || modeRef.current !== 'visual') return
        restoreVisualRange(root)
        if (!applyCustomParagraphInDocument(root, style.paragraph)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      customParagraphStylesEnabled: () => customParagraphStylesEnabledRef.current,
      getCustomParagraphStyles: () => customStylesRef.current,
      isCustomParagraphStylesLoading: () => customStylesLoadingRef.current,
      openLinkDialog: (tab?: LinkDialogTab) => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!insertHorizontalRuleInDocument(root)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      insertPageBreak: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!insertPageBreakInDocument(root)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      insertPageBefore: () => {
        runInsertPageBefore()
      },
      insertPageAfter: () => {
        runInsertPageAfter()
      },
      deletePage: () => {
        if (!enableMultiPagesRef.current || modeRef.current !== 'visual') return
        if (!hasSelectedPageRef.current) return
        if (getAllPagesHtml().length <= 1) return
        setDeletePageConfirmOpen(true)
      },
      isMultiPagesEnabled: () => enableMultiPagesRef.current,
      hasSelectedPage: () =>
        enableMultiPagesRef.current &&
        modeRef.current === 'visual' &&
        hasSelectedPageRef.current,
      canDeletePage: () =>
        enableMultiPagesRef.current &&
        modeRef.current === 'visual' &&
        hasSelectedPageRef.current &&
        getAllPagesHtml().length > 1,
      canInsertPageBackgroundImage: () => {
        if (modeRef.current !== 'visual') return false
        if (enableMultiPagesRef.current && !hasSelectedPageRef.current) return false
        return true
      },
      canInsertParagraphBackgroundImage: () => {
        if (modeRef.current !== 'visual') return false
        const root = visualRootRef.current
        if (!root) return false
        return collectSelectedBlocks(root).length > 0
      },
      getActivePageHtml: () => getActivePageHtml(),
      getAllPagesHtml: () => hydrateExportPages(getAllPagesHtml()),
      openTableDialog: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (root) restoreVisualRange(root)
        setTableDialog({ open: true })
      },
      applyTable: (draft: TableApply) => {
        applyTable(draft)
      },
      openTableProperties: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
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
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!(await cutSelectionInDocument(root))) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      copy: async () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        await copySelectionInDocument(root)
      },
      deleteSelection: () => {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        restoreVisualRange(root)
        if (!deleteSelectionInDocument(root)) return
        recordVisualHtmlFromRoot(root, false)
        captureSelection()
        refreshMarkState()
      },
      addComment: () => {
        if (!enableCommentsRef.current || disabled) return
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        const snapshot = restoreVisualRange(root)
        const existingId = threadIdAtSelection(root, snapshot)
        if (existingId) {
          setActiveThreadId(existingId)
          return
        }
        const anchor = snapshotCommentAnchor(root, snapshot)
        if (!anchor) return
        const thread = createCommentThread(anchor)
        if (!applyCommentAnchor(root, thread.id, snapshot)) return
        selectCommentThreadAnchor(root, thread.id)
        captureSelection()
        recordCommentAnchorsFromRoot(root, false)
        setCommentThreadsState([...commentThreadsRef.current, thread])
        setActiveThreadId(thread.id)
      },
      toggleCommentsVisible: () => {
        setCommentsVisible((prev) => {
          const next = !prev
          const root = visualRootRef.current
          if (root) setCommentHighlightsVisible(root, next)
          return next
        })
      },
      areCommentsVisible: () => commentsVisibleRef.current,
      canAddComment: () => {
        if (!enableCommentsRef.current || disabled) return false
        if (modeRef.current !== 'visual') return false
        return hasTextSelectionStateRef.current || selectedImageRef.current !== null
      },
      isCommentsEnabled: () => enableCommentsRef.current,
      getCommentThreads: () => commentThreadsRef.current,
      setCommentThreads: (threads) => setCommentThreadsState(threads),
      openCommentThread: (id) => {
        const root = visualRootRef.current
        if (!root || modeRef.current !== 'visual') return
        if (!selectCommentThreadAnchor(root, id)) return
        captureSelection()
        setActiveThreadId(id)
      },
      isContentLocked: () => contentLockedRef.current,
      isLink: () => linkActiveRef.current,
      isImageSelected: () => modeRef.current === 'visual' && selectedImageRef.current !== null,
      isInTable: () => modeRef.current === 'visual' && inTableRef.current,
      canMergeCells: () => modeRef.current === 'visual' && canMergeCellsRef.current,
      canUnmergeCells: () => modeRef.current === 'visual' && canUnmergeCellsRef.current,
      ...(onSave != null
        ? {
            onSave: (payload: string | string[]) => onSaveRef.current!(payload),
          }
        : {}),
      ...(onOpen != null
        ? {
            onOpen: () => onOpenRef.current!(),
          }
        : {}),
    }),
    [recordHtml, recordVisualHtml, recordVisualHtmlFromRoot, recordCommentAnchorsFromRoot, handleModeChange, setFullscreen, persistDarkMode, persistPageZoom, persistToolbarPosition, applyInsert, undo, redo, captureSelection, refreshMarkState, restoreVisualRange, applyFontSize, applyFontFamily, applyInlineColor, applyProperties, applyCustomCss, applyParagraphProperties, applyPageProperties, applyLink, applyBookmark, applyImage, applyAudio, applyYoutube, applyImageProperties, applyTable, applyTableProperties, applyCellProperties, applyRowProperties, runTableStructure, insertCustomImage, insertCustomAudio, insertCustomVideo, getDocumentHtml, getActivePageHtml, getAllPagesHtml, runInsertPageBefore, runInsertPageAfter, runDeleteSelectedPage, toggleFormatBrush, onSave, onOpen, disabled, setCommentThreadsState, enablePageProperties, renderingCapabilities],
  )

  const runCapabilitiesValidation = useCallback(() => {
    if (!renderingCapabilities) {
      setCapabilitiesValidation(null)
      return null
    }
    const pages = enableMultiPagesRef.current ? [...pagesRef.current] : [htmlRef.current]
    const result = validatePagesAgainstCapabilities(pages, renderingCapabilities)
    setCapabilitiesValidation(result)
    onCapabilitiesValidationRef.current?.(result)
    return result
  }, [renderingCapabilities])

  useEffect(() => {
    if (!renderingCapabilities) {
      setCapabilitiesValidation(null)
      return
    }
    const timeout = window.setTimeout(() => {
      runCapabilitiesValidation()
    }, 750)
    return () => window.clearTimeout(timeout)
  }, [historyRevision, renderingCapabilities, runCapabilitiesValidation])

  const prevPageLayoutAllowedRef = useRef(pageLayoutAllowed)
  useEffect(() => {
    const wasAllowed = prevPageLayoutAllowedRef.current
    prevPageLayoutAllowedRef.current = pageLayoutAllowed
    if (!wasAllowed || pageLayoutAllowed) return
    if (enableMultiPagesRef.current) {
      const pages = flushMultiPageHtml({ allPages: true })
      const stripped = pages.map(stripPageChromeFromPageHtml)
      if (stripped.some((page, index) => page !== pages[index])) {
        commitPages(stripped, false)
      }
      return
    }
    const previous = htmlRef.current
    const extracted = extractFontStylesheets(previous)
    const strippedBody = stripPageChromeFromPageHtml(extracted.body)
    if (strippedBody !== extracted.body) {
      commitHtml(prependFontStylesheets(strippedBody, extracted.hrefs), { fullReplace: true })
    }
  }, [pageLayoutAllowed, flushMultiPageHtml, commitPages, commitHtml])

  const applyPinnedCustomActionInsert = useCallback(
    (
      snapshot: SelectionSnapshot,
      content: string,
      asHtml: boolean,
      options: {
        activePageIndexAtCapture: number
        pageHtmlAtCapture: string | null
        selectedHtmlAtCapture: string
      },
    ) => {
      const { activePageIndexAtCapture, pageHtmlAtCapture, selectedHtmlAtCapture } = options

      if (snapshot.mode === 'visual') {
        let root = visualRootRef.current
        if (enableMultiPagesRef.current) {
          const multi = multiPageVisualRef.current
          multi?.ensurePageMounted(activePageIndexAtCapture)
          const container = multi?.getContainer()
          root = container
            ? queryPageSurface(container, activePageIndexAtCapture)
            : root
        }
        if (root) {
          visualRootRef.current = root
          const range = resolveVisualInsertRange(root, snapshot, selectedHtmlAtCapture)
          if (range && !range.collapsed) {
            replaceRangeContents(range, content, asHtml)
            const previousPageHtml = enableMultiPagesRef.current
              ? (pageHtmlAtCapture ?? pagesRef.current[activePageIndexAtCapture] ?? '')
              : htmlRef.current
            recordActivePageHtml(
              preservePageAtRuleInBody(
                extractFontStylesheets(root.innerHTML).body,
                extractFontStylesheets(previousPageHtml).body,
              ),
              false,
            )
            return
          }
          root.focus({ preventScroll: true })
          const restored = rangeToRestore(root, snapshot)
          const effectiveSnapshot =
            restored !== null ? { ...snapshot, visualRange: restored.cloneRange() } : snapshot
          insertAtSelection({
            snapshot: effectiveSnapshot,
            visualEl: root,
            htmlEl: htmlAreaRef.current,
            getHtml: () => {
              if (modeRef.current === 'visual' && root) {
                return root.innerHTML
              }
              return htmlRef.current
            },
            setHtml: (next) => {
              if (modeRef.current === 'visual') {
                const previousPageHtml = enableMultiPagesRef.current
                  ? (pagesRef.current[activePageIndexAtCapture] ?? '')
                  : htmlRef.current
                recordActivePageHtml(
                  preservePageAtRuleInBody(
                    extractFontStylesheets(next).body,
                    extractFontStylesheets(previousPageHtml).body,
                  ),
                  false,
                )
                return
              }
              recordHtml(next, false)
            },
            content,
            asHtml,
          })
          return
        }
      }

      applyInsert(snapshot, content, asHtml)
    },
    [applyInsert, recordActivePageHtml, recordHtml],
  )

  const prepareCustomActionSnapshot = useCallback(() => {
    if (selectionRefreshRafRef.current !== null) {
      window.cancelAnimationFrame(selectionRefreshRafRef.current)
      selectionRefreshRafRef.current = null
      captureSelection()
    }
    captureChromeSelection()
  }, [captureSelection, captureChromeSelection])

  const createActionApi = useCallback((): CustomActionApi => {
    const snapshot = resolveActionSnapshot({
      stored: selectionRef.current,
      mode: modeRef.current,
      visualEl: visualRootRef.current,
      htmlEl: htmlAreaRef.current,
    })
    const capturedSnapshot: SelectionSnapshot = {
      ...snapshot,
      visualRange: snapshot.visualRange?.cloneRange() ?? null,
    }
    selectionRef.current = capturedSnapshot
    const activePageIndexAtCapture = enableMultiPagesRef.current ? activePageIndexRef.current : 0
    const pageHtmlAtCapture =
      snapshot.mode === 'visual' && enableMultiPagesRef.current ? getActivePageHtml() : null
    const visualInnerHtmlAtCapture = visualRootRef.current?.innerHTML ?? ''
    const pageBodyAtCapture = pageHtmlAtCapture
      ? stripPageAtRuleFromHtml(extractFontStylesheets(pageHtmlAtCapture).body)
      : visualInnerHtmlAtCapture
    const selectedHtmlAtCapture = (() => {
      if (snapshot.mode === 'html') {
        const html = commandContext.getHtml()
        const from = Math.min(snapshot.start, snapshot.end)
        const to = Math.max(snapshot.start, snapshot.end)
        return html.slice(from, to)
      }
      const root = visualRootRef.current
      if (!root) {
        return snapshot.text
      }
      return htmlFromSnapshotRange(root, capturedSnapshot) || snapshot.text
    })()
    const pinnedPageBodySelection =
      snapshot.mode === 'visual' &&
      enableMultiPagesRef.current &&
      !snapshot.collapsed &&
      selectedHtmlAtCapture
        ? resolvePinnedBodySelection(pageBodyAtCapture, visualInnerHtmlAtCapture, selectedHtmlAtCapture)
        : null
    const pinnedPageBodySelectionForApi =
      pinnedPageBodySelection && enableMultiPagesRef.current
        ? {
            pageIndex: activePageIndexAtCapture,
            start: pinnedPageBodySelection.start,
            end: pinnedPageBodySelection.end,
            pageBodyAtCapture,
          }
        : null
    const pinnedInsertOptions = {
      activePageIndexAtCapture,
      pageHtmlAtCapture,
      selectedHtmlAtCapture,
    }
    return {
      mode: capturedSnapshot.mode,
      selection: describeSelection(capturedSnapshot),
      getHtml: commandContext.getHtml,
      getSelectedHtml: () => selectedHtmlAtCapture,
      getPinnedPageBodySelection: () => pinnedPageBodySelectionForApi,
      setHtml: (next) => {
        recordHtml(next, false)
      },
      insertText: (text) => applyPinnedCustomActionInsert(capturedSnapshot, text, false, pinnedInsertOptions),
      insertHtml: (markup, formattedText) => {
        const asHtml = formattedText === undefined
        applyPinnedCustomActionInsert(capturedSnapshot, asHtml ? markup : formattedText, asHtml, pinnedInsertOptions)
      },
    }
  }, [applyPinnedCustomActionInsert, commandContext.getHtml, getActivePageHtml, recordHtml])

  const { catalog: baseCatalog, layout: baseLayout } = useMemo(
    () => mergeCustomActions(customActions, defaultToolbarCatalog, defaultToolbarLayout),
    [customActions],
  )
  const allowedLayout = useMemo(
    () => filterAllowedChrome(baseLayout, allowedChrome),
    [baseLayout, allowedChrome],
  )
  const customizedLayout = useMemo(
    () => ({
      ...allowedLayout,
      iconGroups: applyToolbarCustomization(allowedLayout.iconGroups, toolbarSettings),
    }),
    [allowedLayout, toolbarSettings],
  )
  const insertPageVisible = enableMultiPages && mode === 'visual'
  const multiPageLayout = useMemo(
    () => filterMultiPageLayout(customizedLayout, insertPageVisible),
    [customizedLayout, insertPageVisible],
  )
  const capabilitiesLayout = useMemo(
    () => filterCapabilitiesLayout(multiPageLayout, capabilityProfile),
    [multiPageLayout, capabilityProfile],
  )
  const capabilitiesCatalog = useMemo(
    () => (capabilityProfile ? mergeCapabilitiesCatalog(baseCatalog) : baseCatalog),
    [baseCatalog, capabilityProfile],
  )
  const displayCatalog = useMemo(() => {
    const catalog = enableComments
      ? mergeCommentsCatalog(capabilitiesCatalog, commentsVisible)
      : capabilitiesCatalog
    return catalog
  }, [capabilitiesCatalog, enableComments, commentsVisible])
  const displayLayout = useMemo(() => {
    let layout = capabilityProfile ? mergeCapabilitiesLayout(capabilitiesLayout) : capabilitiesLayout
    if (enableComments) layout = mergeCommentsLayout(layout)
    return layout
  }, [capabilitiesLayout, capabilityProfile, enableComments])
  const chromeLock = useMemo<ChromeLockOptions>(
    () => ({ disabled: chromeDisabled, readOnly, enableComments }),
    [chromeDisabled, readOnly, enableComments],
  )

  const postCommentMessage = useCallback(
    (message: string) => {
      if (!activeThreadId || !commentAuthor || disabled) return
      const entry = createCommentMessage(commentAuthor, message)
      setCommentThreadsState(addMessageToThread(commentThreadsRef.current, activeThreadId, entry))
    },
    [activeThreadId, commentAuthor, disabled, setCommentThreadsState],
  )

  const commands = useMemo(
    () => ({
      ...createEditorCommands(commandContext),
      ...createCustomActionCommands(customActions, createActionApi, prepareCustomActionSnapshot),
    }),
    [commandContext, customActions, createActionApi, prepareCustomActionSnapshot],
  )
  const queries = useMemo(
    () => createEditorQueries(commandContext),
    [commandContext, markState, fontSizeState, fontFamilyState, fontColorState, highlightColorState, paragraphStyleState, customStyles, customStylesLoading, customParagraphStylesEnabled, fontFaces, selectedImage, inTable, canMergeCells, canUnmergeCells, hasTextSelectionState, formatBrushActiveState, dark, toolbarPos, pageZoom, hasSelectedPage, historyRevision, fullscreen],
  )

  useLayoutEffect(() => {
    toolbarQueryRevisions.bump('history')
  }, [historyRevision, toolbarQueryRevisions])

  useLayoutEffect(() => {
    toolbarQueryRevisions.bump('marks')
  }, [
    markState,
    fontSizeState,
    fontFamilyState,
    fontColorState,
    highlightColorState,
    paragraphStyleState,
    formatBrushActiveState,
    toolbarQueryRevisions,
  ])

  useLayoutEffect(() => {
    toolbarQueryRevisions.bump('table')
  }, [inTable, canMergeCells, canUnmergeCells, toolbarQueryRevisions])

  useLayoutEffect(() => {
    toolbarQueryRevisions.bump('selection')
  }, [hasTextSelectionState, selectedImage, toolbarQueryRevisions])

  useLayoutEffect(() => {
    toolbarQueryRevisions.bump('chrome')
  }, [
    dark,
    toolbarPos,
    pageZoom,
    hasSelectedPage,
    fullscreen,
    customStyles,
    customStylesLoading,
    customParagraphStylesEnabled,
    fontFaces,
    toolbarQueryRevisions,
  ])

  const handleVisualBeforeInput = useCallback(
    (event: InputEvent) => {
      if (contentLocked) return
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
      const root = visualRootRef.current
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
      recordVisualHtmlFromRoot(root, true)
      captureSelection()
      refreshMarkState()
    },
    [contentLocked, recordVisualHtml, captureSelection, refreshMarkState],
  )

  const handleVisualContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (contentLocked) return
      if (!shouldOpenEditorContextMenu(event, lastVisualPointerTypeRef.current)) return
      event.preventDefault()
      event.stopPropagation()

      let root: HTMLElement | null = visualRootRef.current
      if (enableMultiPagesRef.current) {
        const surface =
          event.currentTarget instanceof HTMLElement &&
          event.currentTarget.hasAttribute(PAGE_SURFACE_ATTR)
            ? event.currentTarget
            : closestPageSurface(event.target as Node)
        if (surface instanceof HTMLElement) {
          const index = queryPageSurfaceIndex(surface)
          if (index !== null) {
            multiPageVisualRef.current?.activatePageAt(index)
            visualRootRef.current = surface
            root = surface
            hasSelectedPageRef.current = true
            setHasSelectedPage(true)
          }
        }
      } else if (event.currentTarget instanceof HTMLDivElement) {
        visualRootRef.current = event.currentTarget
        root = event.currentTarget
      }

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
      const pageFlags = {
        canDeletePage:
          enableMultiPagesRef.current &&
          hasSelectedPageRef.current &&
          flushMultiPageHtml().length > 1,
      }
      const commentFlags = {
        canAddComment: enableCommentsRef.current && !disabled,
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
          ...pageFlags,
          ...commentFlags,
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
        ...pageFlags,
        canAddComment: commentFlags.canAddComment && !snapshot.collapsed,
      })
    },
    [contentLocked, captureSelection, restoreVisualRange, flushMultiPageHtml, disabled, setHasSelectedPage],
  )

  const handleVisualPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      lastVisualPointerTypeRef.current = event.pointerType
      if (disabled) return
      const root = visualRootRef.current
      if (!root) return

      if (enableCommentsRef.current && commentsVisibleRef.current) {
        const marked = commentThreadElementAtPoint(root, event.target as Node)
        if (marked) {
          const id = marked.getAttribute('data-comment-thread')
          if (id) setActiveThreadId(id)
          return
        }
      }

      if (contentLocked && !enableCommentsRef.current) return

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
    [disabled, contentLocked, captureSelection],
  )

  const handleHistoryKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (contentLocked) return
      if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (modeRef.current !== 'visual') return
        const root = visualRootRef.current
        if (!root) return
        const target = event.target
        if (!(target instanceof Node) || !root.contains(target)) return
        restoreVisualRange(root)
        const result = tabInTable(root, event.shiftKey)
        if (!result) return
        event.preventDefault()
        if (typeof result === 'object' && result.changed) {
          recordVisualHtmlFromRoot(root, false)
        }
        captureSelection()
        refreshMarkState()
        refreshTableState(root)
        return
      }
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        commandContext.insertPageBreak()
        return
      }
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
    [contentLocked, undo, redo, commandContext, commands, restoreVisualRange, recordVisualHtml, captureSelection, refreshMarkState, refreshTableState],
  )

  const handleRootKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'F1') {
        event.preventDefault()
        setHelpDialog({ open: true, topicId: 'getStarted' })
        return
      }
      if (event.key === 'Escape' && activeThreadId) {
        event.preventDefault()
        setActiveThreadId(null)
        return
      }
      handleHistoryKeyDown(event)
    },
    [activeThreadId, handleHistoryKeyDown],
  )

  const rootClassName = [styles.root, chromeThemeProps(dark).className, fullscreen ? styles.fullscreen : '', className]
    .filter(Boolean)
    .join(' ')
  const rootStyle = editorChromeStyle({
    dark,
    toolbarBackground,
    workspaceBackground,
    menuColor,
    menuBackground,
    menuFontSize,
    menuFontFamily,
    border,
  })
  const themeAttr = chromeThemeProps(dark)['data-wysiwyg-theme']

  workspaceHandlersRef.current = {
    multiPageVisualRef,
    workspaceRef,
    suppressPageFlushRef,
    pendingInsertPageFocusRef,
    visualRootRef,
    visualPropSyncGuardRef,
    htmlAreaRef,
    commentPanelRef,
    activePageIndexRef,
    htmlModePageHtmlRef,
    setHtmlModePageHtml: () => {},
    activePageHtmlRef,
    pageCanvasSizedRef,
    setActivePageIndex,
    setHasSelectedPage,
    setActiveThreadId,
    setContextMenu,
    recordVisualInputHtml,
    recordPageVisualHtml,
    handleVisualBeforeInput,
    handleVisualPointerDown,
    handleVisualMouseUp,
    handleVisualContextMenu,
    handleHtmlPageTabSelect,
    handleHtmlSurfaceChange,
    handleImageResize,
    handleImageResizeEnd,
    multiPageRulerMarginPreview,
    multiPageRulerMarginChange,
    multiPageRulerIndentChange,
    singlePageRulerMarginPreview,
    singlePageRulerMarginChange,
    singlePageRulerIndentChange,
    resolveEmbeddedImageDataUrl: optimizeEmbeddedImages ? resolveEmbeddedImageDataUrl : undefined,
    hydrateExportHtml,
    postCommentMessage,
    htmlFileDrop,
  }

  const toolbarShellProps = useMemo(
    () =>
      buildToolbarShellProps({
        catalog: displayCatalog,
        layout: displayLayout,
        commands,
        queries,
        queryRevisions: toolbarQueryRevisions,
        disabled: chromeDisabled,
        chromeLock,
      }),
    [
      chromeDisabled,
      chromeLock,
      commands,
      displayCatalog,
      displayLayout,
      queries,
      toolbarQueryRevisions,
    ],
  )

  const shellContextValue = useMemo(
    () => ({ documentBridgeRef, htmlRef, pagesRef }),
    [],
  )
  const capabilitiesContextValue = useMemo(
    () => ({
      profile: capabilityProfile,
      validation: capabilitiesValidation,
      refreshValidation: runCapabilitiesValidation,
    }),
    [capabilityProfile, capabilitiesValidation, runCapabilitiesValidation],
  )
  const isToolbarItemAllowed = useCallback(
    (itemId: string) => isToolbarItemAllowedByCapabilities(itemId, capabilityProfile),
    [capabilityProfile],
  )

  return (
    <LocaleProvider locale={locale}>
      <ChromeThemeProvider dark={dark}>
        <CapabilitiesProvider value={capabilitiesContextValue}>
        <EditorShellProvider value={shellContextValue}>
          <div
            className={rootClassName}
            style={rootStyle}
            data-fullscreen={fullscreen ? '' : undefined}
            data-wysiwyg-theme={themeAttr}
            data-toolbar-position={toolbarPos}
            data-comments-visible={enableComments && commentsVisible ? '' : undefined}
            onKeyDown={handleRootKeyDown}
          >
            <EditorChrome
              menuVisible={menuVisible}
              captureChromeSelection={captureChromeSelection}
              displayCatalog={displayCatalog}
              displayLayout={displayLayout}
              commands={commands}
              queries={queries}
              queryRevisions={toolbarQueryRevisions}
              chromeDisabled={chromeDisabled}
              chromeLock={chromeLock}
              contentLocked={contentLocked}
              customizeToolbarOpen={customizeToolbarOpen}
              baseCatalog={baseCatalog}
              allowedLayout={allowedLayout}
              toolbarSettings={toolbarSettings}
              toolbarSettingsLoading={toolbarSettingsLoading}
              toolbarSettingsBusy={toolbarSettingsBusy}
              onCustomizeToolbarClose={() => setCustomizeToolbarOpen(false)}
              onToolbarSettingsChange={(next) => {
                void persistToolbarSettings(next)
              }}
              onToolbarSettingsReset={() => {
                void persistToolbarSettings(null)
              }}
              documentPreview={documentPreview}
              onDocumentPreviewClose={() =>
                setDocumentPreview({ open: false, html: documentPreview.html })
              }
              helpDialog={helpDialog}
              onHelpDialogClose={() =>
                setHelpDialog((prev) => ({ ...prev, open: false }))
              }
              onHelpTopicChange={(topicId) =>
                setHelpDialog((prev) => ({ ...prev, open: true, topicId }))
              }
              aboutDialogOpen={aboutDialogOpen}
              onAboutDialogClose={() => setAboutDialogOpen(false)}
              fontDialog={fontDialog}
              fontSizeState={fontSizeState}
              markState={markState}
              fontFamilyState={fontFamilyState}
              fontColorState={fontColorState}
              highlightColorState={highlightColorState}
              fontFaces={fontFaces}
              onFontDialogTabChange={(tab) => setFontDialog({ open: true, tab })}
              onFontDialogClose={() => setFontDialog({ open: false, tab: fontDialog.tab })}
              onApplyFontProperties={(draft) => commandContext.applyFontProperties(draft)}
              paragraphDialog={paragraphDialog}
              customBackgroundImagePicker={resolvedBackgroundImagePicker}
              disableBuiltinBackgroundImageSources={resolvedDisableBuiltinBackgroundImageSources}
              onParagraphCustomImagePick={() => {
                resolvedBackgroundImagePicker?.onPick((image) => {
                  setParagraphDialog((prev) => ({
                    ...prev,
                    tab: 'backgroundImage',
                    backgroundImage: {
                      ...prev.backgroundImage,
                      src: image.src,
                    },
                  }))
                })
              }}
              onParagraphDialogTabChange={(tab) =>
                setParagraphDialog({ ...paragraphDialog, open: true, tab })
              }
              onParagraphDialogClose={() =>
                setParagraphDialog({ ...paragraphDialog, open: false })
              }
              onApplyParagraphProperties={({ value, backgroundImage }) =>
                commandContext.applyParagraphProperties(value, backgroundImage)
              }
              customCssDialog={customCssDialog}
              onCustomCssDialogClose={() =>
                setCustomCssDialog((prev) => ({ ...prev, open: false }))
              }
              onApplyCustomCss={(css) => commandContext.applyCustomCss(css)}
              pageDialog={pageDialog}
              enablePageProperties={enablePageProperties && pageLayoutAllowed}
              onPageCustomImagePick={() => {
                resolvedBackgroundImagePicker?.onPick((image) => {
                  setPageDialog((prev) => ({
                    ...prev,
                    tab: 'paragraph',
                    paragraphTab: 'backgroundImage',
                    value: {
                      ...prev.value,
                      backgroundImage: {
                        ...prev.value.backgroundImage,
                        src: image.src,
                      },
                    },
                  }))
                })
              }}
              onPageDialogTabChange={(tab) => setPageDialog({ ...pageDialog, open: true, tab })}
              onPageDialogClose={() => setPageDialog({ ...pageDialog, open: false })}
              onApplyPageProperties={(draft) => commandContext.applyPageProperties(draft)}
              onPageDialogResetAtRule={() => {
                const root = resolveActiveVisualRoot()
                if (!root || modeRef.current !== 'visual') return
                const pageHtml = enableMultiPagesRef.current
                  ? resolveActivePageHtml()
                  : extractFontStylesheets(htmlRef.current).body
                const result = resetPageAtRuleInDocument(root, pageHtml)
                if (!result.changed) return
                recordVisualHtmlFromRoot(root, false, result.pageHtml)
                setPageDialog((prev) => ({
                  ...prev,
                  value: {
                    ...prev.value,
                    atRule: emptyPageAtRuleApply(),
                  },
                }))
              }}
              deletePageConfirmOpen={deletePageConfirmOpen}
              onDeletePageConfirmClose={() => setDeletePageConfirmOpen(false)}
              onDeletePageConfirm={() => {
                runDeleteSelectedPage()
                setDeletePageConfirmOpen(false)
              }}
              customStyleDialog={customStyleDialog}
              canDeleteCustomParagraphStyle={Boolean(onDeleteCustomParagraphStyle)}
              customStyleBusy={customStyleBusy}
              onCustomStyleDialogClose={() => setCustomStyleDialog({ open: false })}
              onCustomStyleSave={async (style) => {
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
              onCustomStyleDelete={async (id) => {
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
              linkDialog={linkDialog}
              onLinkDialogTabChange={(tab) => setLinkDialog({ ...linkDialog, open: true, tab })}
              onLinkDialogClose={() => setLinkDialog({ ...linkDialog, open: false })}
              onApplyLink={(draft) => commandContext.applyLink(draft)}
              bookmarkDialog={bookmarkDialog}
              onBookmarkDialogClose={() => setBookmarkDialog({ ...bookmarkDialog, open: false })}
              onApplyBookmark={(name) => commandContext.applyBookmark(name)}
              imageDialogOpen={imageDialog.open}
              customImagePicker={customImagePicker}
              customAudioPicker={customAudioPicker}
              customVideoPicker={customVideoPicker}
              onImageDialogClose={() => setImageDialog({ open: false })}
              onApplyImage={(draft) => commandContext.applyImage(draft)}
              onImageDialogCustomPick={() => {
                setImageDialog({ open: false })
                customImagePicker?.onPick(insertCustomImage)
              }}
              audioDialogOpen={audioDialog.open}
              onAudioDialogClose={() => setAudioDialog({ open: false })}
              onApplyAudio={(draft) => commandContext.applyAudio(draft)}
              onAudioDialogCustomPick={() => {
                setAudioDialog({ open: false })
                customAudioPicker?.onPick(insertCustomAudio)
              }}
              youtubeDialogOpen={youtubeDialog.open}
              onYoutubeDialogClose={() => setYoutubeDialog({ open: false })}
              onApplyYoutube={(draft) => commandContext.applyYoutube(draft)}
              onYoutubeDialogCustomPick={() => {
                setYoutubeDialog({ open: false })
                customVideoPicker?.onPick(insertCustomVideo)
              }}
              imageProperties={imageProperties}
              onImagePropertiesTabChange={(tab) =>
                setImageProperties((prev) => ({ ...prev, tab }))
              }
              onImagePropertiesClose={() =>
                setImageProperties((prev) => ({ ...prev, open: false }))
              }
              onApplyImageProperties={(draft) => commandContext.applyImageProperties(draft)}
              tableDialogOpen={tableDialog.open}
              onTableDialogClose={() => setTableDialog({ open: false })}
              onApplyTable={(draft) => commandContext.applyTable(draft)}
              tableProperties={tableProperties}
              onTablePropertiesClose={() =>
                setTableProperties((prev) => ({ ...prev, open: false }))
              }
              onApplyTableProperties={(draft) => commandContext.applyTableProperties(draft)}
              cellProperties={cellProperties}
              onCellPropertiesClose={() =>
                setCellProperties((prev) => ({ ...prev, open: false }))
              }
              onApplyCellProperties={(draft) => commandContext.applyCellProperties(draft)}
              rowProperties={rowProperties}
              onRowPropertiesClose={() =>
                setRowProperties((prev) => ({ ...prev, open: false }))
              }
              onApplyRowProperties={(draft) => commandContext.applyRowProperties(draft)}
              compatibilityPanelOpen={compatibilityPanelOpen}
              capabilitiesValidation={capabilitiesValidation}
              onCompatibilityPanelClose={() => setCompatibilityPanelOpen(false)}
              isToolbarItemAllowed={capabilityProfile ? isToolbarItemAllowed : undefined}
            />
            <EditorWorkspaceFrame
              toolbarVisible={toolbarVisible}
              toolbarPos={toolbarPos}
              captureChromeSelection={captureChromeSelection}
              toolbarShellProps={toolbarShellProps}
            >
              <EditorWorkspaceHost
                propsRef={workspaceHandlersRef}
                pageStore={pageStore}
                mode={mode}
                enableMultiPages={enableMultiPages}
                contentLocked={contentLocked}
                activePageIndex={activePageIndex}
                hasSelectedPage={hasSelectedPage}
                pageZoomScale={pageZoomScale}
                rulerVisible={rulerVisible}
                rulerUnit={rulerUnit}
                optimizeEmbeddedImages={optimizeEmbeddedImages}
                placeholder={placeholder}
                value={value}
                pagesProp={pagesProp}
                controlledHtml={controlledHtml}
                initialHtml={initialHtml}
                initialStorageHtml={storageHtmlInitial}
                defaultPages={storedInitialPagesRef.current ?? [emptyPageHtml()]}
                ingestedPagesProp={ingestedPagesProp}
                onChange={onChange}
                fontFaces={fontFaces}
                enableComments={enableComments}
                commentsVisible={commentsVisible}
                disabled={disabled}
                locale={locale}
                commentAuthor={commentAuthor}
                activeThreadId={activeThreadId}
                contextMenu={contextMenu}
                commentThreads={commentThreads}
                commands={commands}
                htmlFileDropDragging={htmlFileDrop.dragging}
                selectedImage={selectedImage}
                hiddenContextMenuCommands={capabilityProfile?.hiddenContextMenuCommands}
                pageLayoutEnabled={pageLayoutAllowed}
              />
            </EditorWorkspaceFrame>
            {fullscreen ? <ExitFullscreenButton onClick={() => setFullscreen(false)} /> : null}
          </div>
        </EditorShellProvider>
        </CapabilitiesProvider>
      </ChromeThemeProvider>
    </LocaleProvider>
  )
}

function editorChromeStyle({
  dark,
  toolbarBackground,
  workspaceBackground,
  menuColor,
  menuBackground,
  menuFontSize,
  menuFontFamily,
  border,
}: Pick<
  EditorProps,
  | 'toolbarBackground'
  | 'workspaceBackground'
  | 'menuColor'
  | 'menuBackground'
  | 'menuFontSize'
  | 'menuFontFamily'
  | 'border'
> & { dark: boolean }): CSSProperties | undefined {
  const style: Record<string, string> = {}
  if (workspaceBackground) style['--wysiwyg-workspace-background'] = workspaceBackground
  if (!dark) {
    if (toolbarBackground) style['--wysiwyg-toolbar-background'] = toolbarBackground
    if (menuColor) style['--wysiwyg-menu-color'] = menuColor
    if (menuBackground) style['--wysiwyg-menu-background'] = menuBackground
  }
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
