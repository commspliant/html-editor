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

export function createEmptyPageInDocument(doc: Document): string {
  const visualRoot = doc.createElement('div')
  visualRoot.innerHTML = emptyPageHtml()
  ensurePageShell(visualRoot)
  return visualRoot.innerHTML
}

export function queryPageSurface(container: HTMLElement, index: number): HTMLElement | null {
  const surfaces = [...container.querySelectorAll<HTMLElement>(`[${PAGE_SURFACE_ATTR}]`)]
  return surfaces[index] ?? null
}

export function getActivePageRoot(container: HTMLElement, activeIndex: number): HTMLElement | null {
  return queryPageSurface(container, activeIndex)
}
