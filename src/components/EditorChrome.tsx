import { memo } from 'react'
import type {
  AudioApply,
  CellPropertiesApply,
  FontDialogTab,
  FontPropertiesApply,
  ImageApply,
  ImageDialogTab,
  ImagePropertiesApply,
  LinkApply,
  LinkDialogTab,
  PageDialogTab,
  PagePropertiesApply,
  ParagraphDialogTab,
  ParagraphPropertiesApply,
  RowPropertiesApply,
  TableApply,
  TablePropertiesApply,
  YoutubeApply,
  EditorCommands,
  EditorQueries,
} from '../core/commandTypes'
import type { PageBackgroundImageApply } from '../core/pageBackgroundImage'
import type { FontMarkState } from '../core/marks'
import type {
  FontFamilyQuery,
  FontFace,
} from '../core/fontFamily'
import type { FontSizeQuery } from '../core/fontSize'
import type { InlineColorQuery } from '../core/inlineColor'
import { FontPropertiesDialog } from '../modules/format/FontPropertiesDialog'
import { ParagraphPropertiesDialog } from '../modules/format/ParagraphPropertiesDialog'
import { PagePropertiesDialog } from '../modules/format/PagePropertiesDialog'
import { DeletePageConfirmDialog } from '../modules/format/DeletePageConfirmDialog'
import { CustomParagraphStyleDialog } from '../modules/format/CustomParagraphStyleDialog'
import { CustomCssDialog } from '../modules/format/CustomCssDialog'
import { BookmarkDialog } from '../modules/insert/BookmarkDialog'
import { AudioDialog } from '../modules/insert/AudioDialog'
import { ImageDialog } from '../modules/insert/ImageDialog'
import { ImagePropertiesDialog } from '../modules/insert/ImagePropertiesDialog'
import { LinkDialog } from '../modules/insert/LinkDialog'
import { YoutubeDialog } from '../modules/insert/YoutubeDialog'
import { TableDialog } from '../modules/table/TableDialog'
import { TablePropertiesDialog } from '../modules/table/TablePropertiesDialog'
import { CellPropertiesDialog } from '../modules/table/CellPropertiesDialog'
import { RowPropertiesDialog } from '../modules/table/RowPropertiesDialog'
import { DocumentPreviewDialog } from '../modules/view/DocumentPreviewDialog'
import { AboutDialog } from '../modules/help/AboutDialog'
import { HelpDialog } from '../modules/help/HelpDialog'
import type { HelpTopicId } from '../modules/help/articles'
import { EditorToolbar } from '../toolbar'
import type { ChromeLockOptions } from '../toolbar/commentsChrome'
import type { ToolbarCatalog, ToolbarLayout } from '../toolbar/types'
import type { ToolbarQueryRevisions } from '../toolbar/toolbarQueryRevisions'
import { buildToolbarShellProps } from '../toolbar/toolbarShellProps'
import { CustomizeToolbarDialog } from '../toolbar/CustomizeToolbarDialog'
import type { CapabilityValidationResult } from '../capabilities/types'
import { CompatibilityPanel } from '../modules/capabilities'
import type {
  CustomAudioPicker,
  CustomImagePicker,
  CustomParagraphStyle,
  CustomParagraphStyleFont,
  CustomParagraphStyleParagraph,
  CustomVideoPicker,
  ToolbarCustomization,
} from '../types'
import styles from './Editor.module.css'

export type EditorFontDialogState = {
  open: boolean
  tab: FontDialogTab
}

export type EditorParagraphDialogState = {
  open: boolean
  tab: ParagraphDialogTab
  value: ParagraphPropertiesApply
  backgroundImage: PageBackgroundImageApply
}

export type EditorCustomCssDialogState = {
  open: boolean
  value: string
}

export type EditorPageDialogState = {
  open: boolean
  tab: PageDialogTab
  paragraphTab: ParagraphDialogTab
  value: PagePropertiesApply
}

export type EditorCustomStyleDialogState =
  | { open: false }
  | {
      open: true
      mode: 'create'
      font: CustomParagraphStyleFont
      paragraph: CustomParagraphStyleParagraph
    }
  | { open: true; mode: 'edit'; style: CustomParagraphStyle }

