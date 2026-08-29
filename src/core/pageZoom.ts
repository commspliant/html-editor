export const PAGE_ZOOM_PRESETS = [50, 75, 100, 125, 150, 200] as const

export type PageZoomPercent = (typeof PAGE_ZOOM_PRESETS)[number]

export type PageZoomPreset = 'fitWidth' | 'fitPage' | PageZoomPercent

export const PAGE_ZOOM_MIN = 0.1
export const PAGE_ZOOM_MAX = 3

export function clampPageZoomScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return 1
  return Math.min(PAGE_ZOOM_MAX, Math.max(PAGE_ZOOM_MIN, scale))
}

export function resolvePageZoomScale(
  preset: PageZoomPreset,
  workspaceWidth: number,
  workspaceHeight: number,
  pageWidth: number,
  pageHeight: number,
): number {
  if (preset === 'fitWidth') {
    if (pageWidth <= 0) return 1
    return clampPageZoomScale(workspaceWidth / pageWidth)
  }
  if (preset === 'fitPage') {
    if (pageWidth <= 0 || pageHeight <= 0) return 1
    const widthScale = workspaceWidth / pageWidth
    const heightScale = workspaceHeight / pageHeight
    return clampPageZoomScale(Math.min(widthScale, heightScale))
  }
  return clampPageZoomScale(preset / 100)
}

export function isPageZoomPercent(value: PageZoomPreset): value is PageZoomPercent {
  return typeof value === 'number'
}

export function isPageZoomFitPreset(preset: PageZoomPreset): preset is 'fitWidth' | 'fitPage' {
  return preset === 'fitWidth' || preset === 'fitPage'
}

export type PageZoomMeasureScheduler = {
  schedule: () => void
  cancel: () => void
}

export function createPageZoomMeasureScheduler(
  measure: () => void,
): PageZoomMeasureScheduler {
  let rafId: number | null = null
  return {
    schedule() {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        measure()
      })
    },
    cancel() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}
