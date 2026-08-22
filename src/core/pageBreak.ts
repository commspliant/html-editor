import { insertFlowBreakInDocument } from './flowBreakInsert'

export const DEFAULT_PAGE_BREAK_MARGIN = '1.5em 0'
export const DEFAULT_PAGE_BREAK_BORDER_TOP = '2px dashed #bbb'

export function createPageBreak(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.breakAfter = 'page'
  el.style.pageBreakAfter = 'always'
  el.style.margin = DEFAULT_PAGE_BREAK_MARGIN
  el.style.border = '0'
  el.style.borderTop = DEFAULT_PAGE_BREAK_BORDER_TOP
  el.style.height = '0'
  return el
}

export function insertPageBreakInDocument(root: HTMLElement): boolean {
  return insertFlowBreakInDocument(root, createPageBreak())
}
