import { useState } from 'react'
import type {
  CellPropertiesApply,
  FontDialogTab,
  ImageDialogTab,
  ImagePropertiesApply,
  LinkDialogTab,
  PageDialogTab,
  PagePropertiesApply,
  ParagraphDialogTab,
  ParagraphPropertiesApply,
  RowPropertiesApply,
  TablePropertiesApply,
} from '../core/commandTypes'
import { defaultCellPropertiesApply } from '../core/cellProperties'
import { defaultImagePropertiesApply } from '../core/imageProperties'
import { emptyPageBackgroundImageApply, type PageBackgroundImageApply } from '../core/pageBackgroundImage'
import { emptyPagePropertiesApply } from '../core/pageProperties'
import {
  emptyParagraphPropertiesApply,
} from '../core/paragraphProperties'
import { defaultRowPropertiesApply } from '../core/rowProperties'
import { defaultTablePropertiesApply } from '../core/tableProperties'
import type { HelpTopicId } from '../modules/help/articles'
import type {
  CustomParagraphStyle,
  CustomParagraphStyleFont,
  CustomParagraphStyleParagraph,
  ToolbarCustomization,
} from '../types'

export function useEditorDialogState() {
  const [fontDialog, setFontDialog] = useState<{ open: boolean; tab: FontDialogTab }>({
    open: false,
    tab: 'general',
  })
  const [customizeToolbarOpen, setCustomizeToolbarOpen] = useState(false)
  const [documentPreview, setDocumentPreview] = useState({ open: false, html: '' })
  const [toolbarSettings, setToolbarSettings] = useState<ToolbarCustomization | null>(null)
  const [toolbarSettingsLoading, setToolbarSettingsLoading] = useState(false)
  const [toolbarSettingsBusy, setToolbarSettingsBusy] = useState(false)
  const [paragraphDialog, setParagraphDialog] = useState<{
    open: boolean
    tab: ParagraphDialogTab
    value: ParagraphPropertiesApply
    backgroundImage: PageBackgroundImageApply
  }>({
    open: false,
    tab: 'general',
    value: emptyParagraphPropertiesApply(),
    backgroundImage: emptyPageBackgroundImageApply(),
  })
  const [customCssDialog, setCustomCssDialog] = useState<{ open: boolean; value: string }>({
    open: false,
    value: '',
  })
  const [pageDialog, setPageDialog] = useState<{
    open: boolean
    tab: PageDialogTab
    paragraphTab: ParagraphDialogTab
    value: PagePropertiesApply
  }>({
    open: false,
    tab: 'font',
    paragraphTab: 'spacing',
    value: emptyPagePropertiesApply(),
  })
  const [deletePageConfirmOpen, setDeletePageConfirmOpen] = useState(false)
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
  const [helpDialog, setHelpDialog] = useState<{
    open: boolean
    topicId: HelpTopicId
  }>({
    open: false,
    topicId: 'getStarted',
  })
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  return {
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
  }
}
