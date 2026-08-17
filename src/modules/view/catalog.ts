import type { ToolbarCatalog } from '../../toolbar/types'
import {
  CustomizeToolbarIcon,
  DarkModeIcon,
  FullscreenIcon,
  HtmlIcon,
  LightModeIcon,
  PreviewIcon,
  VisualIcon,
} from '../../icons'

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
    toolbarPosition: {
      id: 'toolbarPosition',
      labelKey: 'menuToolbarPosition',
      ariaKey: 'menuToolbarPositionAria',
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
    toolbarPositionTop: {
      id: 'toolbarPositionTop',
      command: 'setToolbarPositionTop',
      labelKey: 'toolbarPositionTop',
      ariaKey: 'toolbarPositionTopAria',
      active: 'isToolbarPositionTop',
    },
    toolbarPositionLeft: {
      id: 'toolbarPositionLeft',
      command: 'setToolbarPositionLeft',
      labelKey: 'toolbarPositionLeft',
      ariaKey: 'toolbarPositionLeftAria',
      active: 'isToolbarPositionLeft',
    },
    toolbarPositionRight: {
      id: 'toolbarPositionRight',
      command: 'setToolbarPositionRight',
      labelKey: 'toolbarPositionRight',
      ariaKey: 'toolbarPositionRightAria',
      active: 'isToolbarPositionRight',
    },
    toolbarPositionBottom: {
      id: 'toolbarPositionBottom',
      command: 'setToolbarPositionBottom',
      labelKey: 'toolbarPositionBottom',
      ariaKey: 'toolbarPositionBottomAria',
      active: 'isToolbarPositionBottom',
    },
    lightMode: {
      id: 'lightMode',
      command: 'setLightMode',
      icon: LightModeIcon,
      labelKey: 'modeLight',
      ariaKey: 'modeLightAria',
      active: 'isLightMode',
    },
    darkMode: {
      id: 'darkMode',
      command: 'setDarkMode',
      icon: DarkModeIcon,
      labelKey: 'modeDark',
      ariaKey: 'modeDarkAria',
      active: 'isDarkMode',
    },
    preview: {
      id: 'preview',
      command: 'openDocumentPreview',
      icon: PreviewIcon,
      labelKey: 'commandPreview',
      ariaKey: 'commandPreviewAria',
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