export type EditorLinkDialogState = {
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
}

export type EditorBookmarkDialogState = {
  open: boolean
  existingIds: string[]
}

export type EditorImagePropertiesState = {
  open: boolean
  tab: ImageDialogTab
  value: ImagePropertiesApply
  aspectRatio: number
}

export type EditorTablePropertiesState = {
  open: boolean
  value: TablePropertiesApply
}

export type EditorCellPropertiesState = {
  open: boolean
  value: CellPropertiesApply
}

export type EditorRowPropertiesState = {
  open: boolean
  value: RowPropertiesApply
}

export type EditorDocumentPreviewState = {
  open: boolean
  html: string
}

export type EditorHelpDialogState = {
  open: boolean
  topicId: HelpTopicId
}

export type EditorChromeProps = {
  menuVisible: boolean
  captureChromeSelection: () => void

  displayCatalog: ToolbarCatalog
  displayLayout: ToolbarLayout
  commands: EditorCommands
  queries: EditorQueries
  queryRevisions?: ToolbarQueryRevisions
  chromeDisabled: boolean
  chromeLock: ChromeLockOptions

  contentLocked: boolean

  customizeToolbarOpen: boolean
  baseCatalog: ToolbarCatalog
  allowedLayout: ToolbarLayout
  toolbarSettings: ToolbarCustomization | null
  toolbarSettingsLoading: boolean
  toolbarSettingsBusy: boolean
  onCustomizeToolbarClose: () => void
  onToolbarSettingsChange: (next: ToolbarCustomization) => void
  onToolbarSettingsReset: () => void

  documentPreview: EditorDocumentPreviewState
  onDocumentPreviewClose: () => void

  helpDialog: EditorHelpDialogState
  onHelpDialogClose: () => void
  onHelpTopicChange: (topicId: HelpTopicId) => void

  aboutDialogOpen: boolean
  onAboutDialogClose: () => void

  compatibilityPanelOpen?: boolean
  capabilitiesValidation?: CapabilityValidationResult | null
  onCompatibilityPanelClose?: () => void
  isToolbarItemAllowed?: (itemId: string) => boolean

  fontDialog: EditorFontDialogState
  fontSizeState: FontSizeQuery
  markState: FontMarkState
  fontFamilyState: FontFamilyQuery
  fontColorState: InlineColorQuery
  highlightColorState: InlineColorQuery
  fontFaces: FontFace[]
  onFontDialogTabChange: (tab: FontDialogTab) => void
  onFontDialogClose: () => void
  onApplyFontProperties: (draft: FontPropertiesApply) => void

  paragraphDialog: EditorParagraphDialogState
  customBackgroundImagePicker?: CustomImagePicker
  disableBuiltinBackgroundImageSources?: boolean
  onParagraphCustomImagePick: () => void
  onParagraphDialogTabChange: (tab: ParagraphDialogTab) => void
  onParagraphDialogClose: () => void
  onApplyParagraphProperties: (draft: {
    value: ParagraphPropertiesApply
    backgroundImage: PageBackgroundImageApply
  }) => void

  customCssDialog: EditorCustomCssDialogState
  onCustomCssDialogClose: () => void
  onApplyCustomCss: (css: string) => void

  pageDialog: EditorPageDialogState
  enablePageProperties: boolean
  onPageCustomImagePick: () => void
  onPageDialogTabChange: (tab: PageDialogTab) => void
  onPageDialogClose: () => void
  onApplyPageProperties: (draft: PagePropertiesApply) => void
  onPageDialogResetAtRule: () => void

  deletePageConfirmOpen: boolean
  onDeletePageConfirmClose: () => void
  onDeletePageConfirm: () => void

  customStyleDialog: EditorCustomStyleDialogState
  canDeleteCustomParagraphStyle: boolean
  customStyleBusy: boolean
  onCustomStyleDialogClose: () => void
  onCustomStyleSave: (style: CustomParagraphStyle) => void | Promise<void>
  onCustomStyleDelete: (id: string) => void | Promise<void>

  linkDialog: EditorLinkDialogState
  onLinkDialogTabChange: (tab: LinkDialogTab) => void
  onLinkDialogClose: () => void
  onApplyLink: (draft: LinkApply) => void

  bookmarkDialog: EditorBookmarkDialogState
  onBookmarkDialogClose: () => void
  onApplyBookmark: (name: string) => void

  imageDialogOpen: boolean
  customImagePicker?: CustomImagePicker
  customAudioPicker?: CustomAudioPicker
  customVideoPicker?: CustomVideoPicker
  onImageDialogClose: () => void
  onApplyImage: (draft: ImageApply) => void
  onImageDialogCustomPick: () => void

  audioDialogOpen: boolean
  onAudioDialogClose: () => void
  onApplyAudio: (draft: AudioApply) => void
  onAudioDialogCustomPick: () => void

  youtubeDialogOpen: boolean
  onYoutubeDialogClose: () => void
  onApplyYoutube: (draft: YoutubeApply) => void
  onYoutubeDialogCustomPick: () => void

  imageProperties: EditorImagePropertiesState
  onImagePropertiesTabChange: (tab: ImageDialogTab) => void
  onImagePropertiesClose: () => void
  onApplyImageProperties: (draft: ImagePropertiesApply) => void

  tableDialogOpen: boolean
  onTableDialogClose: () => void
  onApplyTable: (draft: TableApply) => void

  tableProperties: EditorTablePropertiesState
  onTablePropertiesClose: () => void
  onApplyTableProperties: (draft: TablePropertiesApply) => void

  cellProperties: EditorCellPropertiesState
  onCellPropertiesClose: () => void
  onApplyCellProperties: (draft: CellPropertiesApply) => void

  rowProperties: EditorRowPropertiesState
  onRowPropertiesClose: () => void
  onApplyRowProperties: (draft: RowPropertiesApply) => void
}

