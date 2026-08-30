import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from 'react'
import { normalizeCaretInPageShell } from '../core/page'
import { isPageCanvasSized, type PageMarginSidesPx } from '../core/pageCanvasLayout'
import { preservePageAtRuleInBody, queryPageAtRule } from '../core/pageAtRule'
import {
  collectPreviewFontStylesheets,
  extractFontStylesheets,
  FONT_STYLESHEET_ATTR,
  type FontFace,
} from '../core/fontFamily'
import {
  commentThreadElementAtPoint,
  syncCommentAnchorsToDom,
  setCommentHighlightsVisible,
} from '../core/comments/anchors'
import { findCommentThread } from '../core/comments/threads'
import type { EditorCommands } from '../core/commandTypes'
import { queryPageSurface } from '../core/multiPage'
import { useControllableState } from '../hooks/useControllableState'
import type { PageStore } from '../hooks/usePageStore'
import { useVisualPageBodies } from '../hooks/useVisualPageBodies'
import { CommentPanel } from '../modules/comments/CommentPanel'
import { ContextMenu, type ContextMenuKind } from '../modules/contextMenu'
import { useT } from '../i18n/LocaleProvider'
import type {
  CommentAuthor,
  CommentThread,
  EditorMode,
} from '../types'
import type { Locale } from '../i18n/types'
import { HtmlSurface } from './HtmlSurface'
import { HtmlPageTabs } from './HtmlPageTabs'
import { VisualSurface } from './VisualSurface'
import {
  MultiPageVisualSurface,
  type MultiPageVisualSurfaceHandle,
} from './MultiPageVisualSurface'
import { ImageResizeOverlay } from '../modules/insert/ImageResizeOverlay'
import { useEditorShellContext } from './EditorShellContext'
import type { EditorDocumentBridgeHandle } from './editorDocumentBridgeTypes'
import styles from './Editor.module.css'

export type EditorContextMenuState = {
  open: boolean
  x: number
  y: number
  kind: ContextMenuKind
  inTable: boolean
  canMergeCells: boolean
  canUnmergeCells: boolean
  canDeletePage: boolean
  canAddComment: boolean
}

export type EditorWorkspaceHandlers = {
  multiPageVisualRef: MutableRefObject<MultiPageVisualSurfaceHandle | null>
  workspaceRef: MutableRefObject<HTMLDivElement | null>
  suppressPageFlushRef: MutableRefObject<boolean>
  pendingInsertPageFocusRef: MutableRefObject<number | null>
  visualRootRef: MutableRefObject<HTMLDivElement | null>
  visualPropSyncGuardRef: MutableRefObject<(() => void) | null>
  htmlAreaRef: MutableRefObject<HTMLTextAreaElement | null>
  commentPanelRef: MutableRefObject<HTMLDivElement | null>
  activePageIndexRef: MutableRefObject<number>
  htmlModePageHtmlRef: MutableRefObject<string>
  activePageHtmlRef: MutableRefObject<string>
  pageCanvasSizedRef: MutableRefObject<boolean>
  setActivePageIndex: (index: number) => void
  setHasSelectedPage: (value: boolean) => void
  setActiveThreadId: (id: string | null) => void
  setContextMenu: Dispatch<SetStateAction<EditorContextMenuState>>
  recordVisualInputHtml: (body: string, coalesce: boolean) => void
  recordPageVisualHtml: (index: number, html: string, coalesce: boolean) => void
  handleVisualBeforeInput: (event: InputEvent) => void
  handleVisualPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  handleVisualMouseUp: (event: ReactMouseEvent<HTMLDivElement>) => void
  handleVisualContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => void
  handleHtmlPageTabSelect: (index: number) => void
  handleHtmlSurfaceChange: (next: string) => void
  handleImageResize: (width: number, height: number) => void
  handleImageResizeEnd: () => void
  multiPageRulerMarginPreview: (pageIndex: number, sides: PageMarginSidesPx) => void
  multiPageRulerMarginChange: (pageIndex: number, sides: PageMarginSidesPx) => void
  multiPageRulerIndentChange: (indent: {
    firstLineIndentPx?: number
    leftIndentPx?: number
    rightIndentPx?: number
  }) => void
  singlePageRulerMarginPreview: (sides: PageMarginSidesPx) => void
  singlePageRulerMarginChange: (sides: PageMarginSidesPx) => void
  singlePageRulerIndentChange: (indent: {
    firstLineIndentPx?: number
    leftIndentPx?: number
    rightIndentPx?: number
  }) => void
  resolveEmbeddedImageDataUrl?: (id: string) => string | null
  hydrateExportHtml: (html: string) => string
  postCommentMessage: (message: string) => void
  htmlFileDrop: {
    dragging: boolean
    onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void
  }
}

