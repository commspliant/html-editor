import { HelpIcon } from '../../icons'
import type { ToolbarCatalog } from '../../toolbar/types'

export const helpCatalog: ToolbarCatalog = {
  menus: {
    help: {
      id: 'help',
      labelKey: 'menuHelp',
      ariaKey: 'menuHelpAria',
    },
  },
  groups: {},
  items: {
    editorHelp: {
      id: 'editorHelp',
      command: 'openHelp',
      icon: HelpIcon,
      labelKey: 'commandEditorHelp',
      ariaKey: 'commandEditorHelpAria',
    },
    keyboardShortcuts: {
      id: 'keyboardShortcuts',
      command: 'openKeyboardShortcuts',
      icon: HelpIcon,
      labelKey: 'commandKeyboardShortcuts',
      ariaKey: 'commandKeyboardShortcutsAria',
    },
    about: {
      id: 'about',
      command: 'openAbout',
      icon: HelpIcon,
      labelKey: 'commandAbout',
      ariaKey: 'commandAboutAria',
    },
  },
}
