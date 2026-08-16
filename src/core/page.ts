export const PAGE_SHELL_ATTR = 'data-page'

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
  if (existing) return existing

  const adopt = adoptableDiv(visualRoot)
  if (adopt) {
    adopt.setAttribute(PAGE_SHELL_ATTR, '')
    return adopt
  }

  const shell = document.createElement('div')
  shell.setAttribute(PAGE_SHELL_ATTR, '')
  while (visualRoot.firstChild) {
    shell.appendChild(visualRoot.firstChild)
  }
  visualRoot.appendChild(shell)
  return shell
}

export function contentRoot(visualRoot: HTMLElement): HTMLElement {
  return queryPageShell(visualRoot) ?? visualRoot
}

/** Paint the visual holder with the page fill. Does not change document HTML. */
export function syncPageHolderBackground(visualRoot: HTMLElement): void {
  const shell = queryPageShell(visualRoot)
  const fill = shell?.style.backgroundColor.trim() ?? ''
  if (fill) visualRoot.style.backgroundColor = fill
  else visualRoot.style.removeProperty('background-color')
}

