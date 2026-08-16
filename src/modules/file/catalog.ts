import type { ToolbarCatalog } from '../../toolbar/types'
import { OpenIcon, PrintIcon, SaveIcon } from '../../icons'

export const fileCatalog: ToolbarCatalog = {
  menus: {
    file: {
      id: 'file',
      labelKey: 'menuFile',
      ariaKey: 'menuFileAria',
    },
  },
  groups: {
    file: {
      id: 'file',
      labelKey: 'toolbarGroupFile',
    },
    print: {
      id: 'print',
      labelKey: 'toolbarGroupPrint',
    },
  },
  items: {
    save: {
      id: 'save',
      command: 'save',
      icon: SaveIcon,
      labelKey: 'commandSave',
      ariaKey: 'commandSaveAria',
    },
    open: {
      id: 'open',
      command: 'open',
      icon: OpenIcon,
      labelKey: 'commandOpen',
      ariaKey: 'commandOpenAria',
    },
    print: {
      id: 'print',
      command: 'print',
      icon: PrintIcon,
      labelKey: 'commandPrint',
      ariaKey: 'commandPrintAria',
    },
  },
}
