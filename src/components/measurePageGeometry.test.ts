import { afterEach, describe, expect, it } from 'vitest'
import { syncPageCanvasLayout } from '../core/pageCanvasLayout'
import { measurePageGeometry } from './measurePageGeometry'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('measurePageGeometry', () => {
  it('reads 1in @page margins as 96px', () => {
    const pageHtml =
      '<style data-page-at-rule>@page { size: A4; margin: 1in; }</style><div data-page><p>Hello</p></div>'
    const surface = document.createElement('div')
    surface.innerHTML = '<div data-page><p>Hello</p></div>'
    syncPageCanvasLayout(surface, pageHtml)
    document.body.appendChild(surface)

    const geometry = measurePageGeometry(surface, pageHtml)

    expect(geometry.marginsPx.left).toBe(96)
    expect(geometry.marginsPx.right).toBe(96)
    expect(geometry.marginsPx.top).toBe(96)
    expect(geometry.marginsPx.bottom).toBe(96)
  })
})
