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
  | 'applyImage'
  | 'openAudioDialog'
  | 'applyAudio'
  | 'openYoutubeDialog'
  | 'applyYoutube'
  | 'openImageProperties'
  | 'applyImageProperties'
  | 'insertHorizontalRule'
  | 'insertPage'
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
    insertPage: () => {
      ctx.insertPage()
    },
  }
}

export function createInsertQueries(
  ctx: CommandContext,
): Pick<EditorQueries, 'isLink' | 'isImageSelected' | 'isMultiPagesEnabled' | 'canInsertPage'> {
  return {
    isLink: () => ctx.isLink(),
    isImageSelected: () => ctx.isImageSelected(),
    isMultiPagesEnabled: () => ctx.isMultiPagesEnabled(),
    canInsertPage: () => ctx.isMultiPagesEnabled() && ctx.getMode() === 'visual',
  }
}
