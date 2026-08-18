import { isInside } from './inlineRange'
import {
  boundingRectOfSlots,
  buildTableGrid,
  canSetCellSpan,
  mergeableRect,
  occupancyForCell,
  readCellSpan,
  uniqueCellsInRect,
  writeCellSpan,
  type MergePlan,
  type TableSlot,
} from './tableGrid'

export { readCellSpan, writeCellSpan } from './tableGrid'

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
  const grid = buildTableGrid(table)
  const startSlot = occupancyForCell(grid, start)
  const endSlot = occupancyForCell(grid, end)
  if (!startSlot || !endSlot) return [start]
  const rect = boundingRectOfSlots([startSlot, endSlot])
  if (!rect) return [start]
  const selected = uniqueCellsInRect(grid, rect)
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
  const table = closestTable(root, cell)
  if (!table) return false
  const grid = buildTableGrid(table)
  const occ = occupancyForCell(grid, cell)
  if (!occ) return false
  const insertAt = where === 'before' ? occ.originRow : occ.originRow + occ.rowSpan

  const spannedCols = new Set<number>()
  for (const slot of grid.unique) {
    if (slot.originRow < insertAt && slot.originRow + slot.rowSpan > insertAt) {
      writeCellSpan(slot.cell, slot.colSpan, slot.rowSpan + 1)
      for (let c = slot.originCol; c < slot.originCol + slot.colSpan; c += 1) spannedCols.add(c)
    }
  }

  const next = document.createElement('tr')
  const templateRowIndex = Math.min(insertAt, grid.rowCount - 1)
  for (let c = 0; c < grid.colCount; c += 1) {
    if (spannedCols.has(c)) continue
    const template = grid.slots[templateRowIndex]?.[c]?.cell ?? cell
    next.appendChild(createCellShell(template))
  }

  if (insertAt >= table.rows.length) {
    const last = table.rows[table.rows.length - 1]
    last.parentNode?.appendChild(next)
  } else {
    const ref = table.rows[insertAt]
    ref.parentNode?.insertBefore(next, ref)
  }

  const focus = cellInNewRowAtColumn(next, grid.colCount, spannedCols, occ.originCol)
  if (focus) placeCaretInCell(focus)
  else placeCaretInCell(cell)
  return true
}

export function insertColumnInDocument(root: HTMLElement, where: 'before' | 'after'): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const grid = buildTableGrid(table)
  const occ = occupancyForCell(grid, cell)
  if (!occ) return false
  const insertAt = where === 'before' ? occ.originCol : occ.originCol + occ.colSpan

  const spannedRows = new Set<number>()
  for (const slot of grid.unique) {
    if (slot.originCol < insertAt && slot.originCol + slot.colSpan > insertAt) {
      writeCellSpan(slot.cell, slot.colSpan + 1, slot.rowSpan)
      for (let r = slot.originRow; r < slot.originRow + slot.rowSpan; r += 1) spannedRows.add(r)
    }
  }

  let focus: HTMLTableCellElement | null = null
  for (let r = 0; r < grid.rowCount; r += 1) {
    if (spannedRows.has(r)) continue
    const template =
      grid.slots[r]?.[Math.min(insertAt, Math.max(0, grid.colCount - 1))]?.cell ??
      grid.slots[r]?.[Math.max(0, insertAt - 1)]?.cell ??
      cell
    const created = createCellShell(template)
    insertCellAtVisualColumn(table, r, insertAt, created)
    if (r === occ.originRow) focus = created
  }
  if (focus) placeCaretInCell(focus)
  return true
}

