import { CustomActionIcon } from '../icons'
import type { CustomAction, CustomActionApi } from '../types'
import {
  isMenuSeparator,
  isMenuSubmenu,
  MENU_SEPARATOR,
  type ToolbarCatalog,
  type ToolbarItem,
  type ToolbarLayout,
  type ToolbarMenuEntry,
} from '../toolbar/types'

export const BUILTIN_TOOLBAR_ITEM_IDS = new Set([
  'save',
  'open',
  'print',
  'undo',
  'redo',
  'link',
  'bookmark',
  'horizontalRule',
  'pageBreak',
  'insertPage',
  'visual',
  'html',
  'customizeToolbar',
  'toolbarPositionTop',
  'toolbarPositionLeft',
  'toolbarPositionRight',
  'toolbarPositionBottom',
  'lightMode',
  'darkMode',
  'preview',
  'readAloud',
  'fullscreen',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'clearFormatting',
  'formatBrush',
  'fontSize',
  'fontFamily',
  'paragraphStyle',
  'fontProperties',
  'customCss',
  'paragraphProperties',
  'pageProperties',
  'imageProperties',
  'fontColor',
  'highlightColor',
  'alignLeft',
  'alignCenter',
  'alignRight',
  'alignJustify',
  'indent',
  'outdent',
  'bulletList',
  'numberedList',
  'table',
  'insertRowBelow',
  'insertRowBefore',
  'deleteRow',
  'insertColumnAfter',
  'insertColumnBefore',
  'deleteColumn',
  'mergeCells',
  'unmergeCells',
  'tableProperties',
  'cellProperties',
  'rowProperties',
])

const BUILTIN_MENU_IDS = new Set(['file', 'edit', 'insert', 'table', 'view', 'format'])

export const DEFAULT_CUSTOM_MENU_ID = 'custom'
export const DEFAULT_CUSTOM_GROUP_ID = 'custom'

export function customCommandName(id: string): string {
  return `custom:${id}`
}

function showsInMenu(showIn: CustomAction['showIn']): boolean {
  return showIn === 'menu' || showIn === 'both'
}

function showsInToolbar(showIn: CustomAction['showIn']): boolean {
  return showIn === 'toolbar' || showIn === 'both'
}

function cloneMenuEntries(entries: ToolbarMenuEntry[]): ToolbarMenuEntry[] {
  return entries.map((entry) =>
    isMenuSubmenu(entry) ? { submenu: entry.submenu, items: cloneMenuEntries(entry.items) } : entry,
  )
}

function cloneLayout(layout: ToolbarLayout): ToolbarLayout {
  return {
    menus: layout.menus.map((menu) => ({ id: menu.id, items: cloneMenuEntries(menu.items) })),
    iconGroups: layout.iconGroups.map((group) => ({ id: group.id, items: [...group.items] })),
  }
}

function isBuiltinMenuEntry(entry: ToolbarMenuEntry): boolean {
  if (isMenuSeparator(entry)) return true
  if (isMenuSubmenu(entry)) return entry.items.every(isBuiltinMenuEntry)
  return BUILTIN_TOOLBAR_ITEM_IDS.has(entry)
}

function menuContainsItem(entries: ToolbarMenuEntry[], id: string): boolean {
  for (const entry of entries) {
    if (entry === id) return true
    if (isMenuSubmenu(entry) && menuContainsItem(entry.items, id)) return true
  }
  return false
}

function toToolbarItem(action: CustomAction): ToolbarItem {
  const tooltip = action.tooltip ?? action.label
  return {
    id: action.id,
    command: customCommandName(action.id),
    icon: action.icon ?? CustomActionIcon,
    label: action.label,
    ariaLabel: action.label,
    tooltip,
  }
}

