import { PAGE_SIZED_ATTR } from './pageCanvasLayout'

export const PAGE_SHELL_ATTR = 'data-page'
export const PAGE_BG_LAYER_ATTR = 'data-page-bg'
export const PAGE_BG_LAYER_ID = 'commspliant-background'

export function isPageBackgroundLayer(el: Element): boolean {
  return (
    el instanceof HTMLElement &&
    (el.id === PAGE_BG_LAYER_ID || el.hasAttribute(PAGE_BG_LAYER_ATTR))
  )
}

function backgroundSearchRoot(from: HTMLElement): HTMLElement {
  if (from.hasAttribute(PAGE_SHELL_ATTR) && from.parentElement) return from.parentElement
  return from
}

export function queryPageBackgroundLayers(from: HTMLElement): HTMLElement[] {
  const root = backgroundSearchRoot(from)
  const seen = new Set<HTMLElement>()
  const layers: HTMLElement[] = []
  const consider = (el: Element | null) => {
    if (el instanceof HTMLElement && isPageBackgroundLayer(el) && !seen.has(el)) {
      seen.add(el)
      layers.push(el)
    }
  }
  consider(root.querySelector(`#${PAGE_BG_LAYER_ID}`))
  for (const el of root.querySelectorAll(`[${PAGE_BG_LAYER_ATTR}]`)) consider(el)
  consider(root)
  return layers
}

export function queryPageBackgroundLayer(from: HTMLElement): HTMLElement | null {
  return queryPageBackgroundLayers(from)[0] ?? null
}

export function ensurePageShellLayout(shell: HTMLElement): boolean {
  let changed = false
  if (shell.style.width !== '100%') {
    shell.style.width = '100%'
    changed = true
  }
  if (shell.style.height !== '100%') {
    shell.style.height = '100%'
    changed = true
  }
  return changed
}

/** Stretch the page shell to fill a sized visual holder's content box. */
export function ensureSizedPageShellLayout(holder: HTMLElement, shell: HTMLElement): boolean {
  if (!holder.hasAttribute(PAGE_SIZED_ATTR)) {
    return ensurePageShellLayout(shell)
  }
  let changed = false
  if (shell.style.width !== '100%') {
    shell.style.width = '100%'
    changed = true
  }
  if (shell.style.height !== 'auto') {
    shell.style.height = 'auto'
    changed = true
  }
  if (shell.style.minHeight !== '100%') {
    shell.style.minHeight = '100%'
    changed = true
  }
  return changed
}

function lastContentBlock(shell: HTMLElement): HTMLElement | null {
  const blocks = shell.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
  return (blocks[blocks.length - 1] as HTMLElement | undefined) ?? null
}

/** Move holder children that escaped the page shell back inside it. */
export function absorbLooseBlocksIntoPageShell(holder: HTMLElement): boolean {
  const shell = queryPageShell(holder)
  if (!shell) return false
  let changed = false
  for (const child of [...holder.childNodes]) {
    if (child === shell) continue
    if (child instanceof HTMLElement && isPageBackgroundLayer(child)) continue
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? ''
      if (!text.trim()) {
        child.remove()
        changed = true
        continue
      }
      let block = lastContentBlock(shell)
      if (!block) {
        block = document.createElement('p')
        shell.appendChild(block)
      }
      block.appendChild(child)
      changed = true
      continue
    }
    shell.appendChild(child)
    changed = true
  }
  return changed
}

export function isPageShell(el: Element, visualRoot: HTMLElement): boolean {
  return (
    el instanceof HTMLElement &&
    el !== visualRoot &&
    el.parentElement === visualRoot &&
    el.hasAttribute(PAGE_SHELL_ATTR)
  )
}

function elementChildren(root: HTMLElement): HTMLElement[] {
  return [...root.children].filter((el): el is HTMLElement => el instanceof HTMLElement)
}

function hasLooseText(root: HTMLElement): boolean {
  return [...root.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
  )
}

export function queryPageShell(visualRoot: HTMLElement): HTMLElement | null {
  const marked = elementChildren(visualRoot).find((el) => el.hasAttribute(PAGE_SHELL_ATTR))
  return marked ?? null
}

