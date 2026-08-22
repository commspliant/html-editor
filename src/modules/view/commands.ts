import type { CommandContext, EditorCommands, EditorQueries } from '../../core/commandTypes'
import type { PageZoomPreset } from '../../types'
import { PAGE_ZOOM_PRESETS } from '../../core/pageZoom'

function createPageZoomSetter(ctx: CommandContext, zoom: PageZoomPreset) {
  return () => {
    ctx.setPageZoom(zoom)
  }
}

function createPageZoomQuery(ctx: CommandContext, zoom: PageZoomPreset) {
  return () => ctx.getPageZoom() === zoom
}

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
  | 'setPageZoomFitWidth'
  | 'setPageZoomFitPage'
  | 'setPageZoom50'
  | 'setPageZoom75'
  | 'setPageZoom100'
  | 'setPageZoom125'
  | 'setPageZoom150'
  | 'setPageZoom200'
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
    setPageZoomFitWidth: createPageZoomSetter(ctx, 'fitWidth'),
    setPageZoomFitPage: createPageZoomSetter(ctx, 'fitPage'),
    setPageZoom50: createPageZoomSetter(ctx, 50),
    setPageZoom75: createPageZoomSetter(ctx, 75),
    setPageZoom100: createPageZoomSetter(ctx, 100),
    setPageZoom125: createPageZoomSetter(ctx, 125),
    setPageZoom150: createPageZoomSetter(ctx, 150),
    setPageZoom200: createPageZoomSetter(ctx, 200),
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
  | 'isPageZoomFitWidth'
  | 'isPageZoomFitPage'
  | 'isPageZoom50'
  | 'isPageZoom75'
  | 'isPageZoom100'
  | 'isPageZoom125'
  | 'isPageZoom150'
  | 'isPageZoom200'
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
    isPageZoomFitWidth: createPageZoomQuery(ctx, 'fitWidth'),
    isPageZoomFitPage: createPageZoomQuery(ctx, 'fitPage'),
    isPageZoom50: createPageZoomQuery(ctx, 50),
    isPageZoom75: createPageZoomQuery(ctx, 75),
    isPageZoom100: createPageZoomQuery(ctx, 100),
    isPageZoom125: createPageZoomQuery(ctx, 125),
    isPageZoom150: createPageZoomQuery(ctx, 150),
    isPageZoom200: createPageZoomQuery(ctx, 200),
    isToolbarPositionTop: () => ctx.getToolbarPosition() === 'top',
    isToolbarPositionLeft: () => ctx.getToolbarPosition() === 'left',
    isToolbarPositionRight: () => ctx.getToolbarPosition() === 'right',
    isToolbarPositionBottom: () => ctx.getToolbarPosition() === 'bottom',
    isReadingAloud: () => ctx.isReadingAloud(),
    canReadAloud: () => ctx.canReadAloud(),
  }
}

export { PAGE_ZOOM_PRESETS }
