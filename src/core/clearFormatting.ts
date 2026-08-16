import { currentRange } from './blocks'
import {
  isolateNodeInParent,
  isFormattingWrapper,
  restoreTextSelection,
  shouldUnwrapSpan,
  splitRangeBoundaries,
  textNodesInRange,
  unwrapElement,
} from './inlineRange'

const SEMANTIC_MARK_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del'])

const CHARACTER_STYLE_PROPS = [
  'font',
  'font-weight',
  'font-style',
  'font-family',
  'font-size',
  'color',
  'background',
  'background-color',
  'text-decoration',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-style',
  'text-decoration-thickness',
] as const

function stripCharacterStyles(el: HTMLElement): void {
  for (const prop of CHARACTER_STYLE_PROPS) {
    el.style.removeProperty(prop)
  }
}

function unwrapFormattingFromText(root: HTMLElement, text: Text): void {
  let node: Node = text
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent)) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    if (SEMANTIC_MARK_TAGS.has(parent.tagName.toLowerCase())) {
      unwrapElement(parent)
      continue
    }
    stripCharacterStyles(parent as HTMLElement)
    if (shouldUnwrapSpan(parent as HTMLElement)) {
      unwrapElement(parent)
      continue
    }
    node = parent.isConnected ? parent : text
  }
}

export function clearFormattingInDocument(root: HTMLElement): boolean {
  const range = currentRange(root)
  if (!range || range.collapsed) return false

  const before = root.innerHTML
  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  if (texts.length === 0) return false

  for (const text of texts) {
    unwrapFormattingFromText(root, text)
  }
  restoreTextSelection(texts)
  return root.innerHTML !== before
}