export type EditorWorkspaceHostProps = {
  propsRef: MutableRefObject<EditorWorkspaceHandlers>
  pageStore: PageStore
  mode: EditorMode
  enableMultiPages: boolean
  contentLocked: boolean
  activePageIndex: number
  hasSelectedPage: boolean
  pageZoomScale: number
  rulerVisible: boolean
  rulerUnit: 'in' | 'cm' | 'mm' | 'pt'
  optimizeEmbeddedImages: boolean
  placeholder?: string
  value?: string
  pagesProp?: string[]
  controlledHtml?: string
  initialHtml: string
  initialStorageHtml: string
  defaultPages: readonly string[]
  ingestedPagesProp?: string[]
  onChange?: (html: string) => void
  fontFaces: FontFace[]
  enableComments: boolean
  commentsVisible: boolean
  disabled?: boolean
  locale: Locale
  commentAuthor?: CommentAuthor
  activeThreadId: string | null
  contextMenu: EditorContextMenuState
  commentThreads: readonly CommentThread[]
  commands: EditorCommands
  htmlFileDropDragging: boolean
  selectedImage: HTMLImageElement | null
}

function workspaceHostPropsAreEqual(
  prev: EditorWorkspaceHostProps,
  next: EditorWorkspaceHostProps,
): boolean {
  for (const key of Object.keys(prev) as (keyof EditorWorkspaceHostProps)[]) {
    const prevValue = prev[key]
    const nextValue = next[key]
    if (typeof prevValue === 'function' && typeof nextValue === 'function') continue
    if (prevValue !== nextValue) return false
  }
  return true
}

function HtmlFileDropOverlay() {
  const t = useT()
  return (
    <div className={styles.htmlFileDropOverlay} aria-hidden="true">
      {t('htmlFileDropOverlay')}
    </div>
  )
}

