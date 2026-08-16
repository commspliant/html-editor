import { isInside } from './inlineRange'

export type ClipboardPayload = {
  html: string
  text: string
}

function getVisualRange(root: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null
  return range
}

export function serializeSelection(root: HTMLElement): ClipboardPayload | null {
  const range = getVisualRange(root)
  if (!range || range.collapsed) return null

  const holder = document.createElement('div')
  holder.appendChild(range.cloneContents())
  const html = holder.innerHTML
  if (!html) return null

  let text = range.toString()
  if (!text) {
    const img = holder.querySelector('img')
    text = img?.getAttribute('alt') ?? img?.getAttribute('src') ?? ''
  }
  return { html, text }
}

export function deleteSelectionInDocument(root: HTMLElement): boolean {
  const range = getVisualRange(root)
  if (!range || range.collapsed) return false
  range.deleteContents()
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  return true
}

async function writeClipboard(payload: ClipboardPayload): Promise<boolean> {
  const clipboard = navigator.clipboard
  if (!clipboard) return false

  try {
    if (typeof ClipboardItem === 'function' && typeof clipboard.write === 'function') {
      const item = new ClipboardItem({
        'text/plain': new Blob([payload.text], { type: 'text/plain' }),
        'text/html': new Blob([payload.html], { type: 'text/html' }),
      })
      await clipboard.write([item])
      return true
    }
    if (typeof clipboard.writeText === 'function') {
      await clipboard.writeText(payload.text)
      return true
    }
  } catch {
    if (typeof clipboard.writeText === 'function') {
      try {
        await clipboard.writeText(payload.text)
        return true
      } catch {
        return false
      }
    }
    return false
  }
  return false
}

export async function copySelectionInDocument(root: HTMLElement): Promise<boolean> {
  const payload = serializeSelection(root)
  if (!payload) return false
  return writeClipboard(payload)
}

export async function cutSelectionInDocument(root: HTMLElement): Promise<boolean> {
  if (!(await copySelectionInDocument(root))) return false
  return deleteSelectionInDocument(root)
}
