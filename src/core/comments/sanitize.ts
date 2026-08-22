import { COMMENT_THREAD_ATTR } from './constants'

function isCommentOnlySpan(el: Element): boolean {
  if (el.tagName.toLowerCase() !== 'span') return false
  const attrs = [...el.attributes]
  if (attrs.length === 0) return true
  if (attrs.length === 1 && attrs[0]?.name === COMMENT_THREAD_ATTR) return true
  if (
    attrs.length === 2 &&
    attrs.some((attr) => attr.name === COMMENT_THREAD_ATTR) &&
    attrs.some((attr) => attr.name === 'class' && attr.value.includes('wysiwyg-comment-anchor'))
  ) {
    return !el.hasAttribute('style')
  }
  return false
}

function stripCommentAnchorsInRoot(root: ParentNode): void {
  for (const el of [...root.querySelectorAll(`[${COMMENT_THREAD_ATTR}]`)]) {
    el.removeAttribute(COMMENT_THREAD_ATTR)
    if (el instanceof HTMLElement) {
      el.classList.remove('wysiwyg-comment-anchor')
    }
  }

  for (const span of [...root.querySelectorAll('span')]) {
    if (!isCommentOnlySpan(span)) continue
    const parent = span.parentNode
    if (!parent) continue
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span)
    }
    parent.removeChild(span)
  }
}

export function stripCommentAnchors(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return html
  const doc = new DOMParser().parseFromString(trimmed, 'text/html')
  stripCommentAnchorsInRoot(doc.body)
  return doc.body.innerHTML
}