export function deleteRowInDocument(root: HTMLElement): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const grid = buildTableGrid(table)
  const occ = occupancyForCell(grid, cell)
  if (!occ) return false
  if (grid.rowCount <= 1) return removeTable(root, table)

  const rowIndex = occ.originRow
  const nextRowIndex = rowIndex + 1
  const toMove: TableSlot[] = []
  for (const slot of grid.unique) {
    const covers = slot.originRow <= rowIndex && slot.originRow + slot.rowSpan > rowIndex
    if (!covers) continue
    if (slot.originRow < rowIndex) {
      writeCellSpan(slot.cell, slot.colSpan, slot.rowSpan - 1)
    } else if (slot.originRow === rowIndex && slot.rowSpan > 1) {
      toMove.push(slot)
    }
  }
  toMove.sort((a, b) => a.originCol - b.originCol)
  for (const slot of toMove) {
    writeCellSpan(slot.cell, slot.colSpan, slot.rowSpan - 1)
    insertCellAtVisualColumn(table, nextRowIndex, slot.originCol, slot.cell)
  }

  const focusCol = occ.originCol
  table.rows[rowIndex].remove()
  const focusRow = table.rows[Math.min(rowIndex, table.rows.length - 1)]
  const nextGrid = buildTableGrid(table)
  const focus = nextGrid.slots[Math.min(rowIndex, nextGrid.rowCount - 1)]?.[Math.min(focusCol, Math.max(0, nextGrid.colCount - 1))]?.cell
  if (focus) placeCaretInCell(focus)
  else if (focusRow?.cells[0]) placeCaretInCell(focusRow.cells[0])
  else placeCaretAfter(table)
  return true
}

export function deleteColumnInDocument(root: HTMLElement): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const grid = buildTableGrid(table)
  const occ = occupancyForCell(grid, cell)
  if (!occ) return false
  if (grid.colCount <= 1) return removeTable(root, table)

  const col = occ.originCol
  const rowIndex = occ.originRow
  for (const slot of grid.unique) {
    if (col < slot.originCol || col >= slot.originCol + slot.colSpan) continue
    if (slot.colSpan === 1) slot.cell.remove()
    else writeCellSpan(slot.cell, slot.colSpan - 1, slot.rowSpan)
  }

  const nextGrid = buildTableGrid(table)
  if (nextGrid.colCount === 0 || nextGrid.unique.length === 0) return removeTable(root, table)
  const focus =
    nextGrid.slots[Math.min(rowIndex, nextGrid.rowCount - 1)]?.[Math.min(col, nextGrid.colCount - 1)]?.cell ??
    nextGrid.unique[0]?.cell
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

export function canMergeCellsInDocument(root: HTMLElement): boolean {
  return selectionMergePlan(root) !== null
}

export function canUnmergeCellsInDocument(root: HTMLElement): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const span = readCellSpan(cell)
  return span.colSpan > 1 || span.rowSpan > 1
}

export function mergeCellsInDocument(root: HTMLElement): boolean {
  const plan = selectionMergePlan(root)
  if (!plan) return false
  const table = closestTable(root, plan.origin.cell)
  if (!table) return false
  return applyMerge(table, plan)
}

export function unmergeCellsInDocument(root: HTMLElement): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  return unmergeCell(table, cell)
}

