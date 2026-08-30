import { ensurePageShell } from './page'

export const PAGE_SEPARATOR = '<!-- wysiwyg-page-separator -->'

export const PAGE_SURFACE_ATTR = 'data-page-surface'

export function splitPagesFromHtml(html: string): string[] {
  const trimmed = html.trim()
  if (!trimmed) return ['']
  if (!trimmed.includes(PAGE_SEPARATOR)) return [html]
  return html.split(PAGE_SEPARATOR).map((page) => page.trim())
}

export function joinPagesToHtml(pages: readonly string[]): string {
  if (pages.length === 0) return ''
  if (pages.length === 1) return pages[0] ?? ''
  return pages.join(`\n${PAGE_SEPARATOR}\n`)
}

export function emptyPageHtml(): string {
  return '<p></p>'
}

export function normalizePages(pages: readonly string[]): string[] {
  if (pages.length === 0) return [emptyPageHtml()]
  return pages.map((page) => page.trim())
}

export type PagesMergeResult = {
  pages: string[]
  changed: boolean
  changedIndices: number[]
}

/** Reuse unchanged page string references when merging a new pages array. */
export function mergePagesWithStructuralSharing(
  current: readonly string[],
  next: readonly string[],
): PagesMergeResult {
  if (current.length === next.length) {
    let changed = false
    const pages: string[] = []
    const changedIndices: number[] = []
    for (let i = 0; i < next.length; i += 1) {
      const n = next[i] ?? ''
      if (current[i] === n) {
        pages.push(current[i]!)
      } else {
        pages.push(n)
        changed = true
        changedIndices.push(i)
      }
    }
    if (!changed) {
      return { pages: current as string[], changed: false, changedIndices: [] }
    }
    return { pages, changed: true, changedIndices }
  }

  const pages: string[] = []
  const changedIndices: number[] = []
  for (let i = 0; i < next.length; i += 1) {
    const n = next[i] ?? ''
    if (i < current.length && current[i] === n) {
      pages.push(current[i]!)
    } else {
      pages.push(n)
      changedIndices.push(i)
    }
  }
  const changed =
    changedIndices.length > 0 ||
    current.length !== next.length ||
    !pagesArraysEqual(current, pages)
  if (!changed) {
    return { pages: current as string[], changed: false, changedIndices: [] }
  }
  return { pages, changed: true, changedIndices }
}

export function pagesArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function updatePageAt(
  pages: readonly string[],
  index: number,
  nextPage: string,
): { pages: string[]; changed: boolean } {
  if (index < 0 || index >= pages.length) {
    return { pages: [...pages], changed: false }
  }
  if (pages[index] === nextPage) {
    return { pages: pages as string[], changed: false }
  }
  const next = pages.slice()
  next[index] = nextPage
  return { pages: next, changed: true }
}

export function createEmptyPageInDocument(doc: Document): string {
  const visualRoot = doc.createElement('div')
  visualRoot.innerHTML = emptyPageHtml()
  ensurePageShell(visualRoot)
  return visualRoot.innerHTML
}

export function queryPageSurface(container: HTMLElement, index: number): HTMLElement | null {
  const indexed = container.querySelector<HTMLElement>(
    `[${PAGE_SURFACE_ATTR}][data-page-index="${index}"]`,
  )
  if (indexed) return indexed
  const surfaces = [...container.querySelectorAll<HTMLElement>(`[${PAGE_SURFACE_ATTR}]`)]
  return surfaces[index] ?? null
}

export function getActivePageRoot(container: HTMLElement, activeIndex: number): HTMLElement | null {
  return queryPageSurface(container, activeIndex)
}

export function closestPageSurface(node: Node | null): HTMLElement | null {
  if (!node) return null
  const el = node instanceof Element ? node : node.parentElement
  return el?.closest<HTMLElement>(`[${PAGE_SURFACE_ATTR}]`) ?? null
}

export function queryPageSurfaceIndex(surface: HTMLElement): number | null {
  const attr = surface.getAttribute('data-page-index')
  if (attr !== null) {
    const parsed = Number.parseInt(attr, 10)
    if (!Number.isNaN(parsed)) return parsed
  }
  let parent: HTMLElement | null = surface.parentElement
  while (parent) {
    const surfaces = [...parent.querySelectorAll<HTMLElement>(`[${PAGE_SURFACE_ATTR}]`)]
    const index = surfaces.indexOf(surface)
    if (index !== -1) return index
    parent = parent.parentElement
  }
  return null
}
