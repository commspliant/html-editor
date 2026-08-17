import type { AllowedChrome } from '../types'
import type { ToolbarLayout } from './types'

export function filterAllowedChrome(
  layout: ToolbarLayout,
  allowedChrome?: AllowedChrome,
): ToolbarLayout {
  if (!allowedChrome) return layout

  const menuAllowlist = allowedChrome.menus
  const toolbarAllowlist = allowedChrome.toolbar
  if (menuAllowlist === undefined && toolbarAllowlist === undefined) return layout

  const menus =
    menuAllowlist === undefined
      ? layout.menus
      : layout.menus.filter((menu) => menuAllowlist.includes(menu.id))

  const iconGroups =
    toolbarAllowlist === undefined
      ? layout.iconGroups
      : layout.iconGroups
          .map((group) => ({
            id: group.id,
            items: group.items.filter((id) => toolbarAllowlist.includes(id)),
          }))
          .filter((group) => group.items.length > 0)

  return { menus, iconGroups }
}
