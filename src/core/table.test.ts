import { afterEach, describe, expect, it } from 'vitest'
import {
  cellAtSelection,
  cellsInSelection,
  closestTable,
  canMergeCellsInDocument,
  canUnmergeCellsInDocument,
  deleteColumnInDocument,
  deleteRowInDocument,
  insertColumnInDocument,
  insertRowInDocument,
  insertTableInDocument,
  mergeCellsInDocument,
  setCellSpanInDocument,
  tabInTable,
  tableAtSelection,
  tableCells,
  unmergeCellsInDocument,
  validateTableSize,
} from './table'
import { buildTableGrid, occupancyForCell, readCellSpan } from './tableGrid'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function selectOffsets(el: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remainingStart = start
  let remainingEnd = end
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.data.length
    if (!startNode && remainingStart <= len) {
      startNode = text
      startOffset = remainingStart
    }
    if (!startNode) remainingStart -= len
    if (!endNode && remainingEnd <= len) {
      endNode = text
      endOffset = remainingEnd
      break
    }
    remainingEnd -= len
  }
  if (!startNode || !endNode) {
    throw new Error('could not map offsets to text nodes')
  }
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function selectNodeStart(node: Node) {
  const range = document.createRange()
  range.setStart(node, 0)
  range.collapse(true)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function selectCellRange(start: HTMLTableCellElement, end: HTMLTableCellElement) {
  const range = document.createRange()
  range.setStart(start, 0)
  range.setEnd(end, end.childNodes.length)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('validateTableSize', () => {
  it('accepts integers within bounds', () => {
    expect(validateTableSize(1, 1)).toBe(true)
    expect(validateTableSize(3, 4)).toBe(true)
    expect(validateTableSize(50, 50)).toBe(true)
  })

  it('rejects out of range and non-integers', () => {
    expect(validateTableSize(0, 1)).toBe(false)
    expect(validateTableSize(1, 51)).toBe(false)
    expect(validateTableSize(1.5, 2)).toBe(false)
  })
})

describe('insertTableInDocument', () => {
  it('inserts a table with inline styles and places the caret in the first cell', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 5, 5)

    expect(insertTableInDocument(el, { rows: 2, cols: 3 })).toBe(true)

    const table = el.querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.style.borderCollapse).toBe('collapse')
    expect(table?.style.width).toBe('100%')
    expect(table?.querySelectorAll('tr')).toHaveLength(2)
    expect(table?.querySelectorAll('td')).toHaveLength(6)
    const first = table?.querySelector('td') as HTMLTableCellElement
    expect(first.style.border).toMatch(/1px solid/)
    expect(first.style.padding).toBe('0.25em')
    expect(cellAtSelection(el)).toBe(first)
  })

  it('does not insert an invalid size', () => {
    const el = mountVisual('<p>Hi</p>')
    selectOffsets(el, 0, 0)
    expect(insertTableInDocument(el, { rows: 0, cols: 2 })).toBe(false)
    expect(el.querySelector('table')).toBeNull()
  })
})

describe('row and column commands', () => {
  function tableDoc() {
    const el = mountVisual('<p>x</p>')
    selectOffsets(el, 1, 1)
    insertTableInDocument(el, { rows: 2, cols: 2 })
    return el
  }

  it('inserts a row below and before', () => {
    const el = tableDoc()
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])

    expect(insertRowInDocument(el, 'below')).toBe(true)
    expect(table.rows).toHaveLength(3)
    expect(table.rows[1].cells).toHaveLength(2)

    selectNodeStart(table.rows[1].cells[0])
    expect(insertRowInDocument(el, 'before')).toBe(true)
    expect(table.rows).toHaveLength(4)
  })

  it('inserts a column after and before', () => {
    const el = tableDoc()
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])

    expect(insertColumnInDocument(el, 'after')).toBe(true)
    expect(table.rows[0].cells).toHaveLength(3)
    expect(table.rows[1].cells).toHaveLength(3)

    selectNodeStart(table.rows[0].cells[1])
    expect(insertColumnInDocument(el, 'before')).toBe(true)
    expect(table.rows[0].cells).toHaveLength(4)
  })

  it('deletes a row and removes the table when the last row is deleted', () => {
    const el = tableDoc()
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])
    expect(deleteRowInDocument(el)).toBe(true)
    expect(table.rows).toHaveLength(1)

    selectNodeStart(table.rows[0].cells[0])
    expect(deleteRowInDocument(el)).toBe(true)
    expect(el.querySelector('table')).toBeNull()
  })

  it('deletes a column and removes the table when the last column is deleted', () => {
    const el = tableDoc()
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])
    expect(deleteColumnInDocument(el)).toBe(true)
    expect(table.rows[0].cells).toHaveLength(1)

    selectNodeStart(table.rows[0].cells[0])
    expect(deleteColumnInDocument(el)).toBe(true)
    expect(el.querySelector('table')).toBeNull()
  })
})

