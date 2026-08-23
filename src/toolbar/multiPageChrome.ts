import { isMenuSubmenu, MENU_SEPARATOR, type ToolbarLayout } from './types'

export function filterMultiPageLayout(layout: ToolbarLayout, visible: boolean): ToolbarLayout {
  if (visible) return layout
  return {
    ...layout,
    menus: layout.menus.map((menu) => {
      if (menu.id === 'insert') {
        return {
          ...menu,
          items: menu.items.filter(
            (item) => !(isMenuSubmenu(item) && item.submenu === 'insertPage'),
          ),
        }
      }
      if (menu.id === 'edit') {
        return {
          ...menu,
          items: menu.items.map((item) => {
            if (!isMenuSubmenu(item) || item.submenu !== 'page') return item
            let items = item.items.filter((subItem) => subItem !== 'deletePage')
            if (items.at(-1) === MENU_SEPARATOR) {
              items = items.slice(0, -1)
            }
            return { ...item, items }
          }),
        }
      }
      return menu
    }),
  }
}

/** @deprecated Use {@link filterMultiPageLayout} */
export function filterInsertPageLayout(layout: ToolbarLayout, visible: boolean): ToolbarLayout {
  return filterMultiPageLayout(layout, visible)
}
