import type { CommandContext, EditorCommands } from '../../core/commandTypes'
import { loadHtml, saveHtml } from './fileDialogs'
import { printHtml } from './printHtml'

export function createFileCommands(ctx: CommandContext): Pick<EditorCommands, 'save' | 'open' | 'print'> {
  return {
    save: async () => {
      await saveHtml(ctx.getHtml())
    },
    open: async () => {
      const html = await loadHtml()
      if (html !== null) {
        ctx.setHtml(html)
      }
    },
    print: () => {
      printHtml(ctx.getHtml())
    },
  }
}