describe('tabInTable', () => {
  it('moves to the next cell and inserts a row from the last cell', () => {
    const el = mountVisual('<p>x</p>')
    selectOffsets(el, 1, 1)
    insertTableInDocument(el, { rows: 1, cols: 2 })
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])

    expect(tabInTable(el, false)).toEqual({ changed: false })
    expect(cellAtSelection(el)).toBe(table.rows[0].cells[1])

    expect(tabInTable(el, false)).toEqual({ changed: true })
    expect(table.rows).toHaveLength(2)
    expect(cellAtSelection(el)).toBe(table.rows[1].cells[0])
  })

  it('moves to the previous cell with shift', () => {
    const el = mountVisual('<p>x</p>')
    selectOffsets(el, 1, 1)
    insertTableInDocument(el, { rows: 1, cols: 2 })
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[1])

    expect(tabInTable(el, true)).toEqual({ changed: false })
    expect(cellAtSelection(el)).toBe(table.rows[0].cells[0])
    expect(tabInTable(el, true)).toBe(false)
  })
})

describe('closest table at selection', () => {
  it('finds the table from a cell caret', () => {
    const el = mountVisual('<p>x</p>')
    selectOffsets(el, 1, 1)
    insertTableInDocument(el, { rows: 1, cols: 1 })
    const table = el.querySelector('table') as HTMLTableElement
    expect(tableAtSelection(el)).toBe(table)
    expect(closestTable(el, table.rows[0].cells[0])).toBe(table)
    expect(tableCells(table)).toHaveLength(1)
  })
})

describe('occupancy grid and cell selection', () => {
  it('maps visual columns when a cell has colspan', () => {
    const el = mountVisual(
      '<table><tbody><tr><td colspan="2">ab</td><td>c</td></tr><tr><td>d</td><td>e</td><td>f</td></tr></tbody></table>',
    )
    const table = el.querySelector('table') as HTMLTableElement
    const grid = buildTableGrid(table)
    expect(grid.colCount).toBe(3)
    expect(grid.rowCount).toBe(2)
    expect(occupancyForCell(grid, table.rows[0].cells[0])).toMatchObject({
      originRow: 0,
      originCol: 0,
      colSpan: 2,
      rowSpan: 1,
    })
    expect(occupancyForCell(grid, table.rows[0].cells[1])).toMatchObject({ originRow: 0, originCol: 2 })
    expect(occupancyForCell(grid, table.rows[1].cells[1])).toMatchObject({ originRow: 1, originCol: 1 })
  })

  it('selects the visual rectangle across spanned cells', () => {
    const el = mountVisual(
      '<table><tbody><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></tbody></table>',
    )
    const table = el.querySelector('table') as HTMLTableElement
    selectCellRange(table.rows[0].cells[0], table.rows[1].cells[1])
    expect(cellsInSelection(el)).toHaveLength(4)
  })
})

