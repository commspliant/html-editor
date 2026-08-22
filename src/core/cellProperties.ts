import { clearEmptyStyle } from './blocks'
import {
  clampNonNegativeLength,
  cssLengthsEqual,
  formatCssLength,
  parseCssLength,
  type CssLength,
} from './cssLength'
import { normalizeCssColor } from './inlineColor'
import {
  EMPTY_BOX_SIDES,
  boxSidesEqual,
  readParagraphBox,
  writeParagraphBox,
  type BoxSides,
} from './paragraphBox'
import { cellAtSelection, cellsInSelection, setCellSpanInDocument } from './table'
import { readCellSpan } from './tableGrid'
import { readTextAlign, writeTextAlign, type TextAlign } from './textAlign'

export const CELL_VERTICAL_ALIGNS = ['top', 'middle', 'bottom', 'baseline'] as const

export type CellVerticalAlign = (typeof CELL_VERTICAL_ALIGNS)[number]

export type CellPropertiesApply = {
  backgroundColor: string | null
  color: string | null
  padding: BoxSides
  textAlign: TextAlign | null
  verticalAlign: CellVerticalAlign | null
  width: CssLength | null
  colSpan: number
  rowSpan: number
}

const VERTICAL_ALIGN_SET = new Set<string>(CELL_VERTICAL_ALIGNS)

export function defaultCellPropertiesApply(
  overrides: Partial<CellPropertiesApply> = {},
): CellPropertiesApply {
  return {
    backgroundColor: null,
    color: null,
    padding: { ...EMPTY_BOX_SIDES },
    textAlign: null,
    verticalAlign: null,
    width: null,
    colSpan: 1,
    rowSpan: 1,
    ...overrides,
  }
}

export function readCellProperties(cell: HTMLTableCellElement): CellPropertiesApply {
  const box = readParagraphBox(cell)
  return {
    backgroundColor: box.backgroundColor,
    color: readColor(cell),
    padding: box.padding,
    textAlign: readCellTextAlign(cell),
    verticalAlign: readVerticalAlign(cell),
    width: parseCssLength(cell.style.width),
    ...readCellSpan(cell),
  }
}

export function writeCellProperties(
  cell: HTMLTableCellElement,
  draft: CellPropertiesApply,
): boolean {
  let changed = writeParagraphBox(cell, {
    margin: { ...EMPTY_BOX_SIDES },
    marginMixed: true,
    padding: draft.padding,
    paddingMixed: false,
    lineHeight: null,
    lineHeightMixed: true,
    border: { style: 'none', width: null, color: null },
    borderMixed: true,
    borderRadius: null,
    radiusMixed: true,
    boxShadow: null,
    shadowMixed: true,
    backgroundColor: draft.backgroundColor,
    backgroundMixed: false,
    opacity: null,
    opacityMixed: true,
  })
  if (writeColor(cell, draft.color)) changed = true
  if (writeTextAlign(cell, draft.textAlign)) changed = true
  if (writeVerticalAlign(cell, draft.verticalAlign)) changed = true
  if (writeWidth(cell, draft.width)) changed = true
  if (changed) clearEmptyStyle(cell)
  return changed
}

export function queryCellAtSelection(root: HTMLElement): CellPropertiesApply | null {
  const cell = cellAtSelection(root)
  if (!cell) return null
  return readCellProperties(cell)
}

export function applyCellPropertiesInDocument(
  root: HTMLElement,
  draft: CellPropertiesApply,
): boolean {
  const cells = cellsInSelection(root)
  if (cells.length === 0) return false
  let changed = false
  for (const cell of cells) {
    if (writeCellProperties(cell, draft)) changed = true
  }
  const origin = cellAtSelection(root)
  if (origin) {
    const current = readCellSpan(origin)
    if (current.colSpan !== draft.colSpan || current.rowSpan !== draft.rowSpan) {
      if (setCellSpanInDocument(root, draft.colSpan, draft.rowSpan)) changed = true
    }
  }
  return changed
}

export function cellPropertiesEqual(a: CellPropertiesApply, b: CellPropertiesApply): boolean {
  return (
    a.backgroundColor === b.backgroundColor &&
    a.color === b.color &&
    boxSidesEqual(a.padding, b.padding) &&
    a.textAlign === b.textAlign &&
    a.verticalAlign === b.verticalAlign &&
    cssLengthsEqual(a.width, b.width) &&
    a.colSpan === b.colSpan &&
    a.rowSpan === b.rowSpan
  )
}

function readColor(el: HTMLElement): string | null {
  const raw = el.style.color
  if (!raw) return null
  return normalizeCssColor(raw)
}

function writeColor(el: HTMLElement, color: string | null): boolean {
  const next = color ? normalizeCssColor(color) : null
  const current = readColor(el)
  if (current === next) return false
  if (next) el.style.color = next
  else el.style.removeProperty('color')
  return true
}

function readCellTextAlign(cell: HTMLTableCellElement): TextAlign | null {
  const align = readTextAlign(cell)
  return align === 'left' ? null : align
}

function readVerticalAlign(el: HTMLElement): CellVerticalAlign | null {
  const raw = el.style.verticalAlign.trim().toLowerCase()
  if (VERTICAL_ALIGN_SET.has(raw)) return raw as CellVerticalAlign
  return null
}

function writeVerticalAlign(el: HTMLElement, value: CellVerticalAlign | null): boolean {
  const current = readVerticalAlign(el)
  if (current === value) return false
  if (value) el.style.verticalAlign = value
  else el.style.removeProperty('vertical-align')
  return true
}

function writeWidth(el: HTMLElement, width: CssLength | null): boolean {
  const next = width ? clampNonNegativeLength(width) : null
  const current = parseCssLength(el.style.width)
  if (cssLengthsEqual(current, next)) return false
  if (next) el.style.width = formatCssLength(next)
  else el.style.removeProperty('width')
  return true
}
