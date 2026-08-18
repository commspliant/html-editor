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
  | 'toggleReadAloud'
  | 'setLightMode'
  | 'setDarkMode'
  | 'setToolbarPositionTop'
  | 'setToolbarPositionLeft'
  | 'setToolbarPositionRight'
  | 'setToolbarPositionBottom'
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
    toggleReadAloud: () => {
      ctx.toggleReadAloud()
    },
    setLightMode: () => {
      ctx.setDarkMode(false)
    },
    setDarkMode: () => {
      ctx.setDarkMode(true)
    },
    setToolbarPositionTop: () => {
      ctx.setToolbarPosition('top')
    },
    setToolbarPositionLeft: () => {
      ctx.setToolbarPosition('left')
    },
    setToolbarPositionRight: () => {
      ctx.setToolbarPosition('right')
    },
    setToolbarPositionBottom: () => {
      ctx.setToolbarPosition('bottom')
    },
  }
}

export function createViewQueries(
  ctx: CommandContext,
): Pick<
  EditorQueries,
  | 'isVisualMode'
  | 'isHtmlMode'
  | 'isFullscreen'
  | 'isLightMode'
  | 'isDarkMode'
  | 'isToolbarPositionTop'
  | 'isToolbarPositionLeft'
  | 'isToolbarPositionRight'
  | 'isToolbarPositionBottom'
  | 'isReadingAloud'
  | 'canReadAloud'
> {
  return {
    isVisualMode: () => ctx.getMode() === 'visual',
    isHtmlMode: () => ctx.getMode() === 'html',
    isFullscreen: () => ctx.getFullscreen(),
    isLightMode: () => !ctx.getDarkMode(),
    isDarkMode: () => ctx.getDarkMode(),
    isToolbarPositionTop: () => ctx.getToolbarPosition() === 'top',
    isToolbarPositionLeft: () => ctx.getToolbarPosition() === 'left',
    isToolbarPositionRight: () => ctx.getToolbarPosition() === 'right',
    isToolbarPositionBottom: () => ctx.getToolbarPosition() === 'bottom',
    isReadingAloud: () => ctx.isReadingAloud(),
    canReadAloud: () => ctx.canReadAloud(),
  }
}
