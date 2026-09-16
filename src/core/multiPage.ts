import { ensurePageShell } from './page'

export const PAGE_SEPARATOR = '<!-- wysiwyg-page-separator -->'

export const PAGE_SURFACE_ATTR = 'data-page-surface'

/**
 * Soft cap on page count to avoid tab OOM / freeze on hostile or accidental
 * multi-MB HTML. Enforced by `clampDocumentPages` (editor ingest/commit), not by
 * `splitPagesFromHtml` (public split stays lossless).
 */
export const MAX_EDITOR_PAGE_COUNT = 500

/**
 * Soft cap on total document HTML characters (~5MB). Same enforcement as
 * `MAX_EDITOR_PAGE_COUNT`.
 */
export const MAX_EDITOR_HTML_CHARS = 5_000_000

/**
 * Marker appended when `clampDocumentPages` drops pages or HTML so truncation
 * is visible in source — never silent.
 */
export const DOCUMENT_TRUNCATED_COMMENT = '<!-- wysiwyg-truncated -->'

export function splitPagesFromHtml(html: string): string[] {
  const trimmed = html.trim()
  if (!trimmed) return ['']
  if (!trimmed.includes(PAGE_SEPARATOR)) return [html]
  return html.split(PAGE_SEPARATOR).map((page) => page.trim())
}

/**
 * Drop extra pages / tail HTML that would exceed the documented size guards.
 * Does not mutate input. When content is dropped, the last kept page gets
 * `DOCUMENT_TRUNCATED_COMMENT` unless it already contains that marker.
 */
export function clampDocumentPages(pages: readonly string[]): {
  pages: string[]
  truncated: boolean
} {
  const source = pages.length === 0 ? [emptyPageHtml()] : [...pages]
  let truncated = false
  let next = source

  if (next.length > MAX_EDITOR_PAGE_COUNT) {
    next = next.slice(0, MAX_EDITOR_PAGE_COUNT)
    truncated = true
  }

  let total = 0
  for (const page of next) total += page.length

  while (next.length > 1 && total > MAX_EDITOR_HTML_CHARS) {
    const removed = next.pop()
    total -= removed?.length ?? 0
    truncated = true
  }

  if (next.length === 1 && (next[0]?.length ?? 0) > MAX_EDITOR_HTML_CHARS) {
    const budget = Math.max(0, MAX_EDITOR_HTML_CHARS - DOCUMENT_TRUNCATED_COMMENT.length)
    next = [`${next[0]!.slice(0, budget)}${DOCUMENT_TRUNCATED_COMMENT}`]
    truncated = true
  } else if (truncated) {
    const lastIndex = next.length - 1
    const last = next[lastIndex] ?? ''
    if (!last.includes(DOCUMENT_TRUNCATED_COMMENT)) {
      next[lastIndex] = `${last}\n${DOCUMENT_TRUNCATED_COMMENT}`
    }
  }

  return { pages: next, truncated }
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
