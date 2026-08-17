import type { CustomActionSelection, EditorMode } from '../types'

export type SelectionSnapshot = CustomActionSelection & {
  mode: EditorMode
  visualRange: Range | null
}

export function describeSelection(snapshot: SelectionSnapshot): CustomActionSelection {
  return {
    text: snapshot.text,
    collapsed: snapshot.collapsed,
    start: snapshot.start,
    end: snapshot.end,
  }
}

function isInside(root: Node, node: Node | null): boolean {
  if (!node) return false
  return root === node || root.contains(node)
}

function textLengthBeforeNode(root: Node, target: Node): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let length = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    if (current === target || target.contains(current)) return length
    const position = target.compareDocumentPosition(current)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return length
    length += current.textContent?.length ?? 0
  }
  return length
}

function offsetFromRoot(root: HTMLElement, node: Node, offset: number): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return textLengthBeforeNode(root, node) + offset
  }

  let length = 0
  const children = node.childNodes
  for (let i = 0; i < offset && i < children.length; i += 1) {
    length += children[i].textContent?.length ?? 0
  }
  return textLengthBeforeNode(root, node) + length
}

function positionFromOffset(root: HTMLElement, offset: number): { node: Node; offset: number } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let remaining = Math.max(0, offset)
  let current: Node | null
  let lastText: Node | null = null
  while ((current = walker.nextNode())) {
    lastText = current
    const len = current.textContent?.length ?? 0
    if (remaining <= len) {
      return { node: current, offset: remaining }
    }
    remaining -= len
  }
  if (lastText) {
    return { node: lastText, offset: lastText.textContent?.length ?? 0 }
  }
  return { node: root, offset: root.childNodes.length }
}

export function rangeFromOffsets(root: HTMLElement, start: number, end: number): Range {
  const range = document.createRange()
  const startPos = positionFromOffset(root, start)
  const endPos = positionFromOffset(root, end)
  range.setStart(startPos.node, startPos.offset)
  range.setEnd(endPos.node, endPos.offset)
  return range
}

export function isRangeLive(range: Range, root: HTMLElement): boolean {
  try {
    const ancestor = range.commonAncestorContainer
    return root === ancestor || root.contains(ancestor)
  } catch {
    return false
  }
}

export function shouldKeepStoredVisualSelection(
  stored: SelectionSnapshot | null | undefined,
  live: SelectionSnapshot,
): stored is SelectionSnapshot {
  return Boolean(
    stored &&
      stored.mode === 'visual' &&
      stored.visualRange &&
      (!live.visualRange || (!stored.collapsed && live.collapsed)),
  )
}

export function rangeToRestore(root: HTMLElement, snapshot: SelectionSnapshot): Range | null {
  if (snapshot.mode !== 'visual') return null
  if (snapshot.visualRange && isRangeLive(snapshot.visualRange, root)) {
    return snapshot.visualRange
  }
  return rangeFromOffsets(root, snapshot.start, snapshot.end)
}

export function snapshotSelection(args: {
  mode: EditorMode
  visualEl: HTMLElement | null
  htmlEl: HTMLTextAreaElement | null
}): SelectionSnapshot {
  if (args.mode === 'html' && args.htmlEl) {
    const start = args.htmlEl.selectionStart
    const end = args.htmlEl.selectionEnd
    return {
      mode: 'html',
      text: args.htmlEl.value.slice(start, end),
      collapsed: start === end,
      start,
      end,
      visualRange: null,
    }
  }

  const visualEl = args.visualEl
  if (args.mode === 'visual' && visualEl) {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (isInside(visualEl, range.commonAncestorContainer)) {
        const start = offsetFromRoot(visualEl, range.startContainer, range.startOffset)
        const end = offsetFromRoot(visualEl, range.endContainer, range.endOffset)
        return {
          mode: 'visual',
          text: range.toString(),
          collapsed: range.collapsed,
          start: Math.min(start, end),
          end: Math.max(start, end),
          visualRange: range.cloneRange(),
        }
      }
    }
    const len = visualEl.textContent?.length ?? 0
    return {
      mode: 'visual',
      text: '',
      collapsed: true,
      start: len,
      end: len,
      visualRange: null,
    }
  }

  return {
    mode: args.mode,
    text: '',
    collapsed: true,
    start: 0,
    end: 0,
    visualRange: null,
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function insertAtSelection(args: {
  snapshot: SelectionSnapshot
  visualEl: HTMLElement | null
  htmlEl: HTMLTextAreaElement | null
  getHtml: () => string
  setHtml: (html: string) => void
  content: string
  asHtml: boolean
}): void {
  if (args.snapshot.mode === 'html') {
    const html = args.getHtml()
    const start = args.snapshot.start
    const end = args.snapshot.end
    const toInsert = args.asHtml ? args.content : escapeHtml(args.content)
    args.setHtml(html.slice(0, start) + toInsert + html.slice(end))
    const el = args.htmlEl
    if (el) {
      const caret = start + toInsert.length
      el.focus()
      el.setSelectionRange(caret, caret)
    }
    return
  }

  const visualEl = args.visualEl
  if (!visualEl) {
    const fallback = args.asHtml ? args.content : escapeHtml(args.content)
    args.setHtml(args.getHtml() + fallback)
    return
  }

  const liveRange =
    args.snapshot.visualRange && isRangeLive(args.snapshot.visualRange, visualEl)
      ? args.snapshot.visualRange
      : null
  const range = liveRange ?? rangeFromOffsets(visualEl, args.snapshot.start, args.snapshot.end)

  range.deleteContents()
  if (args.content) {
    if (args.asHtml) {
      const frag = range.createContextualFragment(args.content)
      const last = frag.lastChild
      range.insertNode(frag)
      if (last) {
        range.setStartAfter(last)
        range.collapse(true)
      }
    } else {
      const node = document.createTextNode(args.content)
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
    }
  }

  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  args.setHtml(visualEl.innerHTML)
}
