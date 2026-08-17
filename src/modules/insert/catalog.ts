import type { ToolbarCatalog } from '../../toolbar/types'
import { BookmarkIcon, HorizontalRuleIcon, ImageIcon, LinkIcon } from '../../icons'

export const insertCatalog: ToolbarCatalog = {
  menus: {
    insert: {
      id: 'insert',
      labelKey: 'menuInsert',
      ariaKey: 'menuInsertAria',
    },
  },
  groups: {
    insert: {
      id: 'insert',
      labelKey: 'toolbarGroupInsert',
    },
  },
  items: {
    link: {
      id: 'link',
      command: 'openLinkDialog',
      icon: LinkIcon,
      labelKey: 'commandLink',
      ariaKey: 'commandLinkAria',
      enabled: 'isVisualMode',
      active: 'isLink',
      toggle: true,
    },
    bookmark: {
      id: 'bookmark',
      command: 'openBookmarkDialog',
      icon: BookmarkIcon,
      labelKey: 'commandBookmark',
      ariaKey: 'commandBookmarkAria',
      enabled: 'isVisualMode',
    },
    image: {
      id: 'image',
      command: 'openImageDialog',
      icon: ImageIcon,
      labelKey: 'commandImage',
      ariaKey: 'commandImageAria',
      enabled: 'isVisualMode',
    },
    horizontalRule: {
      id: 'horizontalRule',
      command: 'insertHorizontalRule',
      icon: HorizontalRuleIcon,
      labelKey: 'commandHorizontalRule',
      ariaKey: 'commandHorizontalRuleAria',
      enabled: 'isVisualMode',
    },
  },
}