describe('merge and unmerge', () => {
  function tableDoc(rows = 2, cols = 2) {
    const el = mountVisual('<p>x</p>')
    selectOffsets(el, 1, 1)
    insertTableInDocument(el, { rows, cols })
    return el
  }

  it('merges a selected rectangle with colspan and rowspan', () => {
    const el = tableDoc(2, 2)
    const table = el.querySelector('table') as HTMLTableElement
    table.rows[0].cells[0].textContent = 'A'
    table.rows[0].cells[1].textContent = 'B'
    table.rows[1].cells[0].textContent = 'C'
    table.rows[1].cells[1].textContent = 'D'
    selectCellRange(table.rows[0].cells[0], table.rows[1].cells[1])

    expect(canMergeCellsInDocument(el)).toBe(true)
    expect(mergeCellsInDocument(el)).toBe(true)
    expect(table.rows[0].cells).toHaveLength(1)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 2, rowSpan: 2 })
    expect(table.rows[0].cells[0].textContent).toMatch(/A/)
    expect(table.rows[0].cells[0].textContent).toMatch(/D/)
    expect(table.querySelectorAll('td')).toHaveLength(1)
    expect(canUnmergeCellsInDocument(el)).toBe(true)
  })

  it('does not merge a single cell', () => {
    const el = tableDoc(2, 2)
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])
    expect(canMergeCellsInDocument(el)).toBe(false)
    expect(mergeCellsInDocument(el)).toBe(false)
  })

  it('unmerges a spanned cell into 1x1 cells', () => {
    const el = tableDoc(2, 2)
    const table = el.querySelector('table') as HTMLTableElement
    selectCellRange(table.rows[0].cells[0], table.rows[1].cells[1])
    mergeCellsInDocument(el)
    expect(unmergeCellsInDocument(el)).toBe(true)
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0].cells).toHaveLength(2)
    expect(table.rows[1].cells).toHaveLength(2)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 1, rowSpan: 1 })
    expect(canUnmergeCellsInDocument(el)).toBe(false)
  })

  it('expands and shrinks span from cell properties', () => {
    const el = tableDoc(2, 3)
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[0])
    expect(setCellSpanInDocument(el, 2, 1)).toBe(true)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 2, rowSpan: 1 })
    expect(table.rows[0].cells).toHaveLength(2)
    expect(setCellSpanInDocument(el, 1, 1)).toBe(true)
    expect(table.rows[0].cells).toHaveLength(3)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 1, rowSpan: 1 })
  })
})

describe('span-aware row and column commands', () => {
  it('inserts a column through a colspan by growing the span', () => {
    const el = mountVisual(
      '<table><tbody><tr><td colspan="2">ab</td></tr><tr><td>c</td><td>d</td></tr></tbody></table>',
    )
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[1].cells[0])
    expect(insertColumnInDocument(el, 'after')).toBe(true)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 3, rowSpan: 1 })
    expect(table.rows[1].cells).toHaveLength(3)
  })

  it('inserts a row through a rowspan by growing the span', () => {
    const el = mountVisual(
      '<table><tbody><tr><td rowspan="2">ac</td><td>b</td></tr><tr><td>d</td></tr></tbody></table>',
    )
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[0].cells[1])
    expect(insertRowInDocument(el, 'below')).toBe(true)
    expect(table.rows).toHaveLength(3)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 1, rowSpan: 3 })
    expect(table.rows[1].cells).toHaveLength(1)
  })

  it('deletes a column covered by colspan by shrinking the span', () => {
    const el = mountVisual(
      '<table><tbody><tr><td colspan="2">ab</td><td>c</td></tr><tr><td>d</td><td>e</td><td>f</td></tr></tbody></table>',
    )
    const table = el.querySelector('table') as HTMLTableElement
    selectNodeStart(table.rows[1].cells[1])
    expect(deleteColumnInDocument(el)).toBe(true)
    expect(readCellSpan(table.rows[0].cells[0])).toEqual({ colSpan: 1, rowSpan: 1 })
    expect(table.rows[0].cells).toHaveLength(2)
    expect(table.rows[1].cells).toHaveLength(2)
  })
})
