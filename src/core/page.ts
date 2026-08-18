export const PAGE_SHELL_ATTR = 'data-page'
export const PAGE_BG_LAYER_ATTR = 'data-page-bg'

export function isPageBackgroundLayer(el: Element): boolean {
  return el instanceof HTMLElement && el.hasAttribute(PAGE_BG_LAYER_ATTR)
}

export function queryPageBackgroundLayer(shell: HTMLElement): HTMLElement | null {
  return (
    [...shell.children].find(
      (el): el is HTMLElement => el instanceof HTMLElement && isPageBackgroundLayer(el),
    ) ?? null
  )
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

