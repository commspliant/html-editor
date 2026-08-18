export type TableSlot = {
  cell: HTMLTableCellElement
  originRow: number
  originCol: number
  rowSpan: number
  colSpan: number
}

export type TableRect = {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
}

export type TableGrid = {
  table: HTMLTableElement
  slots: (TableSlot | null)[][]
  unique: TableSlot[]
  rowCount: number
  colCount: number
}

export function readCellSpan(cell: HTMLTableCellElement): { colSpan: number; rowSpan: number } {
  return {
    colSpan: Math.max(1, cell.colSpan || 1),
    rowSpan: Math.max(1, cell.rowSpan || 1),
  }
}

export function writeCellSpan(cell: HTMLTableCellElement, colSpan: number, rowSpan: number): void {
  const cols = Math.max(1, Math.floor(colSpan))
  const rows = Math.max(1, Math.floor(rowSpan))
  if (cols <= 1) cell.removeAttribute('colspan')
  else cell.colSpan = cols
  if (rows <= 1) cell.removeAttribute('rowspan')
  else cell.rowSpan = rows
}

export function buildTableGrid(table: HTMLTableElement): TableGrid {
  const rowCount = table.rows.length
  const slots: (TableSlot | null)[][] = Array.from({ length: rowCount }, () => [])
  const unique: TableSlot[] = []
  let colCount = 0

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = table.rows[rowIndex]
    let col = 0
    for (const cell of Array.from(row.cells)) {
      while (slots[rowIndex][col]) col += 1
      const span = readCellSpan(cell)
      const slot: TableSlot = {
        cell,
        originRow: rowIndex,
        originCol: col,
        rowSpan: span.rowSpan,
        colSpan: span.colSpan,
      }
      unique.push(slot)
      for (let r = 0; r < span.rowSpan; r += 1) {
        const targetRow = rowIndex + r
        if (targetRow >= rowCount) break
        for (let c = 0; c < span.colSpan; c += 1) {
          slots[targetRow][col + c] = slot
        }
      }
      col += span.colSpan
      colCount = Math.max(colCount, col)
    }
    colCount = Math.max(colCount, slots[rowIndex].length)
  }

  return { table, slots, unique, rowCount, colCount }
}

export function slotAt(grid: TableGrid, row: number, col: number): TableSlot | null {
  return grid.slots[row]?.[col] ?? null
}

export function occupancyForCell(grid: TableGrid, cell: HTMLTableCellElement): TableSlot | null {
  return grid.unique.find((slot) => slot.cell === cell) ?? null
}

export function slotSticksOut(slot: TableSlot, rect: TableRect): boolean {
  return (
    slot.originRow < rect.minRow ||
    slot.originCol < rect.minCol ||
    slot.originRow + slot.rowSpan - 1 > rect.maxRow ||
    slot.originCol + slot.colSpan - 1 > rect.maxCol
  )
}

export function boundingRectOfSlots(slots: TableSlot[]): TableRect | null {
  if (slots.length === 0) return null
  let minRow = Infinity
  let maxRow = -Infinity
  let minCol = Infinity
  let maxCol = -Infinity
  for (const slot of slots) {
    minRow = Math.min(minRow, slot.originRow)
    maxRow = Math.max(maxRow, slot.originRow + slot.rowSpan - 1)
    minCol = Math.min(minCol, slot.originCol)
    maxCol = Math.max(maxCol, slot.originCol + slot.colSpan - 1)
  }
  return { minRow, maxRow, minCol, maxCol }
}

export function uniqueCellsInRect(grid: TableGrid, rect: TableRect): HTMLTableCellElement[] {
  const seen = new Set<HTMLTableCellElement>()
  const cells: HTMLTableCellElement[] = []
  for (let r = rect.minRow; r <= rect.maxRow; r += 1) {
    for (let c = rect.minCol; c <= rect.maxCol; c += 1) {
      const slot = slotAt(grid, r, c)
      if (!slot || seen.has(slot.cell)) continue
      seen.add(slot.cell)
      cells.push(slot.cell)
    }
  }
  return cells
}

export type MergePlan = {
  origin: TableSlot
  cells: HTMLTableCellElement[]
  colSpan: number
  rowSpan: number
}

export function mergeableRect(grid: TableGrid, rect: TableRect): MergePlan | null {
  if (rect.minRow > rect.maxRow || rect.minCol > rect.maxCol) return null
  const origin = slotAt(grid, rect.minRow, rect.minCol)
  if (!origin || origin.originRow !== rect.minRow || origin.originCol !== rect.minCol) return null
  const seen = new Set<HTMLTableCellElement>()
  const cells: HTMLTableCellElement[] = []
  for (let r = rect.minRow; r <= rect.maxRow; r += 1) {
    for (let c = rect.minCol; c <= rect.maxCol; c += 1) {
      const slot = slotAt(grid, r, c)
      if (!slot) return null
      if (slotSticksOut(slot, rect)) return null
      if (seen.has(slot.cell)) continue
      seen.add(slot.cell)
      cells.push(slot.cell)
    }
  }
  return {
    origin,
    cells,
    colSpan: rect.maxCol - rect.minCol + 1,
    rowSpan: rect.maxRow - rect.minRow + 1,
  }
}

export function canSetCellSpan(grid: TableGrid, slot: TableSlot, colSpan: number, rowSpan: number): boolean {
  const rect: TableRect = {
    minRow: slot.originRow,
    maxRow: slot.originRow + rowSpan - 1,
    minCol: slot.originCol,
    maxCol: slot.originCol + colSpan - 1,
  }
  if (rect.maxRow >= grid.rowCount || rect.maxCol >= grid.colCount) return false
  for (let r = rect.minRow; r <= rect.maxRow; r += 1) {
    for (let c = rect.minCol; c <= rect.maxCol; c += 1) {
      const current = slotAt(grid, r, c)
      if (!current) return false
      if (current.cell === slot.cell) continue
      if (slotSticksOut(current, rect)) return false
    }
  }
  return true
}