export function setCellSpanInDocument(root: HTMLElement, colSpan: number, rowSpan: number): boolean {
  const cell = cellAtSelection(root)
  if (!cell) return false
  const table = closestTable(root, cell)
  if (!table) return false
  const grid = buildTableGrid(table)
  const occ = occupancyForCell(grid, cell)
  if (!occ) return false
  const nextCols = Math.min(grid.colCount - occ.originCol, Math.max(1, Math.floor(colSpan)))
  const nextRows = Math.min(grid.rowCount - occ.originRow, Math.max(1, Math.floor(rowSpan)))
  if (nextCols === occ.colSpan && nextRows === occ.rowSpan) return false
  if (!canSetCellSpan(grid, occ, nextCols, nextRows)) return false
  if (occ.colSpan > 1 || occ.rowSpan > 1) {
    unmergeCell(table, cell)
  }
  if (nextCols === 1 && nextRows === 1) {
    placeCaretInCell(cell)
    return true
  }
  const nextGrid = buildTableGrid(table)
  const plan = mergeableRect(nextGrid, {
    minRow: occ.originRow,
    maxRow: occ.originRow + nextRows - 1,
    minCol: occ.originCol,
    maxCol: occ.originCol + nextCols - 1,
  })
  if (!plan) return true
  return applyMerge(table, plan)
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

function selectionMergePlan(root: HTMLElement): MergePlan | null {
  const cells = cellsInSelection(root)
  if (cells.length < 2) return null
  const table = closestTable(root, cells[0])
  if (!table) return null
  const grid = buildTableGrid(table)
  const slots: TableSlot[] = []
  for (const cell of cells) {
    const slot = occupancyForCell(grid, cell)
    if (!slot) return null
    slots.push(slot)
  }
  const rect = boundingRectOfSlots(slots)
  if (!rect) return null
  const plan = mergeableRect(grid, rect)
  if (!plan || plan.cells.length < 2) return null
  return plan
}

function applyMerge(table: HTMLTableElement, plan: MergePlan): boolean {
  const origin = plan.origin.cell
  const grid = buildTableGrid(table)
  const ordered = plan.cells
    .map((cell) => occupancyForCell(grid, cell))
    .filter((slot): slot is TableSlot => slot !== null)
    .sort((a, b) => a.originRow - b.originRow || a.originCol - b.originCol)
  for (const slot of ordered) {
    if (slot.cell !== origin) moveCellContents(origin, slot.cell)
  }
  writeCellSpan(origin, plan.colSpan, plan.rowSpan)
  for (const slot of ordered) {
    if (slot.cell !== origin) slot.cell.remove()
  }
  placeCaretInCell(origin)
  return true
}

function unmergeCell(table: HTMLTableElement, cell: HTMLTableCellElement): boolean {
  const grid = buildTableGrid(table)
  const occ = occupancyForCell(grid, cell)
  if (!occ || (occ.colSpan === 1 && occ.rowSpan === 1)) return false
  writeCellSpan(cell, 1, 1)
  for (let r = occ.originRow; r < occ.originRow + occ.rowSpan; r += 1) {
    for (let c = occ.originCol; c < occ.originCol + occ.colSpan; c += 1) {
      if (r === occ.originRow && c === occ.originCol) continue
      insertCellAtVisualColumn(table, r, c, createCellShell(cell))
    }
  }
  placeCaretInCell(cell)
  return true
}

function createDefaultCell(tag: 'td' | 'th'): HTMLTableCellElement {
  const cell = document.createElement(tag)
  cell.style.border = DEFAULT_TABLE_CELL_BORDER
  cell.style.padding = DEFAULT_TABLE_CELL_PADDING
  cell.appendChild(document.createElement('br'))
  return cell
}

function createCellShell(from: HTMLTableCellElement): HTMLTableCellElement {
  const cell = from.cloneNode(false) as HTMLTableCellElement
  cell.removeAttribute('colspan')
  cell.removeAttribute('rowspan')
  while (cell.firstChild) cell.removeChild(cell.firstChild)
  cell.appendChild(document.createElement('br'))
  return cell
}

function insertCellAt(row: HTMLTableRowElement, index: number, cell: HTMLTableCellElement): void {
  if (index >= row.cells.length) row.appendChild(cell)
  else row.insertBefore(cell, row.cells[index])
}

function insertCellAtVisualColumn(
  table: HTMLTableElement,
  rowIndex: number,
  col: number,
  cell: HTMLTableCellElement,
): void {
  const row = table.rows[rowIndex]
  if (!row) return
  const grid = buildTableGrid(table)
  let insertIndex = 0
  for (const existing of Array.from(row.cells)) {
    if (existing === cell) continue
    const slot = occupancyForCell(grid, existing)
    if (!slot || slot.originCol >= col) break
    insertIndex += 1
  }
  insertCellAt(row, insertIndex, cell)
}

function cellInNewRowAtColumn(
  row: HTMLTableRowElement,
  colCount: number,
  spannedCols: Set<number>,
  originCol: number,
): HTMLTableCellElement | null {
  let index = 0
  for (let c = 0; c < colCount; c += 1) {
    if (spannedCols.has(c)) continue
    if (c >= originCol) return row.cells[index] ?? null
    index += 1
  }
  return row.cells[row.cells.length - 1] ?? null
}

function isCellContentEmpty(cell: HTMLTableCellElement): boolean {
  if (cell.childNodes.length === 0) return true
  if (cell.childNodes.length === 1 && cell.firstChild?.nodeName === 'BR') return true
  return (
    (cell.textContent ?? '').trim().length === 0 && cell.querySelector('img, table, ul, ol, hr') === null
  )
}

function moveCellContents(target: HTMLTableCellElement, source: HTMLTableCellElement): void {
  if (target === source || isCellContentEmpty(source)) return
  if (isCellContentEmpty(target)) target.innerHTML = ''
  else target.appendChild(document.createTextNode(' '))
  while (source.firstChild) target.appendChild(source.firstChild)
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
