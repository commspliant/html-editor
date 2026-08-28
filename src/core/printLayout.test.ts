import { describe, expect, it } from 'vitest'
import { hasPrintLayout } from './printLayout'

describe('hasPrintLayout', () => {
  it('returns true for a preset page size', () => {
    const html =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Hello</p></div>'
    expect(hasPrintLayout(html)).toBe(true)
  })

  it('returns false for plain HTML without @page', () => {
    expect(hasPrintLayout('<p>Hello</p>')).toBe(false)
  })

  it('returns false for orientation-only @page without a size', () => {
    const html =
      '<style data-page-at-rule>@page { size: landscape; }</style><div data-page><p>Hello</p></div>'
    expect(hasPrintLayout(html)).toBe(false)
  })

  it('returns true for custom width and height', () => {
    const html =
      '<style data-page-at-rule>@page { size: 20pt 30pt; }</style><div data-page><p>Hello</p></div>'
    expect(hasPrintLayout(html)).toBe(true)
  })
})
