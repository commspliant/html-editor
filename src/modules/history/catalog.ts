import type { ToolbarCatalog } from '../../toolbar/types'
import { RedoIcon, UndoIcon } from '../../icons'

export const historyCatalog: ToolbarCatalog = {
  menus: {
    edit: {
      id: 'edit',
      labelKey: 'menuEdit',
      ariaKey: 'menuEditAria',
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
  },
}