function adoptableDiv(visualRoot: HTMLElement): HTMLElement | null {
  if (hasLooseText(visualRoot)) return null
  const elements = elementChildren(visualRoot)
  if (elements.length !== 1) return null
  const only = elements[0]
  if (only.tagName.toLowerCase() !== 'div') return null
  if (isPageBackgroundLayer(only)) return null
  return only
}

export function ensurePageShell(visualRoot: HTMLElement): HTMLElement {
  const existing = queryPageShell(visualRoot)
  if (existing) {
    ensurePageShellLayout(existing)
    return existing
  }

  const adopt = adoptableDiv(visualRoot)
  if (adopt) {
    adopt.setAttribute(PAGE_SHELL_ATTR, '')
    ensurePageShellLayout(adopt)
    return adopt
  }

  const shell = document.createElement('div')
  shell.setAttribute(PAGE_SHELL_ATTR, '')
  while (visualRoot.firstChild) {
    shell.appendChild(visualRoot.firstChild)
  }
  visualRoot.appendChild(shell)
  ensurePageShellLayout(shell)
  return shell
}

export function contentRoot(visualRoot: HTMLElement): HTMLElement {
  return queryPageShell(visualRoot) ?? visualRoot
}

function firstShellContentNode(shell: HTMLElement): Node | null {
  for (const child of shell.childNodes) {
    if (child instanceof HTMLElement && isPageBackgroundLayer(child)) continue
    return child
  }
  return null
}

function isSelectionOutsidePageShell(holder: HTMLElement, shell: HTMLElement, range: Range): boolean {
  const { startContainer } = range
  if (startContainer === shell || shell.contains(startContainer)) return false
  if (startContainer === holder) return true
  return holder.contains(startContainer)
}

function placeCaretInShell(shell: HTMLElement): void {
  const range = document.createRange()
  const first = firstShellContentNode(shell)
  if (first instanceof HTMLElement) {
    const text = first.firstChild
    if (text?.nodeType === Node.TEXT_NODE) {
      range.setStart(text, text.textContent?.length ?? 0)
    } else if (first.firstChild) {
      range.setStartBefore(first.firstChild)
    } else {
      range.setStart(first, 0)
    }
  } else if (first?.nodeType === Node.TEXT_NODE) {
    range.setStart(first, first.textContent?.length ?? 0)
  } else {
    const paragraph = document.createElement('p')
    paragraph.appendChild(document.createElement('br'))
    shell.appendChild(paragraph)
    range.setStart(paragraph, 0)
  }
  range.collapse(true)
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Move the caret into the page shell when it landed on the holder or outside the shell. */
export function normalizeCaretInPageShell(holder: HTMLElement): void {
  const shell = queryPageShell(holder)
  if (!shell) return
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (!isSelectionOutsidePageShell(holder, shell, range)) return
  placeCaretInShell(shell)
}

const PAGE_HOLDER_BG_PROPS = [
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'opacity',
] as const

function copyPageBackgroundStyle(
  visualRoot: HTMLElement,
  source: HTMLElement | null,
  prop: (typeof PAGE_HOLDER_BG_PROPS)[number],
): void {
  const value = source?.style.getPropertyValue(prop).trim() ?? ''
  if (value) visualRoot.style.setProperty(prop, value)
  else visualRoot.style.removeProperty(prop)
}

/** Paint the visual holder with the page fill and background image. Does not change document HTML. */
export function syncPageHolderBackground(visualRoot: HTMLElement): void {
  const shell = queryPageShell(visualRoot)
  const bgLayer = shell ? queryPageBackgroundLayer(shell) : null

  copyPageBackgroundStyle(visualRoot, shell, 'background-color')

  if (bgLayer) {
    for (const prop of PAGE_HOLDER_BG_PROPS) {
      if (prop === 'background-color') continue
      copyPageBackgroundStyle(visualRoot, bgLayer, prop)
    }
  } else {
    for (const prop of PAGE_HOLDER_BG_PROPS) {
      if (prop === 'background-color') continue
      visualRoot.style.removeProperty(prop)
    }
  }
}

