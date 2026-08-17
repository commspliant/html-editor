import type { CommandContext, EditorCommands, EditorQueries } from '../../core/commandTypes'

export function createViewCommands(
  ctx: CommandContext,
): Pick<
  EditorCommands,
  | 'setVisualMode'
  | 'setHtmlMode'
  | 'toggleFullscreen'
  | 'openCustomizeToolbar'
  | 'openDocumentPreview'
  | 'setLightMode'
  | 'setDarkMode'
> {
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
    openDocumentPreview: () => {
      ctx.openDocumentPreview()
    },
    setLightMode: () => {
      ctx.setDarkMode(false)
    },
    setDarkMode: () => {
      ctx.setDarkMode(true)
    },
  }
}

export function createViewQueries(
  ctx: CommandContext,
): Pick<EditorQueries, 'isVisualMode' | 'isHtmlMode' | 'isFullscreen' | 'isLightMode' | 'isDarkMode'> {
  return {
    isVisualMode: () => ctx.getMode() === 'visual',
    isHtmlMode: () => ctx.getMode() === 'html',
    isFullscreen: () => ctx.getFullscreen(),
    isLightMode: () => !ctx.getDarkMode(),
    isDarkMode: () => ctx.getDarkMode(),
  }
}
