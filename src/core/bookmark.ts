import { closestHrefAnchor } from './link'
import { isInside, splitRangeBoundaries } from './inlineRange'
import { contentRoot } from './page'

export const BOOKMARK_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/

export type BookmarkEntry = { id: string }

export type BookmarkNameError = 'empty' | 'invalid' | 'duplicate'

const ZWSP = '\u200B'

export function listBookmarks(visualRoot: HTMLElement): BookmarkEntry[] {
  const root = contentRoot(visualRoot)
  const ids = new Set<string>()
  for (const el of root.querySelectorAll('[id]')) {
    if (el === root) continue
    const id = el.id.trim()
    if (id) ids.add(id)
  }
  for (const el of root.querySelectorAll('a[name]')) {
    const name = el.getAttribute('name')?.trim()
    if (name) ids.add(name)
  }
  return [...ids].sort((a, b) => a.localeCompare(b)).map((id) => ({ id }))
}

export function bookmarkIds(visualRoot: HTMLElement): Set<string> {
  return new Set(listBookmarks(visualRoot).map((entry) => entry.id))
}

export function validateBookmarkName(
  name: string,
  existingIds: ReadonlySet<string>,
): BookmarkNameError | null {
  const trimmed = name.trim()
  if (!trimmed) return 'empty'
  if (!BOOKMARK_NAME_PATTERN.test(trimmed)) return 'invalid'
  if (existingIds.has(trimmed)) return 'duplicate'
  return null
}

function insertNamedAnchor(range: Range, id: string): void {
  const anchor = document.createElement('a')
  anchor.id = id
  anchor.appendChild(document.createTextNode(ZWSP))
  range.insertNode(anchor)
  range.setStartAfter(anchor)
  range.collapse(true)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function insertNamedAnchorBefore(node: Node, id: string): void {
  const anchor = document.createElement('a')
  anchor.id = id
  anchor.appendChild(document.createTextNode(ZWSP))
  node.parentNode?.insertBefore(anchor, node)
}

export function insertBookmarkInDocument(root: HTMLElement, name: string): boolean {
  const id = name.trim()
  if (validateBookmarkName(id, bookmarkIds(root))) return false

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  const hrefAnchor = closestHrefAnchor(root, range.startContainer)
  if (hrefAnchor) {
    insertNamedAnchorBefore(hrefAnchor, id)
    return true
  }

  if (range.collapsed) {
    insertNamedAnchor(range, id)
    return true
  }

  splitRangeBoundaries(range)
  const span = document.createElement('span')
  span.id = id
  try {
    range.surroundContents(span)
    return true
  } catch {
    insertNamedAnchor(range, id)
    return true
  }
}
