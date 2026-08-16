import { isInside } from './inlineRange'

export type TableApply = {
  rows: number
  cols: number
}

export const TABLE_GRID_MAX = 10
export const TABLE_SIZE_MIN = 1
export const TABLE_SIZE_MAX = 50

export const DEFAULT_TABLE_CELL_BORDER = '1px solid #000'
export const DEFAULT_TABLE_CELL_PADDING = '0.25em'

const CELL_TAGS = new Set(['td', 'th'])

export function validateTableSize(rows: number, cols: number): boolean {
  return (
    Number.isInteger(rows) &&
    Number.isInteger(cols) &&
    rows >= TABLE_SIZE_MIN &&
    cols >= TABLE_SIZE_MIN &&
    rows <= TABLE_SIZE_MAX &&
    cols <= TABLE_SIZE_MAX
  )
}

export function closestTable(root: HTMLElement, node: Node | null): HTMLTableElement | null {
  return closestMatching(root, node, (el): el is HTMLTableElement => el instanceof HTMLTableElement)
}

export function closestCell(root: HTMLElement, node: Node | null): HTMLTableCellElement | null {
  return closestMatching(root, node, (el): el is HTMLTableCellElement => isTableCell(el))
}

export function closestRow(root: HTMLElement, node: Node | null): HTMLTableRowElement | null {
  return closestMatching(root, node, (el): el is HTMLTableRowElement => el instanceof HTMLTableRowElement)
}

export function tableAtSelection(root: HTMLElement): HTMLTableElement | null {
  return closestTable(root, selectionAnchor(root))
}

export function cellAtSelection(root: HTMLElement): HTMLTableCellElement | null {
  return closestCell(root, selectionAnchor(root))
}

export function rowAtSelection(root: HTMLElement): HTMLTableRowElement | null {
  return closestRow(root, selectionAnchor(root))
}

export function tableCells(table: HTMLTableElement): HTMLTableCellElement[] {
  const cells: HTMLTableCellElement[] = []
  for (const row of Array.from(table.rows)) {
    cells.push(...Array.from(row.cells))
  }
  return cells
}

export function cellsInSelection(root: HTMLElement): HTMLTableCellElement[] {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return []
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return []
  const start = closestCell(root, range.startContainer)
  const end = closestCell(root, range.endContainer)
  if (!start) return []
  if (!end || start === end) return [start]
  const table = closestTable(root, start)
  if (!table || closestTable(root, end) !== table) return [start]
  const startPos = cellPosition(start)
  const endPos = cellPosition(end)
  if (!startPos || !endPos) return [start]
  const minRow = Math.min(startPos.row, endPos.row)
  const maxRow = Math.max(startPos.row, endPos.row)
  const minCol = Math.min(startPos.col, endPos.col)
  const maxCol = Math.max(startPos.col, endPos.col)
  const selected: HTMLTableCellElement[] = []
  for (const row of Array.from(table.rows)) {
    if (row.rowIndex < minRow || row.rowIndex > maxRow) continue
    for (const cell of Array.from(row.cells)) {
      if (cell.cellIndex >= minCol && cell.cellIndex <= maxCol) selected.push(cell)
    }
  }
  return selected.length > 0 ? selected : [start]
}

export function insertTableInDocument(root: HTMLElement, draft: TableApply): boolean {
  if (!validateTableSize(draft.rows, draft.cols)) return false
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  const table = document.createElement('table')
  table.style.borderCollapse = 'collapse'
  table.style.width = '100%'
  const body = document.createElement('tbody')
  for (let r = 0; r < draft.rows; r += 1) {
    const row = document.createElement('tr')
    for (let c = 0; c < draft.cols; c += 1) {
      row.appendChild(createDefaultCell('td'))
    }
    body.appendChild(row)
  }
  table.appendChild(body)

  if (!range.collapsed) range.deleteContents()
  range.insertNode(table)
  liftTableOutOfPhrasing(root, table)
  const first = table.querySelector('td, th')
  if (first instanceof HTMLTableCellElement) placeCaretInCell(first)
  return true
}

export function insertRowInDocument(root: HTMLElement, where: 'before' | 'below'): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const row = cell.parentElement
  if (!(row instanceof HTMLTableRowElement)) return false
  const table = closestTable(root, cell)
  if (!table) return false

  const next = document.createElement('tr')
  const count = Math.max(1, row.cells.length)
  for (let i = 0; i < count; i += 1) {
    const template = row.cells[i]
    next.appendChild(createDefaultCell(template?.tagName === 'TH' ? 'th' : 'td'))
  }
  if (where === 'before') row.parentNode?.insertBefore(next, row)
  else row.insertAdjacentElement('afterend', next)
  const focus = next.cells[Math.min(cell.cellIndex, next.cells.length - 1)]
  if (focus) placeCaretInCell(focus)
  return true
}

export function insertColumnInDocument(root: HTMLElement, where: 'before' | 'after'): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const index = cell.cellIndex
  const insertAt = where === 'before' ? index : index + 1
  let focus: HTMLTableCellElement | null = null
  for (const row of Array.from(table.rows)) {
    const template = row.cells[Math.min(index, row.cells.length - 1)] ?? null
    const created = createDefaultCell(template?.tagName === 'TH' ? 'th' : 'td')
    insertCellAt(row, insertAt, created)
    if (row === cell.parentElement) focus = created
  }
  if (focus) placeCaretInCell(focus)
  return true
}

