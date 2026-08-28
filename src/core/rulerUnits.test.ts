import { describe, expect, it } from 'vitest'
import {
  formatMeasurement,
  generateRulerTicks,
  parseLengthToPx,
  pxToCssLength,
  pxToUnit,
  snapRulerPosition,
  unitToPx,
} from './rulerUnits'

describe('rulerUnits', () => {
  it('converts inches to pixels and vice versa', () => {
    expect(unitToPx(1, 'in')).toBe(96)
    expect(pxToUnit(96, 'in')).toBe(1)
    expect(unitToPx(0.5, 'in')).toBe(48)
    expect(pxToUnit(48, 'in')).toBe(0.5)
  })

  it('converts cm to pixels and vice versa', () => {
    const pxIn1Cm = 96 / 2.54
    expect(unitToPx(1, 'cm')).toBeCloseTo(pxIn1Cm, 3)
    expect(pxToUnit(pxIn1Cm, 'cm')).toBeCloseTo(1, 3)
  })

  it('parses lengths correctly', () => {
    expect(parseLengthToPx('1in')).toBe(96)
    expect(parseLengthToPx('96px')).toBe(96)
    expect(parseLengthToPx({ value: 1.5, unit: 'in' as any })).toBe(144)
    expect(parseLengthToPx(null, 10)).toBe(10)
  })

  it('formats pxToCssLength correctly', () => {
    const length = pxToCssLength(96, 'in')
    expect(length.value).toBe(1)
    expect(length.unit).toBe('in')
  })

  it('formats measurement strings', () => {
    expect(formatMeasurement(96, 'in')).toBe('1.00 in')
    expect(formatMeasurement(144, 'in')).toBe('1.50 in')
  })

  it('snaps ruler position to 1/8 inch', () => {
    // 1/8 in = 12px
    expect(snapRulerPosition(10, 'in', false, 0)).toBe(12)
    expect(snapRulerPosition(17, 'in', false, 0)).toBe(12)
    expect(snapRulerPosition(19, 'in', false, 0)).toBe(24)
    // with altKey, no snap
    expect(snapRulerPosition(17, 'in', true, 0)).toBe(17)
  })

  it('generates ticks for a ruler range', () => {
    const ticks = generateRulerTicks(816, 96, 'in')
    expect(ticks.length).toBeGreaterThan(0)
    // zero point tick should exist
    const zeroTick = ticks.find((t) => Math.abs(t.unitValue) < 0.001)
    expect(zeroTick).toBeDefined()
    expect(zeroTick?.major).toBe(true)
    expect(zeroTick?.label).toBe('0')
  })
})
