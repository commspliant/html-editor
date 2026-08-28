import type { CommandContext, EditorCommands, EditorQueries, ImageDialogTab, LinkDialogTab } from '../../core/commandTypes'

export function createInsertCommands(
  ctx: CommandContext,
): Pick<
  EditorCommands,
  | 'openLinkDialog'
  | 'applyLink'
  | 'openBookmarkDialog'
  | 'applyBookmark'
  | 'openImageDialog'
  | 'openPageBackgroundImage'
  | 'openParagraphBackgroundImage'
  | 'applyImage'
  | 'openAudioDialog'
  | 'applyAudio'
  | 'openYoutubeDialog'
  | 'applyYoutube'
  | 'openImageProperties'
  | 'applyImageProperties'
  | 'insertHorizontalRule'
  | 'insertPageBreak'
  | 'insertPageBefore'
  | 'insertPageAfter'
  | 'deletePage'
> {
  return {
    openLinkDialog: (tab?: LinkDialogTab) => {
      ctx.openLinkDialog(tab)
    },
    applyLink: (draft) => {
      ctx.applyLink(draft)
    },
    openBookmarkDialog: () => {
      ctx.openBookmarkDialog()
    },
    applyBookmark: (name) => {
      ctx.applyBookmark(name)
    },
    openImageDialog: () => {
      ctx.openImageDialog()
    },
    openPageBackgroundImage: () => {
      ctx.openPageBackgroundImage()
    },
    openParagraphBackgroundImage: () => {
      ctx.openParagraphBackgroundImage()
    },
    applyImage: (draft) => {
      ctx.applyImage(draft)
    },
    openAudioDialog: () => {
      ctx.openAudioDialog()
    },
    applyAudio: (draft) => {
      ctx.applyAudio(draft)
    },
    openYoutubeDialog: () => {
      ctx.openYoutubeDialog()
    },
    applyYoutube: (draft) => {
      ctx.applyYoutube(draft)
    },
    openImageProperties: (tab?: ImageDialogTab) => {
      ctx.openImageProperties(tab)
    },
    applyImageProperties: (draft) => {
      ctx.applyImageProperties(draft)
    },
    insertHorizontalRule: () => {
      ctx.insertHorizontalRule()
    },
    insertPageBreak: () => {
      ctx.insertPageBreak()
    },
    insertPageBefore: () => {
      ctx.insertPageBefore()
    },
    insertPageAfter: () => {
      ctx.insertPageAfter()
    },
    deletePage: () => {
      ctx.deletePage()
    },
  }
}

export function createInsertQueries(
  ctx: CommandContext,
): Pick<
  EditorQueries,
  | 'isLink'
  | 'isImageSelected'
  | 'isMultiPagesEnabled'
  | 'hasSelectedPage'
  | 'canDeletePage'
  | 'canInsertPageBackgroundImage'
  | 'canInsertParagraphBackgroundImage'
> {
  return {
    isLink: () => ctx.isLink(),
    isImageSelected: () => ctx.isImageSelected(),
    isMultiPagesEnabled: () => ctx.isMultiPagesEnabled(),
    hasSelectedPage: () => ctx.hasSelectedPage(),
    canDeletePage: () => ctx.canDeletePage(),
    canInsertPageBackgroundImage: () => ctx.canInsertPageBackgroundImage(),
    canInsertParagraphBackgroundImage: () => ctx.canInsertParagraphBackgroundImage(),
  }
}
