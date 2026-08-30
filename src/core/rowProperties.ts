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
  emptyParagraphBoxApply,
  readParagraphBox,
  writeParagraphBox,
  type BoxSides,
} from './paragraphBox'
import { CELL_VERTICAL_ALIGNS, type CellVerticalAlign } from './cellProperties'
import { rowAtSelection } from './table'

export type RowPropertiesApply = {
  backgroundColor: string | null
  color: string | null
  padding: BoxSides
  height: CssLength | null
  verticalAlign: CellVerticalAlign | null
}

const VERTICAL_ALIGN_SET = new Set<string>(CELL_VERTICAL_ALIGNS)

export function defaultRowPropertiesApply(
  overrides: Partial<RowPropertiesApply> = {},
): RowPropertiesApply {
  return {
    backgroundColor: null,
    color: null,
    padding: { ...EMPTY_BOX_SIDES },
    height: null,
    verticalAlign: null,
    ...overrides,
  }
}

export function readRowProperties(row: HTMLTableRowElement): RowPropertiesApply {
  const first = row.cells[0]
  const padding = first ? readParagraphBox(first).padding : { ...EMPTY_BOX_SIDES }
  return {
    backgroundColor: readBackground(row),
    color: readColor(row),
    padding,
    height: parseCssLength(row.style.height),
    verticalAlign: readVerticalAlign(row),
  }
}

export function writeRowProperties(row: HTMLTableRowElement, draft: RowPropertiesApply): boolean {
  let changed = false
  if (writeBackground(row, draft.backgroundColor)) changed = true
  if (writeColor(row, draft.color)) changed = true
  if (writeHeight(row, draft.height)) changed = true
  if (writeVerticalAlign(row, draft.verticalAlign)) changed = true
  for (const cell of Array.from(row.cells)) {
    if (
      writeParagraphBox(cell, {
        ...emptyParagraphBoxApply(),
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
        backgroundColor: null,
        backgroundMixed: true,
        opacity: null,
        opacityMixed: true,
      })
    ) {
      changed = true
    }
  }
  if (changed) clearEmptyStyle(row)
  return changed
}

export function queryRowAtSelection(root: HTMLElement): RowPropertiesApply | null {
  const row = rowAtSelection(root)
  if (!row) return null
  return readRowProperties(row)
}

export function applyRowPropertiesInDocument(
  root: HTMLElement,
  draft: RowPropertiesApply,
): boolean {
  const row = rowAtSelection(root)
  if (!row) return false
  return writeRowProperties(row, draft)
}

export function rowPropertiesEqual(a: RowPropertiesApply, b: RowPropertiesApply): boolean {
  return (
    a.backgroundColor === b.backgroundColor &&
    a.color === b.color &&
    boxSidesEqual(a.padding, b.padding) &&
    cssLengthsEqual(a.height, b.height) &&
    a.verticalAlign === b.verticalAlign
  )
}

function readBackground(el: HTMLElement): string | null {
  const raw = el.style.backgroundColor
  if (!raw) return null
  return normalizeCssColor(raw)
}

function writeBackground(el: HTMLElement, color: string | null): boolean {
  const next = color ? normalizeCssColor(color) : null
  const current = readBackground(el)
  if (current === next) return false
  if (next) el.style.backgroundColor = next
  else el.style.removeProperty('background-color')
  return true
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

function writeHeight(el: HTMLElement, height: CssLength | null): boolean {
  const next = height ? clampNonNegativeLength(height) : null
  const current = parseCssLength(el.style.height)
  if (cssLengthsEqual(current, next)) return false
  if (next) el.style.height = formatCssLength(next)
  else el.style.removeProperty('height')
  return true
}
