import type { ComponentType } from 'react'
import type { CommandName, EditorCommands, EditorQueries, QueryName } from '../core/commandTypes'
import type { MessageKey } from '../i18n/types'
import type { IconProps } from '../icons'

export type ToolbarItemId = string

export const MENU_SEPARATOR = '---' as const

export type ToolbarSubmenuEntry = {
  submenu: string
  items: ToolbarMenuEntry[]
}

export type ToolbarMenuEntry = ToolbarItemId | typeof MENU_SEPARATOR | ToolbarSubmenuEntry

export function isMenuSeparator(entry: ToolbarMenuEntry): entry is typeof MENU_SEPARATOR {
  return entry === MENU_SEPARATOR
}

export function isMenuSubmenu(entry: ToolbarMenuEntry): entry is ToolbarSubmenuEntry {
  return typeof entry === 'object' && entry !== null && 'submenu' in entry
}

export type ToolbarWidgetProps = {
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  onMenuClose?: () => void
}

export type ToolbarItem = {
  id: ToolbarItemId
  command?: CommandName
  icon?: ComponentType<IconProps>
  widget?: ComponentType<ToolbarWidgetProps>
  labelKey?: MessageKey
  label?: string
  ariaKey?: MessageKey
  ariaLabel?: string
  tooltip?: string
  active?: QueryName
  enabled?: QueryName
  toggle?: boolean
}

export type ToolbarMenuDef = {
  id: string
  labelKey?: MessageKey
  label?: string
  ariaKey?: MessageKey
  ariaLabel?: string
  panel?: ComponentType<ToolbarWidgetProps>
  enabled?: QueryName
}

export type ToolbarGroupDef = {
  id: string
  labelKey?: MessageKey
  label?: string
}

export type ToolbarIconGroup = {
  id: string
  items: ToolbarItemId[]
}

export type ToolbarCatalog = {
  menus: Record<string, ToolbarMenuDef>
  submenus?: Record<string, ToolbarMenuDef>
  groups: Record<string, ToolbarGroupDef>
  items: Partial<Record<ToolbarItemId, ToolbarItem>>
}

export type ToolbarLayout = {
  menus: { id: string; items: ToolbarMenuEntry[] }[]
  iconGroups: ToolbarIconGroup[]
}
