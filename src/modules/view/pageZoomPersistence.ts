import type { PageZoomPreset } from '../../core/pageZoom'
import { PAGE_ZOOM_PRESETS } from '../../core/pageZoom'

export const PAGE_ZOOM_STORAGE_KEY = 'commspliant-html-editor.pageZoom'

const FIT_PRESETS = new Set<PageZoomPreset>(['fitWidth', 'fitPage'])

export function parsePageZoom(value: unknown): PageZoomPreset | null {
  if (typeof value === 'string' && FIT_PRESETS.has(value as PageZoomPreset)) {
    return value as PageZoomPreset
  }
  if (typeof value === 'number' && PAGE_ZOOM_PRESETS.includes(value as (typeof PAGE_ZOOM_PRESETS)[number])) {
    return value as PageZoomPreset
  }
  return null
}

export function readPageZoomFromStorage(): PageZoomPreset | null {
  try {
    const raw = localStorage.getItem(PAGE_ZOOM_STORAGE_KEY)
    if (!raw) return null
    return parsePageZoom(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writePageZoomToStorage(zoom: PageZoomPreset): void {
  try {
    localStorage.setItem(PAGE_ZOOM_STORAGE_KEY, JSON.stringify(zoom))
  } catch {
    /* ignore quota / private mode */
  }
}
