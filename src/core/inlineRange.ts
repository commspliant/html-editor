const FORMATTING_TAGS = new Set([
  'span',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'del',
])

export function isInside(root: Node, node: Node | null): boolean {
  if (!node) return false
  return root === node || root.contains(node)
}

export function isFormattingWrapper(el: Element): boolean {
  return FORMATTING_TAGS.has(el.tagName.toLowerCase())
}

function rangeIntersectsNode(range: Range, node: Node): boolean {
  const nodeRange = document.createRange()
  nodeRange.selectNodeContents(node)
  return (
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
  )
}

export function textNodesInRange(range: Range): Text[] {
  const root = range.commonAncestorContainer
  if (root.nodeType === Node.TEXT_NODE) {
    return root.nodeValue ? [root as Text] : []
  }
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current: Node | null
  while ((current = walker.nextNode())) {
    if (!current.nodeValue) continue
    if (rangeIntersectsNode(range, current)) {
      nodes.push(current as Text)
    }
  }
  return nodes
}

export function splitRangeBoundaries(range: Range): void {
  const start = range.startContainer
  const startOffset = range.startOffset
  if (start.nodeType === Node.TEXT_NODE) {
    const text = start as Text
    if (startOffset > 0 && startOffset < text.length) {
      const after = text.splitText(startOffset)
      range.setStart(after, 0)
      if (range.endContainer === text) {
        range.setEnd(after, range.endOffset - startOffset)
      }
    }
  }

  const end = range.endContainer
  const endOffset = range.endOffset
  if (end.nodeType === Node.TEXT_NODE) {
    const text = end as Text
    if (endOffset > 0 && endOffset < text.length) {
      text.splitText(endOffset)
      range.setEnd(text, text.length)
    }
  }
}

export function shouldUnwrapSpan(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() !== 'span') return false
  if (el.style.cssText.trim()) return false
  el.removeAttribute('style')
  return el.attributes.length === 0
}

export function unwrapElement(el: Element): void {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el)
  }
  parent.removeChild(el)
}

export function isolateNodeInParent(parent: Element, node: Node): void {
  const children = [...parent.childNodes]
  const index = children.indexOf(node as ChildNode)
  if (index <= -1 || children.length === 1) return
  const owner = parent.parentNode
  if (!owner) return

  const before = children.slice(0, index)
  const after = children.slice(index + 1)

  if (before.length > 0) {
    const left = parent.cloneNode(false) as Element
    for (const child of before) left.appendChild(child)
    owner.insertBefore(left, parent)
  }
  if (after.length > 0) {
    const right = parent.cloneNode(false) as Element
    for (const child of after) right.appendChild(child)
    owner.insertBefore(right, parent.nextSibling)
  }
}

export function restoreTextSelection(texts: Text[]): void {
  if (texts.length === 0) return
  const first = texts[0]
  const last = texts[texts.length - 1]
  const next = document.createRange()
  next.setStart(first, 0)
  next.setEnd(last, last.data.length)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(next)
}

export function wrapTextWithStyle(text: Text, apply: (el: HTMLElement) => void): HTMLElement {
  const parent = text.parentElement
  if (parent && parent.tagName.toLowerCase() === 'span' && parent.childNodes.length === 1) {
    apply(parent)
    return parent
  }
  const span = document.createElement('span')
  apply(span)
  parent?.insertBefore(span, text)
  span.appendChild(text)
  return span
}
