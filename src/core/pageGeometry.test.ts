import { describe, expect, it } from 'vitest'
import { measurePageGeometry } from './pageGeometry'

const pageHtml =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'

describe('measurePageGeometry', () => {
  it('reads surface dimensions and parses @page margins to px', () => {
    const surface = document.createElement('div')
    Object.defineProperty(surface, 'offsetWidth', { configurable: true, value: 816 })
    Object.defineProperty(surface, 'offsetHeight', { configurable: true, value: 1056 })

    const geometry = measurePageGeometry(surface, pageHtml)

    expect(geometry.pageWidthPx).toBe(816)
    expect(geometry.pageHeightPx).toBe(1056)
    expect(geometry.marginsPx.left).toBeGreaterThan(20)
    expect(geometry.marginsPx.left).toBeLessThan(35)
  })
})
