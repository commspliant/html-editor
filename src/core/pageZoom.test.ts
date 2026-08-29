import { describe, expect, it, vi } from 'vitest'
import {
  clampPageZoomScale,
  createPageZoomMeasureScheduler,
  isPageZoomFitPreset,
  PAGE_ZOOM_MAX,
  PAGE_ZOOM_MIN,
  resolvePageZoomScale,
} from './pageZoom'

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

  it('detects fit presets', () => {
    expect(isPageZoomFitPreset('fitWidth')).toBe(true)
    expect(isPageZoomFitPreset('fitPage')).toBe(true)
    expect(isPageZoomFitPreset(100)).toBe(false)
  })

  it('coalesces scheduled measure calls into one animation frame', () => {
    vi.useFakeTimers()
    const measure = vi.fn()
    const scheduler = createPageZoomMeasureScheduler(measure)

    scheduler.schedule()
    scheduler.schedule()
    scheduler.schedule()
    expect(measure).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(measure).toHaveBeenCalledTimes(1)

    scheduler.cancel()
    vi.useRealTimers()
  })
})
