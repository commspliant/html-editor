import { sanitizePageHtml } from './sanitizeHtml'

type PasteEventLike = {
  clipboardData: DataTransfer | null
  preventDefault: () => void
}

function escapeTextAsHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseFragment(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

function insertHtmlAtRange(range: Range, html: string): void {
  range.deleteContents()
  const frag = parseFragment(html)
  const last = frag.lastChild
  range.insertNode(frag)
  if (last) {
    range.setStartAfter(last)
    range.collapse(true)
  }
}

/** Intercept paste into a contentEditable surface and insert sanitized HTML. */
export function handleContentEditablePaste(event: PasteEventLike, root: HTMLElement): boolean {
  const data = event.clipboardData
  if (!data) return false
  let html = ''
  let text = ''
  try {
    html = data.getData('text/html') ?? ''
    text = data.getData('text/plain') ?? ''
  } catch {
    return false
  }
  if (!html && !text) return false
  event.preventDefault()
  const raw = html.trim() ? html : escapeTextAsHtml(text)
  const sanitized = sanitizePageHtml(raw)
  const sel = window.getSelection()
  const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
  if (range && root.contains(range.commonAncestorContainer)) {
    insertHtmlAtRange(range, sanitized)
    sel.removeAllRanges()
    sel.addRange(range)
  } else if (sanitized) {
    root.insertAdjacentHTML('beforeend', sanitized)
  }
  root.dispatchEvent(new InputEvent('input', { bubbles: true }))
  return true
}
