import type { ToolbarCatalog } from '../../toolbar/types'
import { PagePropertiesIcon, RedoIcon, UndoIcon } from '../../icons'

export const historyCatalog: ToolbarCatalog = {
  menus: {
    edit: {
      id: 'edit',
      labelKey: 'menuEdit',
      ariaKey: 'menuEditAria',
    },
  },
  submenus: {
    page: {
      id: 'page',
      labelKey: 'menuPage',
      ariaKey: 'menuPageAria',
    },
  },
  groups: {
    edit: {
      id: 'edit',
      labelKey: 'toolbarGroupEdit',
    },
  },
  items: {
    undo: {
      id: 'undo',
      command: 'undo',
      icon: UndoIcon,
      labelKey: 'commandUndo',
      ariaKey: 'commandUndoAria',
      enabled: 'canUndo',
    },
    redo: {
      id: 'redo',
      command: 'redo',
      icon: RedoIcon,
      labelKey: 'commandRedo',
      ariaKey: 'commandRedoAria',
      enabled: 'canRedo',
    },
    pageProperties: {
      id: 'pageProperties',
      command: 'openPageProperties',
      icon: PagePropertiesIcon,
      labelKey: 'commandPageProperties',
      ariaKey: 'commandPagePropertiesAria',
      enabled: 'isVisualMode',
    },
  },
}
