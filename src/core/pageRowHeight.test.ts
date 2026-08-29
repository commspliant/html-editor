import { describe, expect, it } from 'vitest'
import { CSS_PX_PER_INCH } from './rulerUnits'
import {
  buildPrefixSums,
  estimatePageRowHeight,
  pageRowGapPx,
} from './pageRowHeight'

const pageA4 =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>One</p></div>'
const pagePlain = '<div data-page><p>Plain</p></div>'

describe('pageRowHeight', () => {
  it('adds row gap only after the first page', () => {
    expect(pageRowGapPx(0)).toBe(0)
    expect(pageRowGapPx(1)).toBe(24)
  })

  it('estimates sized page height from @page preset', () => {
    const height = estimatePageRowHeight(pageA4, 0)
    expect(height).toBeGreaterThan(700)
    expect(height).toBeLessThan(1200)
  })

  it('estimates fluid page height with gap', () => {
    expect(estimatePageRowHeight(pagePlain, 1)).toBe(384 + 24)
  })

  it('builds prefix sums from row heights', () => {
    const prefix = buildPrefixSums(3, (index) => (index === 0 ? 100 : 200))
    expect(prefix).toEqual([0, 100, 300, 500])
  })

  it('matches letter page width in px when used as height estimate baseline', () => {
    const letter =
      '<style data-page-at-rule>@page { size: letter; margin: 1in; }</style><div data-page><p>Hi</p></div>'
    const height = estimatePageRowHeight(letter, 0)
    expect(height).toBe(11 * CSS_PX_PER_INCH)
  })
})
