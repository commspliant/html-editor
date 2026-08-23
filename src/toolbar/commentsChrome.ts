import type { ToolbarCatalog, ToolbarLayout } from './types'
import { isMenuSubmenu } from './types'
import { commentsCatalog, COMMENT_CHROME_ITEM_IDS } from '../modules/comments/catalog'

export type ChromeLockOptions = {
  disabled: boolean
  readOnly: boolean
  enableComments: boolean
}

const COMMENT_MENU_IDS = new Set(['insert', 'view'])

export function isChromeItemLocked(itemId: string, options: ChromeLockOptions): boolean {
  if (options.disabled) return true
  if (!options.readOnly) return false
  if (!options.enableComments) return true
  return !COMMENT_CHROME_ITEM_IDS.includes(itemId as typeof COMMENT_CHROME_ITEM_IDS[number])
}

export function isMenuTriggerLocked(menuId: string, options: ChromeLockOptions): boolean {
  if (options.disabled) return true
  if (!options.readOnly) return false
  if (!options.enableComments) return true
  return !COMMENT_MENU_IDS.has(menuId)
}

export function mergeCommentsCatalog(
  catalog: ToolbarCatalog,
  commentsVisible: boolean,
): ToolbarCatalog {
  const toggleLabelKey = commentsVisible ? 'hideComments' : 'showComments'
  const toggleItem = commentsCatalog.items.toggleCommentsVisible
  return {
    ...catalog,
    items: {
      ...catalog.items,
      ...commentsCatalog.items,
      toggleCommentsVisible: toggleItem
        ? { ...toggleItem, labelKey: toggleLabelKey }
        : toggleItem,
    },
  }
}

export function mergeCommentsLayout(layout: ToolbarLayout): ToolbarLayout {
  return {
    ...layout,
    menus: layout.menus.map((menu) => {
      if (menu.id === 'insert') {
        const items = [...menu.items]
        const pageIndex = items.findIndex(
          (item) => isMenuSubmenu(item) && item.submenu === 'insertPage',
        )
        const insertAt = pageIndex === -1 ? items.length : pageIndex
        if (!items.includes('insertComment')) {
          items.splice(insertAt, 0, 'insertComment')
        }
        return { ...menu, items }
      }
      if (menu.id === 'view') {
        const items = [...menu.items]
        const previewIndex = items.indexOf('preview')
        const insertAt = previewIndex === -1 ? items.length : previewIndex
        if (!items.includes('toggleCommentsVisible')) {
          items.splice(insertAt, 0, 'toggleCommentsVisible')
        }
        return { ...menu, items }
      }
      return menu
    }),
    iconGroups: layout.iconGroups.map((group) => {
      if (group.id === 'insert' && !group.items.includes('addComment')) {
        return { ...group, items: [...group.items, 'addComment'] }
      }
      if (group.id === 'view' && !group.items.includes('toggleCommentsVisible')) {
        return { ...group, items: [...group.items, 'toggleCommentsVisible'] }
      }
      return group
    }),
  }
}
