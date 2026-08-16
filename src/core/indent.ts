import {
  collectSelectedBlocks,
  ensureSelectedBlocks,
  isListItem,
  parentList,
  tagName,
  withRestoredSelection,
  clearEmptyStyle,
} from './blocks'
import { unwrapListItemToParagraph } from './lists'

export const INDENT_STEP_PX = 40

export function getMarginLeftPx(el: HTMLElement): number {
  const raw = el.style.marginLeft
  if (!raw) return 0
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : 0
}

export function setMarginLeftPx(el: HTMLElement, px: number): void {
  if (px <= 0) {
    el.style.marginLeft = ''
    clearEmptyStyle(el)
    return
  }
  el.style.marginLeft = `${px}px`
}

function previousLiSibling(li: HTMLElement): HTMLElement | null {
  let node: Element | null = li.previousElementSibling
  while (node) {
    if (isListItem(node)) return node
    node = node.previousElementSibling
  }
  return null
}

function lastNestedList(li: HTMLElement): HTMLElement | null {
  for (let i = li.children.length - 1; i >= 0; i -= 1) {
    const child = li.children[i]
    if (child instanceof HTMLElement && (tagName(child) === 'ul' || tagName(child) === 'ol')) {
      return child
    }
  }
  return null
}

function nestListItem(li: HTMLElement): boolean {
  const prev = previousLiSibling(li)
  if (!prev) return false
  const list = parentList(li)
  if (!list) return false
  const type = tagName(list) === 'ol' ? 'ol' : 'ul'
  let nested = lastNestedList(prev)
  if (!nested || tagName(nested) !== type) {
    nested = document.createElement(type)
    prev.appendChild(nested)
  }
  nested.appendChild(li)
  return true
}

function unnestListItem(li: HTMLElement): boolean {
  const list = parentList(li)
  if (!list) return false
  const parentLi = list.parentElement
  if (parentLi && isListItem(parentLi)) {
    const outer = parentLi.parentElement
    if (!outer) return false
    outer.insertBefore(li, parentLi.nextSibling)
    if (list.childElementCount === 0) list.remove()
    return true
  }
  unwrapListItemToParagraph(li)
  return true
}

export function canOutdentInDocument(root: HTMLElement): boolean {
  const blocks = collectSelectedBlocks(root)
  return blocks.some((block) => isListItem(block) || getMarginLeftPx(block) > 0)
}

export function indentInDocument(root: HTMLElement): boolean {
  return withRestoredSelection(root, () => {
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false
    let changed = false
    for (const block of blocks) {
      if (isListItem(block)) {
        if (nestListItem(block)) changed = true
        continue
      }
      setMarginLeftPx(block, getMarginLeftPx(block) + INDENT_STEP_PX)
      changed = true
    }
    return changed
  })
}

export function outdentInDocument(root: HTMLElement): boolean {
  return withRestoredSelection(root, () => {
    const blocks = collectSelectedBlocks(root)
    if (blocks.length === 0) return false
    let changed = false
    for (const block of [...blocks].reverse()) {
      if (isListItem(block)) {
        if (unnestListItem(block)) changed = true
        continue
      }
      const current = getMarginLeftPx(block)
      if (current <= 0) continue
      setMarginLeftPx(block, Math.max(0, current - INDENT_STEP_PX))
      changed = true
    }
    return changed
  })
}
