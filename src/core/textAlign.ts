import {
  collectSelectedBlocks,
  currentRange,
  ensureSelectedBlocks,
  withRestoredSelection,
} from './blocks'

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

function readAlign(el: HTMLElement): TextAlign {
  return normalizeAlign(el.style.textAlign)
}

export function queryTextAlign(root: HTMLElement): TextAlignQuery {
  const blocks = collectSelectedBlocks(root)
  if (blocks.length === 0) {
    return currentRange(root) ? { align: 'left', mixed: false } : { align: null, mixed: false }
  }
  const aligns = blocks.map(readAlign)
  const first = aligns[0]
  if (aligns.every((align) => align === first)) {
    return { align: first, mixed: false }
  }
  return { align: null, mixed: true }
}

export function setTextAlignInDocument(root: HTMLElement, align: TextAlign): boolean {
  if (!TEXT_ALIGN_VALUES.includes(align)) return false
  return withRestoredSelection(root, () => {
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false
    let changed = false
    for (const block of blocks) {
      if (block.style.textAlign === align) continue
      block.style.textAlign = align
      changed = true
    }
    return changed
  })
}