function editorChromePropsAreEqual(prev: EditorChromeProps, next: EditorChromeProps): boolean {
  for (const key of Object.keys(prev) as (keyof EditorChromeProps)[]) {
    const prevValue = prev[key]
    const nextValue = next[key]
    if (typeof prevValue === 'function' && typeof nextValue === 'function') continue
    if (prevValue !== nextValue) return false
  }
  return true
}

export const EditorChrome = memo(function EditorChrome({
  menuVisible,
  captureChromeSelection,
  displayCatalog,
  displayLayout,
  commands,
  queries,
  queryRevisions,
  chromeDisabled,
  chromeLock,
  contentLocked,
  customizeToolbarOpen,
  baseCatalog,
  allowedLayout,
  toolbarSettings,
  toolbarSettingsLoading,
  toolbarSettingsBusy,
  onCustomizeToolbarClose,
  onToolbarSettingsChange,
  onToolbarSettingsReset,
  documentPreview,
  onDocumentPreviewClose,
  helpDialog,
  onHelpDialogClose,
  onHelpTopicChange,
  aboutDialogOpen,
  onAboutDialogClose,
  compatibilityPanelOpen = false,
  capabilitiesValidation = null,
  onCompatibilityPanelClose,
  isToolbarItemAllowed,
  fontDialog,
  fontSizeState,
  markState,
  fontFamilyState,
  fontColorState,
  highlightColorState,
  fontFaces,
  onFontDialogTabChange,
  onFontDialogClose,
  onApplyFontProperties,
  paragraphDialog,
  customBackgroundImagePicker,
  disableBuiltinBackgroundImageSources,
  onParagraphCustomImagePick,
  onParagraphDialogTabChange,
  onParagraphDialogClose,
  onApplyParagraphProperties,
  customCssDialog,
  onCustomCssDialogClose,
  onApplyCustomCss,
  pageDialog,
  enablePageProperties,
  onPageCustomImagePick,
  onPageDialogTabChange,
  onPageDialogClose,
  onApplyPageProperties,
  onPageDialogResetAtRule,
  deletePageConfirmOpen,
  onDeletePageConfirmClose,
  onDeletePageConfirm,
  customStyleDialog,
  canDeleteCustomParagraphStyle,
  customStyleBusy,
  onCustomStyleDialogClose,
  onCustomStyleSave,
  onCustomStyleDelete,
  linkDialog,
  onLinkDialogTabChange,
  onLinkDialogClose,
  onApplyLink,
  bookmarkDialog,
  onBookmarkDialogClose,
  onApplyBookmark,
  imageDialogOpen,
  customImagePicker,
  customAudioPicker,
  customVideoPicker,
  onImageDialogClose,
  onApplyImage,
  onImageDialogCustomPick,
  audioDialogOpen,
  onAudioDialogClose,
  onApplyAudio,
  onAudioDialogCustomPick,
  youtubeDialogOpen,
  onYoutubeDialogClose,
  onApplyYoutube,
  onYoutubeDialogCustomPick,
  imageProperties,
  onImagePropertiesTabChange,
  onImagePropertiesClose,
  onApplyImageProperties,
  tableDialogOpen,
  onTableDialogClose,
  onApplyTable,
  tableProperties,
  onTablePropertiesClose,
  onApplyTableProperties,
  cellProperties,
  onCellPropertiesClose,
  onApplyCellProperties,
  rowProperties,
  onRowPropertiesClose,
  onApplyRowProperties,
}: EditorChromeProps) {
  const toolbarShellProps = buildToolbarShellProps({
    catalog: displayCatalog,
    layout: displayLayout,
    commands,
    queries,
    queryRevisions,
    disabled: chromeDisabled,
    chromeLock,
  })

  return (
    <>
      {menuVisible ? (
        <div className={styles.menuChrome} onPointerDownCapture={captureChromeSelection}>
          <EditorToolbar {...toolbarShellProps} menuVisible toolbarVisible={false} />
        </div>
      ) : null}
      {customizeToolbarOpen ? (
        <CustomizeToolbarDialog
          open
          catalog={baseCatalog}
          groups={allowedLayout.iconGroups}
          settings={toolbarSettings}
          loading={toolbarSettingsLoading}
          busy={toolbarSettingsBusy}
          disabled={contentLocked}
          isItemAllowed={isToolbarItemAllowed}
          onChange={onToolbarSettingsChange}
          onReset={onToolbarSettingsReset}
          onClose={onCustomizeToolbarClose}
        />
      ) : null}
      {documentPreview.open ? (
        <DocumentPreviewDialog
          open
          html={documentPreview.html}
          onClose={onDocumentPreviewClose}
        />
      ) : null}
      {helpDialog.open ? (
        <HelpDialog
          open
          topicId={helpDialog.topicId}
          onTopicChange={onHelpTopicChange}
          onClose={onHelpDialogClose}
        />
      ) : null}
      {aboutDialogOpen ? <AboutDialog open onClose={onAboutDialogClose} /> : null}
      {compatibilityPanelOpen ? (
        <CompatibilityPanel
          open
          result={capabilitiesValidation}
          onClose={() => onCompatibilityPanelClose?.()}
        />
      ) : null}
      {fontDialog.open ? (
        <FontPropertiesDialog
          open
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
          disabled={contentLocked}
          onTabChange={onFontDialogTabChange}
          onApply={onApplyFontProperties}
          onClose={onFontDialogClose}
        />
      ) : null}
      {paragraphDialog.open ? (
        <ParagraphPropertiesDialog
          open
          tab={paragraphDialog.tab}
          value={paragraphDialog.value}
          backgroundImage={paragraphDialog.backgroundImage}
          disabled={contentLocked}
          customImagePicker={customBackgroundImagePicker}
          disableBuiltinBackgroundImageSources={disableBuiltinBackgroundImageSources}
          onCustomImagePick={onParagraphCustomImagePick}
          onTabChange={onParagraphDialogTabChange}
          onApply={onApplyParagraphProperties}
          onClose={onParagraphDialogClose}
        />
      ) : null}
      {customCssDialog.open ? (
        <CustomCssDialog
          open
          value={customCssDialog.value}
          disabled={contentLocked}
          onApply={onApplyCustomCss}
          onClose={onCustomCssDialogClose}
        />
      ) : null}
      {pageDialog.open ? (
        <PagePropertiesDialog
          open
          tab={pageDialog.tab}
          initialParagraphTab={pageDialog.paragraphTab}
          value={pageDialog.value}
          fonts={fontFaces}
          disabled={contentLocked}
          printTabVisible={enablePageProperties}
          customImagePicker={customBackgroundImagePicker}
          disableBuiltinBackgroundImageSources={disableBuiltinBackgroundImageSources}
          onCustomImagePick={onPageCustomImagePick}
          onTabChange={onPageDialogTabChange}
          onApply={onApplyPageProperties}
          onResetAtRule={onPageDialogResetAtRule}
          onClose={onPageDialogClose}
        />
      ) : null}
      {deletePageConfirmOpen ? (
        <DeletePageConfirmDialog
          open
          disabled={contentLocked}
          onClose={onDeletePageConfirmClose}
          onConfirm={onDeletePageConfirm}
        />
      ) : null}
      {customStyleDialog.open ? (
        <CustomParagraphStyleDialog
          open
          mode={customStyleDialog.mode}
          styleId={
            customStyleDialog.mode === 'edit' ? customStyleDialog.style.id : undefined
          }
          name={
            customStyleDialog.mode === 'edit' ? customStyleDialog.style.name : ''
          }
          font={
            customStyleDialog.mode === 'edit'
              ? customStyleDialog.style.font
              : customStyleDialog.font
          }
          paragraph={
            customStyleDialog.mode === 'edit'
              ? customStyleDialog.style.paragraph
              : customStyleDialog.paragraph
          }
          canDelete={canDeleteCustomParagraphStyle}
          fonts={fontFaces}
          busy={customStyleBusy}
          disabled={contentLocked}
          onSave={onCustomStyleSave}
          onDelete={onCustomStyleDelete}
          onClose={onCustomStyleDialogClose}
        />
      ) : null}
      {linkDialog.open ? (
        <LinkDialog
          open
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
          disabled={contentLocked}
          onTabChange={onLinkDialogTabChange}
          onApply={onApplyLink}
          onClose={onLinkDialogClose}
        />
      ) : null}
      {bookmarkDialog.open ? (
        <BookmarkDialog
          open
          existingIds={bookmarkDialog.existingIds}
          disabled={contentLocked}
          onApply={onApplyBookmark}
          onClose={onBookmarkDialogClose}
        />
      ) : null}
      {imageDialogOpen ? (
        <ImageDialog
          open
          disabled={contentLocked}
          customImagePicker={customImagePicker}
          onApply={onApplyImage}
          onCustomPick={onImageDialogCustomPick}
          onClose={onImageDialogClose}
        />
      ) : null}
      {audioDialogOpen ? (
        <AudioDialog
          open
          disabled={contentLocked}
          customAudioPicker={customAudioPicker}
          onApply={onApplyAudio}
          onCustomPick={onAudioDialogCustomPick}
          onClose={onAudioDialogClose}
        />
      ) : null}
      {youtubeDialogOpen ? (
        <YoutubeDialog
          open
          disabled={contentLocked}
          customVideoPicker={customVideoPicker}
          onApply={onApplyYoutube}
          onCustomPick={onYoutubeDialogCustomPick}
          onClose={onYoutubeDialogClose}
        />
      ) : null}
      {imageProperties.open ? (
        <ImagePropertiesDialog
          open
          tab={imageProperties.tab}
          value={imageProperties.value}
          aspectRatio={imageProperties.aspectRatio}
          disabled={contentLocked}
          onTabChange={onImagePropertiesTabChange}
          onApply={onApplyImageProperties}
          onClose={onImagePropertiesClose}
        />
      ) : null}
      {tableDialogOpen ? (
        <TableDialog
          open
          disabled={contentLocked}
          onApply={onApplyTable}
          onClose={onTableDialogClose}
        />
      ) : null}
      {tableProperties.open ? (
        <TablePropertiesDialog
          open
          value={tableProperties.value}
          disabled={contentLocked}
          onApply={onApplyTableProperties}
          onClose={onTablePropertiesClose}
        />
      ) : null}
      {cellProperties.open ? (
        <CellPropertiesDialog
          open
          value={cellProperties.value}
          disabled={contentLocked}
          onApply={onApplyCellProperties}
          onClose={onCellPropertiesClose}
        />
      ) : null}
      {rowProperties.open ? (
        <RowPropertiesDialog
          open
          value={rowProperties.value}
          disabled={contentLocked}
          onApply={onApplyRowProperties}
          onClose={onRowPropertiesClose}
        />
      ) : null}
    </>
  )
}, editorChromePropsAreEqual)
