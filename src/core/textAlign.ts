import {
  collectSelectedBlocks,
  currentRange,
  ensureSelectedBlocks,
  withRestoredSelection,
} from './blocks'
import { cellsInSelection } from './table'

export const TEXT_ALIGN_VALUES = ['left', 'center', 'right', 'justify'] as const

export type TextAlign = (typeof TEXT_ALIGN_VALUES)[number]

export type TextAlignQuery = {
  align: TextAlign | null
  mixed: boolean
}

function normalizeAlign(value: string): TextAlign {
  const raw = value.trim().toLowerCase()
  if (raw === 'center') return 'center'
  if (raw === 'right' || raw === 'end') return 'right'
  if (raw === 'justify') return 'justify'
  return 'left'
}

export function readTextAlign(el: HTMLElement): TextAlign {
  return normalizeAlign(el.style.textAlign)
}

export function writeTextAlign(el: HTMLElement, align: TextAlign | null): boolean {
  const next = align ?? 'left'
  const current = readTextAlign(el)
  if (current === next) {
    if (align === null && el.style.textAlign) {
      el.style.removeProperty('text-align')
      return true
    }
    return false
  }
  if (align === null || align === 'left') {
    el.style.removeProperty('text-align')
  } else {
    el.style.textAlign = align
  }
  return true
}

function queryAligns(aligns: TextAlign[]): TextAlignQuery {
  const first = aligns[0]
  if (aligns.every((align) => align === first)) {
    return { align: first, mixed: false }
  }
  return { align: null, mixed: true }
}

export function queryTextAlign(root: HTMLElement): TextAlignQuery {
  const cells = cellsInSelection(root)
  if (cells.length > 0) {
    return queryAligns(cells.map(readTextAlign))
  }
  const blocks = collectSelectedBlocks(root)
  if (blocks.length === 0) {
    return currentRange(root) ? { align: 'left', mixed: false } : { align: null, mixed: false }
  }
  return queryAligns(blocks.map(readTextAlign))
}

export function setTextAlignInDocument(root: HTMLElement, align: TextAlign): boolean {
  if (!TEXT_ALIGN_VALUES.includes(align)) return false
  return withRestoredSelection(root, () => {
    const cells = cellsInSelection(root)
    if (cells.length > 0) {
      let changed = false
      for (const cell of cells) {
        if (writeTextAlign(cell, align)) changed = true
      }
      return changed
    }
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false
    let changed = false
    for (const block of blocks) {
      if (writeTextAlign(block, align)) changed = true
    }
    return changed
  })
}
