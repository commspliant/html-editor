import type { ToolbarCatalog } from '../../toolbar/types'
import { FullscreenIcon, HtmlIcon, VisualIcon } from '../../icons'

export const viewCatalog: ToolbarCatalog = {
  menus: {
    view: {
      id: 'view',
      labelKey: 'menuView',
      ariaKey: 'menuViewAria',
    },
  },
  groups: {
    view: {
      id: 'view',
      labelKey: 'toolbarGroupView',
    },
    fullscreen: {
      id: 'fullscreen',
      labelKey: 'toolbarGroupFullscreen',
    },
  },
  items: {
    visual: {
      id: 'visual',
      command: 'setVisualMode',
      icon: VisualIcon,
      labelKey: 'modeVisual',
      ariaKey: 'modeVisualAria',
      active: 'isVisualMode',
    },
    html: {
      id: 'html',
      command: 'setHtmlMode',
      icon: HtmlIcon,
      labelKey: 'modeHtml',
      ariaKey: 'modeHtmlAria',
      active: 'isHtmlMode',
    },
    fullscreen: {
      id: 'fullscreen',
      command: 'toggleFullscreen',
      icon: FullscreenIcon,
      labelKey: 'modeFullscreen',
      ariaKey: 'modeFullscreenAria',
      active: 'isFullscreen',
      toggle: true,
    },
  },
}