export function deleteRowInDocument(root: HTMLElement): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const row = cell.parentElement
  if (!(row instanceof HTMLTableRowElement)) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const col = cell.cellIndex
  const rowIndex = row.rowIndex
  if (table.rows.length <= 1) return removeTable(root, table)

  const parent = row.parentNode
  row.remove()
  const nextRow = table.rows[Math.min(rowIndex, table.rows.length - 1)]
  const focus = nextRow?.cells[Math.min(col, nextRow.cells.length - 1)]
  if (focus) placeCaretInCell(focus)
  else if (parent) placeCaretAfter(table)
  return true
}

export function deleteColumnInDocument(root: HTMLElement): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const index = cell.cellIndex
  const row = cell.parentElement
  const maxCells = Math.max(0, ...Array.from(table.rows, (item) => item.cells.length))
  if (maxCells <= 1) return removeTable(root, table)

  const rowIndex = row instanceof HTMLTableRowElement ? row.rowIndex : 0
  for (const current of Array.from(table.rows)) {
    const target = current.cells[index]
    if (target) target.remove()
  }
  const nextRow = table.rows[Math.min(rowIndex, table.rows.length - 1)]
  const focus = nextRow?.cells[Math.min(index, nextRow.cells.length - 1)]
  if (focus) placeCaretInCell(focus)
  return true
}

export function tabInTable(root: HTMLElement, shift: boolean): boolean | { changed: boolean } {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const cells = tableCells(table)
  const index = cells.indexOf(cell)
  if (index < 0) return false
  if (shift) {
    if (index === 0) return false
    placeCaretInCell(cells[index - 1])
    return { changed: false }
  }
  if (index < cells.length - 1) {
    placeCaretInCell(cells[index + 1])
    return { changed: false }
  }
  const row = cell.parentElement
  if (!insertRowInDocument(root, 'below')) return false
  const nextRow = row instanceof HTMLTableRowElement ? row.nextElementSibling : null
  if (nextRow instanceof HTMLTableRowElement && nextRow.cells[0]) {
    placeCaretInCell(nextRow.cells[0])
  }
  return { changed: true }
}

export function selectCellInDocument(root: HTMLElement, cell: HTMLTableCellElement): boolean {
  if (!isInside(root, cell) || cell === root) return false
  placeCaretInCell(cell)
  return true
}

function closestMatching<T extends HTMLElement>(
  root: HTMLElement,
  node: Node | null,
  match: (el: HTMLElement) => el is T,
): T | null {
  let current: Node | null = node
  while (current && current !== root) {
    if (current instanceof HTMLElement && match(current)) return current
    current = current.parentNode
  }
  return null
}

function isTableCell(el: HTMLElement): el is HTMLTableCellElement {
  return CELL_TAGS.has(el.tagName.toLowerCase())
}

function selectionAnchor(root: HTMLElement): Node | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null
  return range.startContainer
}

function cellPosition(cell: HTMLTableCellElement): { row: number; col: number } | null {
  const row = cell.parentElement
  if (!(row instanceof HTMLTableRowElement)) return null
  return { row: row.rowIndex, col: cell.cellIndex }
}

function createDefaultCell(tag: 'td' | 'th'): HTMLTableCellElement {
  const cell = document.createElement(tag)
  cell.style.border = DEFAULT_TABLE_CELL_BORDER
  cell.style.padding = DEFAULT_TABLE_CELL_PADDING
  cell.appendChild(document.createElement('br'))
  return cell
}

function insertCellAt(row: HTMLTableRowElement, index: number, cell: HTMLTableCellElement): void {
  if (index >= row.cells.length) row.appendChild(cell)
  else row.insertBefore(cell, row.cells[index])
}

function liftTableOutOfPhrasing(root: HTMLElement, table: HTMLTableElement): void {
  const parent = table.parentElement
  if (!parent || parent === root) return
  const tag = parent.tagName.toLowerCase()
  if (tag === 'td' || tag === 'th') return
  if (tag === 'p' || /^h[1-6]$/.test(tag)) {
    parent.parentNode?.insertBefore(table, parent.nextSibling)
    if (isEmptyBlock(parent)) parent.remove()
  }
}

function isEmptyBlock(el: HTMLElement): boolean {
  if (el.childNodes.length === 0) return true
  if (el.childNodes.length === 1 && el.firstChild?.nodeName === 'BR') return true
  return (el.textContent ?? '').trim().length === 0 && el.querySelector('img, table, ul, ol') === null
}

function removeTable(root: HTMLElement, table: HTMLTableElement): boolean {
  const parent = table.parentNode
  if (!parent || !isInside(root, table)) return false
  const range = document.createRange()
  range.setStartBefore(table)
  range.collapse(true)
  table.remove()
  const sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
  return true
}

function placeCaretInCell(cell: HTMLTableCellElement): void {
  const range = document.createRange()
  range.selectNodeContents(cell)
  range.collapse(true)
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

function placeCaretAfter(node: Node): void {
  const range = document.createRange()
  range.setStartAfter(node)
  range.collapse(true)
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}
