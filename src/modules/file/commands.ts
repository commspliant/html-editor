import type { CommandContext, EditorCommands } from '../../core/commandTypes'
import { loadHtml, saveHtml } from './fileDialogs'
import { printHtml } from './printHtml'

export function createFileCommands(ctx: CommandContext): Pick<EditorCommands, 'save' | 'open' | 'print'> {
  return {
    save: async () => {
      const html = ctx.getHtml()
      if (ctx.onSave) {
        await ctx.onSave(html)
      } else {
        await saveHtml(html)
      }
    },
    open: async () => {
      const html = ctx.onOpen ? await ctx.onOpen() : await loadHtml()
      if (html !== null) {
        ctx.setHtml(html)
      }
    },
    print: () => {
      printHtml(ctx.getHtml())
    },
  }
}
