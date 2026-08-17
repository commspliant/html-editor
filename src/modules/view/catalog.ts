import type { ToolbarCatalog } from '../../toolbar/types'
import { CustomizeToolbarIcon, FullscreenIcon, HtmlIcon, VisualIcon } from '../../icons'

export const viewCatalog: ToolbarCatalog = {
  menus: {
    view: {
      id: 'view',
      labelKey: 'menuView',
      ariaKey: 'menuViewAria',
    },
  },
  submenus: {
    toolbar: {
      id: 'toolbar',
      labelKey: 'menuToolbar',
      ariaKey: 'menuToolbarAria',
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
    customizeToolbar: {
      id: 'customizeToolbar',
      command: 'openCustomizeToolbar',
      icon: CustomizeToolbarIcon,
      labelKey: 'commandCustomizeToolbar',
      ariaKey: 'commandCustomizeToolbarAria',
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
