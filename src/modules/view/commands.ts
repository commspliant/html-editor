import type { CommandContext, EditorCommands, EditorQueries } from '../../core/commandTypes'

export function createViewCommands(
  ctx: CommandContext,
): Pick<EditorCommands, 'setVisualMode' | 'setHtmlMode' | 'toggleFullscreen' | 'openCustomizeToolbar'> {
  return {
    setVisualMode: () => {
      ctx.setMode('visual')
    },
    setHtmlMode: () => {
      ctx.setMode('html')
    },
    toggleFullscreen: () => {
      ctx.setFullscreen(!ctx.getFullscreen())
    },
    openCustomizeToolbar: () => {
      ctx.openCustomizeToolbar()
    },
  }
}

export function createViewQueries(
  ctx: CommandContext,
): Pick<EditorQueries, 'isVisualMode' | 'isHtmlMode' | 'isFullscreen'> {
  return {
    isVisualMode: () => ctx.getMode() === 'visual',
    isHtmlMode: () => ctx.getMode() === 'html',
    isFullscreen: () => ctx.getFullscreen(),
  }
}
