import type { ToolbarPosition } from '../../types'

export const TOOLBAR_POSITION_STORAGE_KEY = 'commspliant-html-editor.toolbarPosition'

const POSITIONS: readonly ToolbarPosition[] = ['top', 'left', 'right', 'bottom']

export function parseToolbarPosition(value: unknown): ToolbarPosition | null {
  return typeof value === 'string' && POSITIONS.includes(value as ToolbarPosition)
    ? (value as ToolbarPosition)
    : null
}

export function readToolbarPositionFromStorage(): ToolbarPosition | null {
  try {
    const raw = localStorage.getItem(TOOLBAR_POSITION_STORAGE_KEY)
    if (!raw) return null
    return parseToolbarPosition(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeToolbarPositionToStorage(position: ToolbarPosition): void {
  try {
    localStorage.setItem(TOOLBAR_POSITION_STORAGE_KEY, JSON.stringify(position))
  } catch {
    /* ignore quota / private mode */
  }
}
