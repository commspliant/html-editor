import type { EditorQueries } from '../core/commandTypes'
import type { ToolbarItem } from './types'

export type ToolbarQuerySlice = 'history' | 'marks' | 'table' | 'selection' | 'chrome'

const QUERY_SLICE: Partial<Record<keyof EditorQueries, ToolbarQuerySlice>> = {
  canUndo: 'history',
  canRedo: 'history',
  isBold: 'marks',
  isItalic: 'marks',
  isUnderline: 'marks',
  isStrikethrough: 'marks',
  getFontSize: 'marks',
  getFontSizeUnit: 'marks',
  isFontSizeMixed: 'marks',
  getFontFamily: 'marks',
  isFontFamilyMixed: 'marks',
  getFontColor: 'marks',
  isFontColorMixed: 'marks',
  getHighlightColor: 'marks',
  isHighlightColorMixed: 'marks',
  getParagraphStyle: 'marks',
  isParagraphStyleMixed: 'marks',
  isAlignLeft: 'marks',
  isAlignCenter: 'marks',
  isAlignRight: 'marks',
  isAlignJustify: 'marks',
  canOutdent: 'marks',
  isBulletList: 'marks',
  isNumberedList: 'marks',
  isFormatBrushActive: 'marks',
  isInTable: 'table',
  canMergeCells: 'table',
  canUnmergeCells: 'table',
  hasTextSelection: 'selection',
  isImageSelected: 'selection',
  isLink: 'selection',
  canReadAloud: 'selection',
  isReadingAloud: 'selection',
}

export type ToolbarQueryRevisions = {
  subscribe: (slice: ToolbarQuerySlice, listener: () => void) => () => void
  getSnapshot: (slice: ToolbarQuerySlice) => number
  bump: (slice: ToolbarQuerySlice) => void
}

export function createToolbarQueryRevisions(): ToolbarQueryRevisions {
  const revisions: Record<ToolbarQuerySlice, number> = {
    history: 0,
    marks: 0,
    table: 0,
    selection: 0,
    chrome: 0,
  }
  const listeners = new Map<ToolbarQuerySlice, Set<() => void>>()

  function subscribe(slice: ToolbarQuerySlice, listener: () => void): () => void {
    let set = listeners.get(slice)
    if (!set) {
      set = new Set()
      listeners.set(slice, set)
    }
    set.add(listener)
    return () => {
      set?.delete(listener)
    }
  }

  return {
    subscribe,
    getSnapshot: (slice) => revisions[slice],
    bump(slice) {
      revisions[slice] += 1
      const set = listeners.get(slice)
      if (!set) return
      for (const listener of set) {
        listener()
      }
    },
  }
}

export function querySlicesForItem(item: Pick<ToolbarItem, 'active' | 'enabled'>): ToolbarQuerySlice[] {
  const slices = new Set<ToolbarQuerySlice>()
  if (item.active) {
    slices.add(QUERY_SLICE[item.active] ?? 'chrome')
  }
  if (item.enabled) {
    slices.add(QUERY_SLICE[item.enabled] ?? 'chrome')
  }
  if (slices.size === 0) {
    slices.add('chrome')
  }
  return [...slices]
}
