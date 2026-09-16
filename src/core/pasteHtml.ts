import { sanitizePageHtml } from './sanitizeHtml'

type TransferEventLike = {
  clipboardData?: DataTransfer | null
  dataTransfer?: DataTransfer | null
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

function transferFromEvent(event: TransferEventLike): DataTransfer | null {
  return event.clipboardData ?? event.dataTransfer ?? null
}

function insertSanitizedTransfer(event: TransferEventLike, root: HTMLElement, data: DataTransfer): boolean {
  if (data.files && data.files.length > 0) return false
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

/** Intercept paste into a contentEditable surface and insert sanitized HTML. */
export function handleContentEditablePaste(event: TransferEventLike, root: HTMLElement): boolean {
  const data = transferFromEvent(event)
  if (!data) return false
  return insertSanitizedTransfer(event, root, data)
}

/** Intercept native HTML drop / insertFromDrop the same way as paste. File drops are left to the host. */
export function handleContentEditableDrop(event: TransferEventLike, root: HTMLElement): boolean {
  const data = transferFromEvent(event)
  if (!data) return false
  return insertSanitizedTransfer(event, root, data)
}
