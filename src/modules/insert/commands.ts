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
  | 'openImageProperties'
  | 'applyImageProperties'
  | 'insertHorizontalRule'
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
    openImageProperties: (tab?: ImageDialogTab) => {
      ctx.openImageProperties(tab)
    },
    applyImageProperties: (draft) => {
      ctx.applyImageProperties(draft)
    },
    insertHorizontalRule: () => {
      ctx.insertHorizontalRule()
    },
  }
}

export function createInsertQueries(ctx: CommandContext): Pick<EditorQueries, 'isLink' | 'isImageSelected'> {
  return {
    isLink: () => ctx.isLink(),
    isImageSelected: () => ctx.isImageSelected(),
  }
}
