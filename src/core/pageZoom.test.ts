import { describe, expect, it } from 'vitest'
import { clampPageZoomScale, PAGE_ZOOM_MAX, PAGE_ZOOM_MIN, resolvePageZoomScale } from './pageZoom'

describe('pageZoom', () => {
  it('clamps zoom scale', () => {
    expect(clampPageZoomScale(0)).toBe(1)
    expect(clampPageZoomScale(0.05)).toBe(PAGE_ZOOM_MIN)
    expect(clampPageZoomScale(5)).toBe(PAGE_ZOOM_MAX)
  })

  it('resolves fit width scale', () => {
    expect(resolvePageZoomScale('fitWidth', 800, 600, 400, 500)).toBe(2)
  })

  it('resolves fit page scale', () => {
    expect(resolvePageZoomScale('fitPage', 800, 600, 400, 500)).toBe(1.2)
  })

  it('resolves percentage scale', () => {
    expect(resolvePageZoomScale(150, 800, 600, 400, 500)).toBe(1.5)
  })
})
