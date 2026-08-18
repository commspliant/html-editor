import type { CommandContext, EditorCommands } from '../../core/commandTypes'
import { joinPagesToHtml } from '../../core/multiPage'
import { loadHtml, saveHtml } from './fileDialogs'
import { printHtml, printPagesHtml } from './printHtml'

export function createFileCommands(ctx: CommandContext): Pick<EditorCommands, 'save' | 'open' | 'print'> {
  return {
    save: async () => {
      if (ctx.onSave) {
        const payload = ctx.isMultiPagesEnabled() ? ctx.getAllPagesHtml() : ctx.getHtml()
        await ctx.onSave(payload)
        return
      }
      const html = ctx.isMultiPagesEnabled() ? ctx.getActivePageHtml() : ctx.getHtml()
      await saveHtml(html)
    },
    open: async () => {
      const opened = ctx.onOpen ? await ctx.onOpen() : await loadHtml()
      if (opened === null) return
      if (Array.isArray(opened)) {
        ctx.setHtml(joinPagesToHtml(opened))
        return
      }
      if (ctx.isMultiPagesEnabled()) {
        ctx.setHtml(joinPagesToHtml([opened]))
        return
      }
      ctx.setHtml(opened)
    },
    print: () => {
      if (ctx.isMultiPagesEnabled()) {
        printPagesHtml(ctx.getAllPagesHtml())
        return
      }
      printHtml(ctx.getHtml())
    },
  }
}
