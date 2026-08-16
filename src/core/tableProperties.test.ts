import { afterEach, describe, expect, it } from 'vitest'
import { applyCellPropertiesInDocument, defaultCellPropertiesApply, readCellProperties } from './cellProperties'
import { applyRowPropertiesInDocument, defaultRowPropertiesApply, readRowProperties } from './rowProperties'
import { insertTableInDocument } from './table'
import {
  applyTablePropertiesInDocument,
  defaultTablePropertiesApply,
  readTableProperties,
} from './tableProperties'

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
  if (!startNode || !endNode) throw new Error('could not map offsets')
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

function insertAndSelect(el: HTMLElement) {
  selectOffsets(el, 1, 1)
  insertTableInDocument(el, { rows: 2, cols: 2 })
  return el.querySelector('table') as HTMLTableElement
}

describe('table properties', () => {
  it('reads insert defaults and writes border collapse, radius, and shadow', () => {
    const el = mountVisual('<p>x</p>')
    const table = insertAndSelect(el)
    const initial = readTableProperties(table)
    expect(initial.borderCollapse).toBe('collapse')
    expect(initial.width).toEqual({ value: 100, unit: '%' })

    expect(
      applyTablePropertiesInDocument(
        el,
        defaultTablePropertiesApply({
          border: { style: 'solid', width: { value: 2, unit: 'px' }, color: '#cc0000' },
          borderCollapse: 'separate',
          borderSpacing: { value: 4, unit: 'px' },
          borderRadius: { value: 8, unit: 'px' },
          boxShadow: {
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 4, unit: 'px' },
            blur: { value: 8, unit: 'px' },
            spread: { value: 0, unit: 'px' },
            color: '#000000',
            inset: false,
          },
          width: { value: 80, unit: '%' },
        }),
      ),
    ).toBe(true)

    expect(table.style.borderCollapse).toBe('separate')
    expect(table.style.borderSpacing).toBe('4px')
    expect(table.style.borderRadius).toBe('8px')
    expect(table.style.width).toBe('80%')
    expect(table.style.borderStyle).toBe('solid')
    expect(table.style.borderColor.replace(/\s/g, '')).toMatch(/#cc0000|rgb\(204,0,0\)/)
    expect(table.style.boxShadow).toContain('4px')
  })
})

describe('cell properties', () => {
  it('writes background, color, padding, and vertical align', () => {
    const el = mountVisual('<p>x</p>')
    const table = insertAndSelect(el)
    const cell = table.rows[0].cells[0]

    expect(
      applyCellPropertiesInDocument(
        el,
        defaultCellPropertiesApply({
          backgroundColor: '#ffeeaa',
          color: '#112233',
          padding: {
            top: { value: 8, unit: 'px' },
            right: { value: 8, unit: 'px' },
            bottom: { value: 8, unit: 'px' },
            left: { value: 8, unit: 'px' },
          },
          verticalAlign: 'middle',
          width: { value: 120, unit: 'px' },
        }),
      ),
    ).toBe(true)

    expect(cell.style.backgroundColor.replace(/\s/g, '')).toMatch(/#ffeeaa|rgb\(255,238,170\)/)
    expect(cell.style.color.replace(/\s/g, '')).toMatch(/#112233|rgb\(17,34,51\)/)
    expect(cell.style.paddingTop).toBe('8px')
    expect(cell.style.verticalAlign).toBe('middle')
    expect(cell.style.width).toBe('120px')
    expect(readCellProperties(cell).verticalAlign).toBe('middle')
  })
})

describe('row properties', () => {
  it('writes row color and padding onto the row cells', () => {
    const el = mountVisual('<p>x</p>')
    const table = insertAndSelect(el)
    const row = table.rows[0]

    expect(
      applyRowPropertiesInDocument(
        el,
        defaultRowPropertiesApply({
          backgroundColor: '#abcdef',
          color: '#010101',
          padding: {
            top: { value: 6, unit: 'px' },
            right: { value: 6, unit: 'px' },
            bottom: { value: 6, unit: 'px' },
            left: { value: 6, unit: 'px' },
          },
          height: { value: 40, unit: 'px' },
          verticalAlign: 'top',
        }),
      ),
    ).toBe(true)

    expect(row.style.backgroundColor.replace(/\s/g, '')).toMatch(/#abcdef|rgb\(171,205,239\)/)
    expect(row.style.color.replace(/\s/g, '')).toMatch(/#010101|rgb\(1,1,1\)/)
    expect(row.style.height).toBe('40px')
    expect(row.style.verticalAlign).toBe('top')
    expect(row.cells[0].style.paddingTop).toBe('6px')
    expect(row.cells[1].style.paddingTop).toBe('6px')
    expect(readRowProperties(row).height).toEqual({ value: 40, unit: 'px' })
  })
})
