import type { ToolbarCatalog, ToolbarLayout } from '../../toolbar/types'
import { capabilitiesCatalog } from './catalog'

export function mergeCapabilitiesCatalog(catalog: ToolbarCatalog): ToolbarCatalog {
  return {
    ...catalog,
    items: {
      ...catalog.items,
      ...capabilitiesCatalog.items,
    },
  }
}

export function mergeCapabilitiesLayout(layout: ToolbarLayout): ToolbarLayout {
  return {
    ...layout,
    menus: layout.menus.map((menu) => {
      if (menu.id !== 'view') return menu
      const items = [...menu.items]
      if (!items.includes('compatibilityCheck')) {
        const previewIndex = items.indexOf('preview')
        const insertAt = previewIndex === -1 ? items.length : previewIndex
        items.splice(insertAt, 0, 'compatibilityCheck')
      }
      return { ...menu, items }
    }),
    iconGroups: layout.iconGroups.map((group) => {
      if (group.id !== 'view') return group
      if (group.items.includes('compatibilityCheck')) return group
      return { ...group, items: [...group.items, 'compatibilityCheck'] }
    }),
  }
}
