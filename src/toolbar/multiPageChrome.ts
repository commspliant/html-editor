import { isMenuSubmenu, type ToolbarLayout } from './types'

export function filterInsertPageLayout(layout: ToolbarLayout, visible: boolean): ToolbarLayout {
  if (visible) return layout
  return {
    ...layout,
    menus: layout.menus.map((menu) => {
      if (menu.id !== 'insert') return menu
      return {
        ...menu,
        items: menu.items.filter(
          (item) => !(isMenuSubmenu(item) && item.submenu === 'insertPage'),
        ),
      }
    }),
  }
}
