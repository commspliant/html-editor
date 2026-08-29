import { PAGE_BG_LAYER_ATTR, PAGE_SHELL_ATTR } from './page'
import {
  resolvePageCanvasMarginPadding,
  resolvePageCanvasSize,
} from './pageCanvasLayout'
import { BOX_SIDES } from './paragraphBox'
import { queryPageAtRule } from './pageAtRule'

function parseBodyHtml(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

function layerHasBackgroundImage(layer: HTMLElement): boolean {
  const bg = layer.style.backgroundImage.trim()
  if (bg && bg !== 'none') return true
  const style = layer.getAttribute('style') ?? ''
  return /background-image\s*:\s*(?!none\b)/i.test(style)
}

function parsePt(value: string): number | null {
  const match = value.trim().match(/^([\d.]+)pt$/i)
  return match ? Number.parseFloat(match[1]) : null
}

/** Per side, keep the larger of two pt lengths; otherwise prefer the new value. */
function mergePaddingLength(existing: string | null, added: string | null): string | null {
  if (!added) return existing
  if (!existing) return added
  const existingPt = parsePt(existing)
  const addedPt = parsePt(added)
  if (existingPt !== null && addedPt !== null) {
    return `${Math.max(existingPt, addedPt)}pt`
  }
  return added
}

function applyShellBleedPadding(shell: HTMLElement, pageHtml: string): void {
  const atRule = queryPageAtRule(pageHtml)
  const margins = resolvePageCanvasMarginPadding(atRule)

  shell.style.boxSizing = 'border-box'
  if (shell.style.position !== 'relative') shell.style.position = 'relative'
  if (shell.style.isolation !== 'isolate') shell.style.isolation = 'isolate'

  const size = resolvePageCanvasSize(atRule)
  if (size) {
    shell.style.width = size.width
    shell.style.minHeight = size.height
  } else {
    if (!shell.style.width) shell.style.width = '100%'
    shell.style.minHeight = '100vh'
  }
  shell.style.height = 'auto'

  for (const side of BOX_SIDES) {
    const prop = `padding-${side}` as const
    const marginVal = margins[side]
    const existing = shell.style.getPropertyValue(prop).trim() || null
    const merged = mergePaddingLength(existing, marginVal)
    if (merged) shell.style.setProperty(prop, merged)
  }
}

export function pageHasBackgroundBleed(html: string): boolean {
  const doc = parseBodyHtml(html)
  for (const layer of doc.querySelectorAll(`[${PAGE_BG_LAYER_ATTR}]`)) {
    if (layer instanceof HTMLElement && layerHasBackgroundImage(layer)) return true
  }
  return false
}

/** Apply print/preview bleed: move @page margins onto shell padding when a page bg image is set. */
export function prepareDocumentHtmlForOutput(html: string): { html: string; hasBleed: boolean } {
  const doc = parseBodyHtml(html)
  let hasBleed = false

  for (const shell of doc.querySelectorAll(`[${PAGE_SHELL_ATTR}]`)) {
    if (!(shell instanceof HTMLElement)) continue
    const layer = shell.querySelector(`[${PAGE_BG_LAYER_ATTR}]`)
    if (!(layer instanceof HTMLElement) || !layerHasBackgroundImage(layer)) continue
    hasBleed = true
    applyShellBleedPadding(shell, html)
  }

  return { html: doc.body.innerHTML, hasBleed }
}
