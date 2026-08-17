import type { ToolbarCustomization } from '../types'
import type { ToolbarIconGroup } from './types'

export const FULLSCREEN_GROUP_ID = 'fullscreen'

export const TOOLBAR_CUSTOMIZATION_STORAGE_KEY = 'commspliant-html-editor.toolbarCustomization'

export function pinFullscreenLast(order: string[]): string[] {
  const rest = order.filter((id) => id !== FULLSCREEN_GROUP_ID)
  return order.includes(FULLSCREEN_GROUP_ID) ? [...rest, FULLSCREEN_GROUP_ID] : rest
}

export function mergeGroupOrder(defaultOrder: string[], savedOrder: string[] | undefined): string[] {
  if (!savedOrder || savedOrder.length === 0) return pinFullscreenLast(defaultOrder)
  const defaultSet = new Set(defaultOrder)
  const saved = savedOrder.filter((id) => defaultSet.has(id))
  const placed = new Set(saved)
  const result = [...saved]
  for (let i = 0; i < defaultOrder.length; i++) {
    const id = defaultOrder[i]
    if (placed.has(id)) continue
    let insertAt = 0
    for (let j = i - 1; j >= 0; j--) {
      const prev = defaultOrder[j]
      const idx = result.indexOf(prev)
      if (idx >= 0) {
        insertAt = idx + 1
        break
      }
    }
    result.splice(insertAt, 0, id)
    placed.add(id)
  }
  return pinFullscreenLast(result)
}

export function applyToolbarCustomization(
  base: ToolbarIconGroup[],
  settings: ToolbarCustomization | null,
): ToolbarIconGroup[] {
  const byId = new Map(base.map((group) => [group.id, group]))
  const order = mergeGroupOrder(
    base.map((group) => group.id),
    settings?.groupOrder,
  )
  const hidden = new Set(settings?.hiddenItemIds ?? [])
  const next: ToolbarIconGroup[] = []
  for (const id of order) {
    const group = byId.get(id)
    if (!group) continue
    const items = group.items.filter((itemId) => !hidden.has(itemId))
    if (items.length === 0) continue
    next.push({ id, items })
  }
  return next
}

export function parseToolbarCustomization(value: unknown): ToolbarCustomization | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const groupOrder = Array.isArray(record.groupOrder)
    ? record.groupOrder.filter((id): id is string => typeof id === 'string')
    : []
  const hiddenItemIds = Array.isArray(record.hiddenItemIds)
    ? [...new Set(record.hiddenItemIds.filter((id): id is string => typeof id === 'string'))]
    : []
  if (groupOrder.length === 0 && hiddenItemIds.length === 0) return null
  return { groupOrder, hiddenItemIds }
}

export function readToolbarCustomizationFromStorage(): ToolbarCustomization | null {
  try {
    const raw = localStorage.getItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)
    if (!raw) return null
    return parseToolbarCustomization(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeToolbarCustomizationToStorage(settings: ToolbarCustomization | null): void {
  try {
    if (!settings) {
      localStorage.removeItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)
      return
    }
    localStorage.setItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore quota / private mode */
  }
}

function currentOrder(
  settings: ToolbarCustomization | null,
  base: ToolbarIconGroup[],
): string[] {
  return mergeGroupOrder(
    base.map((group) => group.id),
    settings?.groupOrder,
  )
}

export function toggleToolbarItemHidden(
  settings: ToolbarCustomization | null,
  base: ToolbarIconGroup[],
  itemId: string,
  visible: boolean,
): ToolbarCustomization {
  const hidden = new Set(settings?.hiddenItemIds ?? [])
  if (visible) hidden.delete(itemId)
  else hidden.add(itemId)
  return {
    groupOrder: currentOrder(settings, base),
    hiddenItemIds: [...hidden],
  }
}

export function moveToolbarGroup(
  settings: ToolbarCustomization | null,
  base: ToolbarIconGroup[],
  sourceId: string,
  targetId: string,
): ToolbarCustomization {
  const groupOrder = currentOrder(settings, base)
  const hiddenItemIds = [...(settings?.hiddenItemIds ?? [])]
  if (sourceId === FULLSCREEN_GROUP_ID || targetId === FULLSCREEN_GROUP_ID) {
    return { groupOrder, hiddenItemIds }
  }
  const from = groupOrder.indexOf(sourceId)
  const to = groupOrder.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) {
    return { groupOrder, hiddenItemIds }
  }
  const next = [...groupOrder]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return {
    groupOrder: pinFullscreenLast(next),
    hiddenItemIds,
  }
}

export function moveToolbarGroupByOffset(
  settings: ToolbarCustomization | null,
  base: ToolbarIconGroup[],
  groupId: string,
  offset: -1 | 1,
): ToolbarCustomization {
  const groupOrder = currentOrder(settings, base)
  const movable = groupOrder.filter((id) => id !== FULLSCREEN_GROUP_ID)
  const index = movable.indexOf(groupId)
  const targetIndex = index + offset
  if (index < 0 || targetIndex < 0 || targetIndex >= movable.length) {
    return { groupOrder, hiddenItemIds: [...(settings?.hiddenItemIds ?? [])] }
  }
  return moveToolbarGroup(settings, base, groupId, movable[targetIndex])
}
