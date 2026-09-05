import { isMenuSubmenu, MENU_SEPARATOR, type ToolbarLayout, type ToolbarMenuEntry } from '../toolbar/types'
import type { EditorCapabilityProfile } from './types'

function filterMenuEntries(
  items: ToolbarMenuEntry[],
  hidden: ReadonlySet<string>,
): ToolbarMenuEntry[] {
  const result: ToolbarMenuEntry[] = []
  let pendingSeparator = false

  for (const item of items) {
    if (item === MENU_SEPARATOR) {
      pendingSeparator = true
      continue
    }
    if (isMenuSubmenu(item)) {
      const nested = filterMenuEntries(item.items, hidden)
      if (nested.length === 0) continue
      if (pendingSeparator && result.length > 0) {
        result.push(MENU_SEPARATOR)
        pendingSeparator = false
      }
      result.push({ submenu: item.submenu, items: nested })
      continue
    }
    if (hidden.has(item)) continue
    if (pendingSeparator && result.length > 0) {
      result.push(MENU_SEPARATOR)
      pendingSeparator = false
    }
    result.push(item)
  }

  return result
}

export function filterCapabilitiesLayout(
  layout: ToolbarLayout,
  profile: EditorCapabilityProfile | undefined,
): ToolbarLayout {
  if (!profile) return layout
  const hidden = profile.hiddenToolbarItemIds

  const menus = layout.menus
    .map((menu) => ({
      ...menu,
      items: filterMenuEntries(menu.items, hidden),
    }))
    .filter((menu) => menu.items.length > 0)

  const iconGroups = layout.iconGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((id) => !hidden.has(id)),
    }))
    .filter((group) => group.items.length > 0)

  return { menus, iconGroups }
}

export function isToolbarItemAllowedByCapabilities(
  itemId: string,
  profile: EditorCapabilityProfile | undefined,
): boolean {
  if (!profile) return true
  return !profile.hiddenToolbarItemIds.has(itemId)
}
