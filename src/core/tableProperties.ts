import { clearEmptyStyle } from './blocks'
import {
  clampNonNegativeLength,
  cssLengthsEqual,
  formatCssLength,
  parseCssLength,
  type CssLength,
} from './cssLength'
import {
  EMPTY_BORDER,
  bordersEqual,
  readParagraphBox,
  shadowsEqual,
  writeParagraphBox,
  type ParagraphBorder,
  type ParagraphShadow,
} from './paragraphBox'
import { tableAtSelection } from './table'

export type TableBorderCollapse = 'collapse' | 'separate'

export type TablePropertiesApply = {
  border: ParagraphBorder
  borderCollapse: TableBorderCollapse
  borderSpacing: CssLength | null
  borderRadius: CssLength | null
  boxShadow: ParagraphShadow | null
  width: CssLength | null
}

export function defaultTablePropertiesApply(
  overrides: Partial<TablePropertiesApply> = {},
): TablePropertiesApply {
  return {
    border: { ...EMPTY_BORDER },
    borderCollapse: 'collapse',
    borderSpacing: null,
    borderRadius: null,
    boxShadow: null,
    width: { value: 100, unit: '%' },
    ...overrides,
  }
}

export function readTableProperties(table: HTMLTableElement): TablePropertiesApply {
  const box = readParagraphBox(table)
  return {
    border: box.border,
    borderCollapse: readBorderCollapse(table),
    borderSpacing: readBorderSpacing(table),
    borderRadius: box.borderRadius,
    boxShadow: box.boxShadow,
    width: parseCssLength(table.style.width),
  }
}

export function writeTableProperties(table: HTMLTableElement, draft: TablePropertiesApply): boolean {
  let changed = writeParagraphBox(table, {
    margin: { top: null, right: null, bottom: null, left: null },
    marginMixed: true,
    padding: { top: null, right: null, bottom: null, left: null },
    paddingMixed: true,
    lineHeight: null,
    lineHeightMixed: true,
    border: draft.border,
    borderMixed: false,
    borderRadius: draft.borderRadius,
    radiusMixed: false,
    boxShadow: draft.boxShadow,
    shadowMixed: false,
    backgroundColor: null,
    backgroundMixed: true,
    opacity: null,
    opacityMixed: true,
  })
  if (writeBorderCollapse(table, draft.borderCollapse)) changed = true
  if (writeBorderSpacing(table, draft.borderCollapse, draft.borderSpacing)) changed = true
  if (writeWidth(table, draft.width)) changed = true
  if (changed) clearEmptyStyle(table)
  return changed
}

export function queryTableAtSelection(root: HTMLElement): TablePropertiesApply | null {
  const table = tableAtSelection(root)
  if (!table) return null
  return readTableProperties(table)
}

export function applyTablePropertiesInDocument(
  root: HTMLElement,
  draft: TablePropertiesApply,
): boolean {
  const target = tableAtSelection(root)
  if (!target) return false
  return writeTableProperties(target, draft)
}

export function tablePropertiesEqual(a: TablePropertiesApply, b: TablePropertiesApply): boolean {
  return (
    bordersEqual(a.border, b.border) &&
    a.borderCollapse === b.borderCollapse &&
    cssLengthsEqual(a.borderSpacing, b.borderSpacing) &&
    cssLengthsEqual(a.borderRadius, b.borderRadius) &&
    shadowsEqual(a.boxShadow, b.boxShadow) &&
    cssLengthsEqual(a.width, b.width)
  )
}

function readBorderCollapse(table: HTMLTableElement): TableBorderCollapse {
  return table.style.borderCollapse.trim().toLowerCase() === 'separate' ? 'separate' : 'collapse'
}

function writeBorderCollapse(table: HTMLTableElement, value: TableBorderCollapse): boolean {
  const current = table.style.borderCollapse.trim().toLowerCase()
  if (current === value) return false
  table.style.borderCollapse = value
  return true
}

function readBorderSpacing(table: HTMLTableElement): CssLength | null {
  const raw = table.style.borderSpacing.trim()
  if (!raw) return null
  return parseCssLength(raw.split(/\s+/)[0] ?? '')
}

function writeBorderSpacing(
  table: HTMLTableElement,
  collapse: TableBorderCollapse,
  spacing: CssLength | null,
): boolean {
  if (collapse !== 'separate') {
    if (!table.style.borderSpacing) return false
    table.style.removeProperty('border-spacing')
    return true
  }
  const next = spacing ? clampNonNegativeLength(spacing) : null
  const current = readBorderSpacing(table)
  if (cssLengthsEqual(current, next)) return false
  if (next) table.style.borderSpacing = formatCssLength(next)
  else table.style.removeProperty('border-spacing')
  return true
}

function writeWidth(table: HTMLTableElement, width: CssLength | null): boolean {
  const next = width ? clampNonNegativeLength(width) : null
  const current = parseCssLength(table.style.width)
  if (cssLengthsEqual(current, next)) return false
  if (next) table.style.width = formatCssLength(next)
  else table.style.removeProperty('width')
  return true
}