function ensureMenu(catalog: ToolbarCatalog, layout: ToolbarLayout, menuId: string, label?: string) {
  if (!catalog.menus[menuId]) {
    if (menuId === DEFAULT_CUSTOM_MENU_ID && !label) {
      catalog.menus[menuId] = {
        id: menuId,
        labelKey: 'menuCustom',
        ariaKey: 'menuCustomAria',
      }
    } else {
      const resolved = label ?? menuId
      catalog.menus[menuId] = {
        id: menuId,
        label: resolved,
        ariaLabel: resolved,
      }
    }
  } else if (label && !catalog.menus[menuId].label && !BUILTIN_MENU_IDS.has(menuId)) {
    catalog.menus[menuId] = {
      ...catalog.menus[menuId],
      label,
      ariaLabel: label,
    }
  }

  if (!layout.menus.some((menu) => menu.id === menuId)) {
    layout.menus.push({ id: menuId, items: [] })
  }
}

function ensureGroup(catalog: ToolbarCatalog, layout: ToolbarLayout, groupId: string) {
  if (!catalog.groups[groupId]) {
    if (groupId === DEFAULT_CUSTOM_GROUP_ID) {
      catalog.groups[groupId] = {
        id: groupId,
        labelKey: 'toolbarGroupCustom',
      }
    } else {
      catalog.groups[groupId] = {
        id: groupId,
        label: groupId,
      }
    }
  }

  if (!layout.iconGroups.some((group) => group.id === groupId)) {
    const group = { id: groupId, items: [] }
    const fullscreenIndex = layout.iconGroups.findIndex((entry) => entry.items.includes('fullscreen'))
    if (fullscreenIndex === -1) {
      layout.iconGroups.push(group)
    } else {
      layout.iconGroups.splice(fullscreenIndex, 0, group)
    }
  }
}

export function mergeCustomActions(
  actions: CustomAction[] | undefined,
  catalog: ToolbarCatalog,
  layout: ToolbarLayout,
): { catalog: ToolbarCatalog; layout: ToolbarLayout } {
  const nextCatalog: ToolbarCatalog = {
    menus: { ...catalog.menus },
    submenus: { ...catalog.submenus },
    groups: { ...catalog.groups },
    items: { ...catalog.items },
  }
  const nextLayout = cloneLayout(layout)

  for (const action of actions ?? []) {
    if (BUILTIN_TOOLBAR_ITEM_IDS.has(action.id) || isMenuSeparator(action.id)) continue

    nextCatalog.items[action.id] = toToolbarItem(action)

    if (showsInMenu(action.showIn)) {
      const menuId = action.menu?.id ?? DEFAULT_CUSTOM_MENU_ID
      ensureMenu(nextCatalog, nextLayout, menuId, action.menu?.label)
      const menu = nextLayout.menus.find((entry) => entry.id === menuId)
      if (menu && !menuContainsItem(menu.items, action.id)) {
        const last = menu.items[menu.items.length - 1]
        if (last !== undefined && !isMenuSeparator(last)) {
          const hasOnlyBuiltins = menu.items.every(isBuiltinMenuEntry)
          if (hasOnlyBuiltins) {
            menu.items.push(MENU_SEPARATOR)
          }
        }
        menu.items.push(action.id)
      }
    }

    if (showsInToolbar(action.showIn)) {
      const groupId = action.toolbarGroup ?? DEFAULT_CUSTOM_GROUP_ID
      ensureGroup(nextCatalog, nextLayout, groupId)
      const group = nextLayout.iconGroups.find((entry) => entry.id === groupId)
      if (group && !group.items.includes(action.id)) {
        group.items.push(action.id)
      }
    }
  }

  return { catalog: nextCatalog, layout: nextLayout }
}

export function createCustomActionCommands(
  actions: CustomAction[] | undefined,
  createApi: () => CustomActionApi,
): Record<string, () => void | Promise<void>> {
  const commands: Record<string, () => void | Promise<void>> = {}
  for (const action of actions ?? []) {
    if (BUILTIN_TOOLBAR_ITEM_IDS.has(action.id) || isMenuSeparator(action.id)) continue
    commands[customCommandName(action.id)] = () => action.onAction(createApi())
  }
  return commands
}
