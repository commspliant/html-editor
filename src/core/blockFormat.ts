import { isFormattingWrapper } from './inlineRange'
import {
  currentRange,
  elementFromNode,
  nodesForRange,
  renameElement,
  restoreOffsets,
  tagName,
  textOffsetFromRoot,
} from './blocks'
import { contentRoot, isPageBackgroundLayer, isPageShell } from './page'

export const PARAGRAPH_STYLE_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

export type ParagraphStyleTag = (typeof PARAGRAPH_STYLE_TAGS)[number]

export type BlockFormatQuery = {
  tag: ParagraphStyleTag | null
  mixed: boolean
}

const STYLE_TAG_SET = new Set<string>(PARAGRAPH_STYLE_TAGS)
const CONVERTIBLE_TAGS = new Set<string>([...PARAGRAPH_STYLE_TAGS, 'div'])
const SKIP_TAGS = new Set([
  'li',
  'ul',
  'ol',
  'td',
  'th',
  'tr',
  'thead',
  'tbody',
  'table',
  'blockquote',
  'pre',
])

const emptyQuery = (): BlockFormatQuery => ({ tag: null, mixed: false })

export function isParagraphStyleTag(tag: string): tag is ParagraphStyleTag {
  return STYLE_TAG_SET.has(tag)
}

function toStyleTag(tag: string): ParagraphStyleTag | null {
  if (isParagraphStyleTag(tag)) return tag
  if (tag === 'div') return 'p'
  return null
}

function isSkipElement(node: Node): boolean {
  return node instanceof Element && SKIP_TAGS.has(tagName(node))
}

function isConvertibleElement(node: Node): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    !isPageBackgroundLayer(node) &&
    CONVERTIBLE_TAGS.has(tagName(node))
  )
}

function isPhrasingNode(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) return true
  if (!(node instanceof Element)) return true
  const tag = tagName(node)
  if (CONVERTIBLE_TAGS.has(tag) || SKIP_TAGS.has(tag)) return false
  return isFormattingWrapper(node) || tag === 'br' || tag === 'a' || tag === 'img' || tag === 'span'
}

function isInsideSkip(root: HTMLElement, node: Node): boolean {
  let current = elementFromNode(node)
  while (current && current !== root) {
    if (SKIP_TAGS.has(tagName(current))) return true
    current = current.parentElement
  }
  return false
}

function nearestConvertible(root: HTMLElement, node: Node): HTMLElement | null {
  let current = elementFromNode(node)
  while (current && current !== root) {
    if (isPageShell(current, root)) {
      current = current.parentElement
      continue
    }
    if (isConvertibleElement(current)) return current
    if (SKIP_TAGS.has(tagName(current))) return null
    current = current.parentElement
  }
  return null
}

function collectConvertibleBlocks(root: HTMLElement, range: Range): HTMLElement[] {
  const seen = new Set<HTMLElement>()
  const blocks: HTMLElement[] = []
  for (const node of nodesForRange(range)) {
    const block = nearestConvertible(root, node)
    if (block && !seen.has(block)) {
      seen.add(block)
      blocks.push(block)
    }
  }
  return blocks
}

function childOfRoot(root: HTMLElement, node: Node): Node | null {
  let current: Node | null = node
  while (current && current.parentNode !== root) {
    current = current.parentNode
  }
  return current && current.parentNode === root ? current : null
}

function phrasingRunAround(root: HTMLElement, child: Node): Node[] {
  const siblings = [...root.childNodes]
  const index = siblings.indexOf(child as ChildNode)
  if (index < 0) return [child]
  let start = index
  let end = index
  while (start > 0 && isPhrasingNode(siblings[start - 1])) start -= 1
  while (end < siblings.length - 1 && isPhrasingNode(siblings[end + 1])) end += 1
  return siblings.slice(start, end + 1)
}

function firstContentChild(wrapRoot: HTMLElement): Node | null {
  for (const child of wrapRoot.childNodes) {
    if (child instanceof HTMLElement && isPageBackgroundLayer(child)) continue
    return child
  }
  return null
}

function caretChildInWrapRoot(
  wrapRoot: HTMLElement,
  visualRoot: HTMLElement,
  range: Range,
): Node | null {
  if (range.startContainer === wrapRoot) {
    const node =
      wrapRoot.childNodes[Math.min(range.startOffset, Math.max(0, wrapRoot.childNodes.length - 1))] ??
      wrapRoot.firstChild
    if (node instanceof HTMLElement && isPageBackgroundLayer(node)) {
      return firstContentChild(wrapRoot)
    }
    return node
  }
  if (range.startContainer === visualRoot && wrapRoot !== visualRoot) {
    return firstContentChild(wrapRoot)
  }
  return childOfRoot(wrapRoot, range.startContainer)
}

function wrapLooseContent(root: HTMLElement, range: Range, tag: ParagraphStyleTag): boolean {
  const wrapRoot = contentRoot(root)
  if (isInsideSkip(root, range.startContainer)) return false

  if (!firstContentChild(wrapRoot)) {
    const el = document.createElement(tag)
    el.appendChild(document.createElement('br'))
    wrapRoot.appendChild(el)
    return true
  }

  const caretChild = caretChildInWrapRoot(wrapRoot, root, range)

  if (
    !caretChild ||
    (caretChild instanceof HTMLElement && isPageBackgroundLayer(caretChild)) ||
    isSkipElement(caretChild) ||
    isConvertibleElement(caretChild)
  ) {
    return false
  }
  if (!isPhrasingNode(caretChild)) return false

  const run = phrasingRunAround(wrapRoot, caretChild)
  const el = document.createElement(tag)
  wrapRoot.insertBefore(el, run[0])
  for (const node of run) el.appendChild(node)
  return true
}

export function queryBlockFormat(root: HTMLElement): BlockFormatQuery {
  const range = currentRange(root)
  if (!range) return emptyQuery()

  const tags = nodesForRange(range).map((node) => {
    const block = nearestConvertible(root, node)
    return block ? toStyleTag(tagName(block)) : null
  })
  const first = tags[0]
  if (tags.every((tag) => tag === first)) {
    return { tag: first ?? null, mixed: false }
  }
  return { tag: null, mixed: true }
}

export function setBlockFormatInDocument(root: HTMLElement, tag: ParagraphStyleTag): boolean {
  if (!isParagraphStyleTag(tag)) return false
  const range = currentRange(root)
  if (!range) return false

  const start = textOffsetFromRoot(root, range.startContainer, range.startOffset)
  const end = textOffsetFromRoot(root, range.endContainer, range.endOffset)
  const from = Math.min(start, end)
  const to = Math.max(start, end)

  const blocks = collectConvertibleBlocks(root, range)
  let changed = false

  if (blocks.length === 0) {
    changed = wrapLooseContent(root, range, tag)
  } else {
    for (const block of blocks) {
      if (tagName(block) === tag) continue
      renameElement(block, tag)
      changed = true
    }
  }

  restoreOffsets(root, from, to)
  return changed
}
