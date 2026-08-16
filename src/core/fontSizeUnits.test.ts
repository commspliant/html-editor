import { describe, expect, it } from 'vitest'
import {
  clampFontSize,
  convertFontSize,
  formatFontSize,
  parseFontSize,
  parseFontSizeInput,
  pxToUnit,
} from './fontSizeUnits'

describe('parseFontSize', () => {
  it('parses pt px em rem and percent', () => {
    expect(parseFontSize('12pt')).toEqual({ value: 12, unit: 'pt' })
    expect(parseFontSize('16px')).toEqual({ value: 16, unit: 'px' })
    expect(parseFontSize('1.25em')).toEqual({ value: 1.25, unit: 'em' })
    expect(parseFontSize('2rem')).toEqual({ value: 2, unit: 'rem' })
    expect(parseFontSize('150%')).toEqual({ value: 150, unit: '%' })
  })

  it('parses unknown CSS units without treating them as selectable', () => {
    expect(parseFontSize('1.2cm')).toEqual({ value: 1.2, unit: 'cm' })
  })
})

describe('parseFontSizeInput', () => {
  it('uses the fallback unit for a bare number', () => {
    expect(parseFontSizeInput('14', 'pt')).toEqual({ value: 14, unit: 'pt' })
  })

  it('rejects zero and negatives', () => {
    expect(parseFontSizeInput('0', 'pt')).toBeNull()
    expect(parseFontSizeInput('-4', 'px')).toBeNull()
  })

  it('clamps to the unit maximum', () => {
    expect(parseFontSizeInput('900', 'pt')).toEqual({ value: 400, unit: 'pt' })
    expect(parseFontSizeInput('50', 'em')).toEqual({ value: 20, unit: 'em' })
  })
})

describe('clampFontSize', () => {
  it('rejects non-positive values', () => {
    expect(clampFontSize(0, 'px')).toBeNull()
    expect(clampFontSize(-1, 'pt')).toBeNull()
  })
})

describe('convertFontSize', () => {
  it('converts pt to px at 96dpi', () => {
    expect(convertFontSize(12, 'pt', 'px', 16, 16)).toBe(16)
    expect(pxToUnit(16, 'pt', 16, 16)).toBe(12)
  })

  it('converts px to em using the parent size', () => {
    expect(convertFontSize(24, 'px', 'em', 16, 16)).toBe(1.5)
    expect(convertFontSize(1, 'em', '%', 16, 16)).toBe(100)
  })
})

describe('formatFontSize', () => {
  it('omits trailing zeros', () => {
    expect(formatFontSize(12, 'pt')).toBe('12pt')
    expect(formatFontSize(1.5, 'em')).toBe('1.5em')
  })
})
