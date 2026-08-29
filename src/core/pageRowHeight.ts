import { resolvePageCanvasSize } from './pageCanvasLayout'
import { queryPageAtRule } from './pageAtRule'
import { hasPrintLayout } from './printLayout'
import { parseLengthToPx } from './rulerUnits'

/** Gap between page rows (`1.5rem` in MultiPageVisualSurface). */
export const PAGE_ROW_GAP_REM = 1.5

/** Default estimated height for fluid (unsized) pages. */
export const FLUID_PAGE_ROW_HEIGHT_PX = 384

export function pageRowGapPx(index: number, rootFontSizePx = 16): number {
  return index > 0 ? PAGE_ROW_GAP_REM * rootFontSizePx : 0
}

/** Estimate row block height from stored page HTML when the row is not mounted. */
export function estimatePageRowHeight(pageHtml: string, index: number, rootFontSizePx = 16): number {
  const gap = pageRowGapPx(index, rootFontSizePx)
  if (!hasPrintLayout(pageHtml)) {
    return FLUID_PAGE_ROW_HEIGHT_PX + gap
  }
  const atRule = queryPageAtRule(pageHtml)
  const size = resolvePageCanvasSize(atRule, false)
  if (!size) {
    return FLUID_PAGE_ROW_HEIGHT_PX + gap
  }
  const height = parseLengthToPx(size.height, FLUID_PAGE_ROW_HEIGHT_PX)
  return height + gap
}

export function buildPrefixSums(
  pageCount: number,
  getRowHeight: (index: number) => number,
): number[] {
  const prefixSums: number[] = [0]
  for (let index = 0; index < pageCount; index += 1) {
    prefixSums.push(prefixSums[index]! + getRowHeight(index))
  }
  return prefixSums
}

export type PageHeightCache = {
  get: (index: number, pageHtml: string) => number
  set: (index: number, height: number) => void
  clear: () => void
  invalidateFrom: (fromIndex: number) => void
}

export function createPageHeightCache(): PageHeightCache {
  const heights = new Map<number, number>()

  return {
    get(index, pageHtml) {
      return heights.get(index) ?? estimatePageRowHeight(pageHtml, index)
    },
    set(index, height) {
      if (height > 0) {
        heights.set(index, height)
      }
    },
    clear() {
      heights.clear()
    },
    invalidateFrom(fromIndex) {
      for (const key of [...heights.keys()]) {
        if (key >= fromIndex) {
          heights.delete(key)
        }
      }
    },
  }
}