function EditorWorkspaceHostInner({
  propsRef,
  pageStore,
  mode,
  enableMultiPages,
  contentLocked,
  activePageIndex,
  hasSelectedPage,
  pageZoomScale,
  rulerVisible,
  rulerUnit,
  optimizeEmbeddedImages,
  placeholder,
  controlledHtml,
  initialHtml,
  initialStorageHtml,
  defaultPages,
  ingestedPagesProp,
  onChange,
  fontFaces,
  enableComments,
  commentsVisible,
  disabled,
  locale,
  commentAuthor,
  activeThreadId,
  contextMenu,
  commentThreads,
  commands,
  htmlFileDropDragging,
  selectedImage,
}: EditorWorkspaceHostProps) {
  const { htmlRef, pagesRef, documentBridgeRef } = useEditorShellContext()

  const [storageHtml, setStorageHtml] = useState(initialStorageHtml)
  const [html, setHtml] = useControllableState({
    value: optimizeEmbeddedImages ? undefined : controlledHtml,
    defaultValue: initialHtml,
    onChange: enableMultiPages ? undefined : optimizeEmbeddedImages ? undefined : onChange,
  })
  const editorHtml = optimizeEmbeddedImages ? storageHtml : html

  const [htmlModePageHtml, setHtmlModePageHtml] = useState(() =>
    enableMultiPages ? (defaultPages[0] ?? '') : '',
  )
  const htmlModePageHtmlRef = useRef(htmlModePageHtml)
  htmlModePageHtmlRef.current = htmlModePageHtml

  const handlers = propsRef.current

  if (!optimizeEmbeddedImages) {
    htmlRef.current = html
  } else if (!enableMultiPages) {
    htmlRef.current = storageHtml
  }
  if (enableMultiPages) {
    pagesRef.current = pageStore.pages
  }

  const getEditorHtml = useCallback((): string => {
    if (enableMultiPages) {
      return pageStore.getJoinedHtml()
    }
    return optimizeEmbeddedImages ? storageHtml : html
  }, [enableMultiPages, html, optimizeEmbeddedImages, pageStore, storageHtml])

  useLayoutEffect(() => {
    const bridge: EditorDocumentBridgeHandle = {
      pageStore,
      setHtml,
      setStorageHtml,
      getEditorHtml,
      replacePagesFromHistory: (pages) => pageStore.replacePages([...pages]),
    }
    documentBridgeRef.current = bridge
    return () => {
      if (documentBridgeRef.current === bridge) {
        documentBridgeRef.current = null
      }
    }
  }, [documentBridgeRef, getEditorHtml, pageStore, setHtml, setStorageHtml])

  const previewFontKey = useMemo(() => {
    if (enableMultiPages) {
      const page = pageStore.pages[activePageIndex] ?? pageStore.pages[0] ?? ''
      return collectPreviewFontStylesheets(page, fontFaces).join('\n')
    }
    return collectPreviewFontStylesheets(editorHtml, fontFaces).join('\n')
  }, [
    enableMultiPages,
    pageStore.pages,
    pageStore.revision,
    activePageIndex,
    editorHtml,
    fontFaces,
  ])

  const visualPageBodies = useVisualPageBodies(
    enableMultiPages ? pageStore.pages : [],
    enableMultiPages ? pageStore.revision : 0,
  )

  useLayoutEffect(() => {
    if (!enableMultiPages) return
    const surface = propsRef.current.multiPageVisualRef.current?.getActivePageRoot()
    if (surface instanceof HTMLDivElement) {
      propsRef.current.visualRootRef.current = surface
    }
  }, [enableMultiPages, activePageIndex, visualPageBodies.length, propsRef])

  const activePageHtml = useMemo(() => {
    if (enableMultiPages) {
      const rulerContextIndex = hasSelectedPage ? activePageIndex : 0
      return visualPageBodies[rulerContextIndex] ?? ''
    }
    return extractFontStylesheets(editorHtml).body
  }, [enableMultiPages, visualPageBodies, activePageIndex, hasSelectedPage, editorHtml])

  const pageCanvasSized = useMemo(
    () => isPageCanvasSized(queryPageAtRule(activePageHtml)),
    [activePageHtml],
  )

  handlers.activePageHtmlRef.current = activePageHtml
  handlers.pageCanvasSizedRef.current = pageCanvasSized

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

  useEffect(() => {
    if (!enableComments || mode !== 'visual' || !commentsVisible) {
      propsRef.current.setActiveThreadId(null)
    }
  }, [enableComments, mode, commentsVisible, propsRef])

  useEffect(() => {
    if (!activeThreadId) return
    const onPointerDown = (event: PointerEvent) => {
      const h = propsRef.current
      const target = event.target as Node
      if (h.commentPanelRef.current?.contains(target)) return
      const root = h.visualRootRef.current
      if (root && commentThreadElementAtPoint(root, target)) return
      h.setActiveThreadId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeThreadId, propsRef])

  useEffect(() => {
    if (!enableMultiPages || mode !== 'html') return
    const pageHtml = pageStore.pages[activePageIndex] ?? ''
    if (pageHtml === htmlModePageHtmlRef.current) return
    htmlModePageHtmlRef.current = pageHtml
    setHtmlModePageHtml(pageHtml)
  }, [enableMultiPages, mode, pageStore.pages, pageStore.revision, activePageIndex])

  useEffect(() => {
    if (!enableComments || mode !== 'visual') return
    const root = propsRef.current.visualRootRef.current
    if (!root) return
    syncCommentAnchorsToDom(root, commentThreads)
    setCommentHighlightsVisible(root, commentsVisible)
  }, [enableComments, mode, commentThreads, commentsVisible, editorHtml, propsRef])

  handlers.htmlModePageHtmlRef.current = htmlModePageHtmlRef.current

  const showRulerChrome = mode === 'visual' && rulerVisible && pageCanvasSized

  const activeCommentThread = useMemo(
    () => (activeThreadId ? findCommentThread(commentThreads, activeThreadId) : null),
    [activeThreadId, commentThreads],
  )

  const visualSurface =
    mode === 'visual' ? (
      enableMultiPages ? (
        <MultiPageVisualSurface
          ref={handlers.multiPageVisualRef}
          pages={visualPageBodies}
          activePageIndex={activePageIndex}
          hasSelectedPage={hasSelectedPage}
          scrollRootRef={handlers.workspaceRef}
          suppressPageFlushRef={handlers.suppressPageFlushRef}
          pendingInsertPageFocusRef={handlers.pendingInsertPageFocusRef}
          onActivePageIndexChange={(index) => {
            handlers.activePageIndexRef.current = index
            handlers.setActivePageIndex(index)
            const container = handlers.multiPageVisualRef.current?.getContainer()
            const surface = container ? queryPageSurface(container, index) : null
            if (surface instanceof HTMLDivElement) {
              handlers.visualRootRef.current = surface
            }
          }}
          onPageSelected={() => {
            handlers.setHasSelectedPage(true)
          }}
          onPageChange={(index, next) => {
            const previous = pagesRef.current[index] ?? ''
            handlers.recordPageVisualHtml(
              index,
              preservePageAtRuleInBody(next, extractFontStylesheets(previous).body),
              true,
            )
          }}
          onPageFlush={(index, next) => {
            const previous = pagesRef.current[index] ?? ''
            handlers.recordPageVisualHtml(
              index,
              preservePageAtRuleInBody(next, extractFontStylesheets(previous).body),
              false,
            )
          }}
          onBeforeInput={handlers.handleVisualBeforeInput}
          onPointerDown={(event) => {
            if (event.currentTarget instanceof HTMLDivElement) {
              handlers.visualRootRef.current = event.currentTarget
            }
            handlers.handleVisualPointerDown(event)
            if (event.currentTarget instanceof HTMLDivElement) {
              const surface = event.currentTarget
              requestAnimationFrame(() => normalizeCaretInPageShell(surface))
            }
          }}
          onMouseUp={handlers.handleVisualMouseUp}
          onContextMenu={handlers.handleVisualContextMenu}
          placeholder={placeholder}
          disabled={contentLocked}
          rulerVisible={rulerVisible}
          rulerUnit={rulerUnit}
          zoomScale={pageZoomScale}
          onMarginPreview={handlers.multiPageRulerMarginPreview}
          onMarginChange={handlers.multiPageRulerMarginChange}
          onIndentChange={handlers.multiPageRulerIndentChange}
          resolveEmbeddedImageDataUrl={
            optimizeEmbeddedImages ? handlers.resolveEmbeddedImageDataUrl : undefined
          }
          hydrateEmbeddedImages={optimizeEmbeddedImages ? handlers.hydrateExportHtml : undefined}
        />
      ) : (
        <VisualSurface
          ref={handlers.visualRootRef}
          html={extractFontStylesheets(editorHtml).body}
          pageHtml={editorHtml}
          rulerVisible={rulerVisible}
          rulerUnit={rulerUnit}
          zoomScale={pageZoomScale}
          propSyncGuardRef={handlers.visualPropSyncGuardRef}
          resolveEmbeddedImageDataUrl={
            optimizeEmbeddedImages ? handlers.resolveEmbeddedImageDataUrl : undefined
          }
          hydrateEmbeddedImages={optimizeEmbeddedImages ? handlers.hydrateExportHtml : undefined}
          onMarginPreview={handlers.singlePageRulerMarginPreview}
          onMarginChange={handlers.singlePageRulerMarginChange}
          onIndentChange={handlers.singlePageRulerIndentChange}
          onChange={(next) => handlers.recordVisualInputHtml(next, true)}
          onBeforeInput={handlers.handleVisualBeforeInput}
          onPointerDown={(event) => {
            handlers.handleVisualPointerDown(event)
            if (event.currentTarget instanceof HTMLDivElement) {
              const surface = event.currentTarget
              requestAnimationFrame(() => normalizeCaretInPageShell(surface))
            }
          }}
          onMouseUp={handlers.handleVisualMouseUp}
          onContextMenu={handlers.handleVisualContextMenu}
          placeholder={placeholder}
          disabled={contentLocked}
        />
      )
    ) : (
      <div className={styles.htmlModeShell}>
        {enableMultiPages && pageStore.pages.length > 1 ? (
          <HtmlPageTabs
            pageCount={pageStore.pages.length}
            activeIndex={activePageIndex}
            onSelect={handlers.handleHtmlPageTabSelect}
          />
        ) : null}
        <HtmlSurface
          ref={handlers.htmlAreaRef}
          html={enableMultiPages ? htmlModePageHtml : editorHtml}
          onChange={handlers.handleHtmlSurfaceChange}
          placeholder={placeholder}
          disabled={contentLocked}
        />
      </div>
    )

  return (
    <>
      <div
        ref={handlers.workspaceRef}
        className={`${styles.workspace} ${pageCanvasSized ? styles.workspacePageSized : ''} ${showRulerChrome ? styles.workspaceWithRuler : ''}`}
        onDragEnter={handlers.htmlFileDrop.onDragEnter}
        onDragOver={handlers.htmlFileDrop.onDragOver}
        onDragLeave={handlers.htmlFileDrop.onDragLeave}
        onDrop={handlers.htmlFileDrop.onDrop}
      >
        {mode === 'visual' ? (
          <div
            className={styles.pageCanvasViewport}
            data-page-canvas-sized={pageCanvasSized ? '' : undefined}
          >
            {visualSurface}
          </div>
        ) : (
          visualSurface
        )}
        {handlers.htmlFileDrop.dragging ? <HtmlFileDropOverlay /> : null}
      </div>
      {mode === 'visual' && !contentLocked && selectedImage?.isConnected ? (
        <ImageResizeOverlay
          img={selectedImage}
          onResize={handlers.handleImageResize}
          onResizeEnd={handlers.handleImageResizeEnd}
        />
      ) : null}
      {enableComments && commentsVisible && activeCommentThread ? (
        <CommentPanel
          panelRef={handlers.commentPanelRef}
          thread={activeCommentThread}
          locale={locale}
          disabled={disabled}
          commentAuthor={commentAuthor}
          onPost={handlers.postCommentMessage}
          onClose={() => handlers.setActiveThreadId(null)}
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
        canDeletePage={contextMenu.canDeletePage}
        canAddComment={contextMenu.canAddComment}
        commands={commands}
        onClose={() => handlers.setContextMenu((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}

export const EditorWorkspaceHost = memo(EditorWorkspaceHostInner, workspaceHostPropsAreEqual)
