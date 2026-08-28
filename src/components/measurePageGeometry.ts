import { resolvePageCanvasMarginPadding } from '../core/pageCanvasLayout'
import { queryPageAtRule } from '../core/pageAtRule'
import type { PageGeometry } from '../modules/ruler'
import { parseLengthToPx } from '../core/rulerUnits'

/** Measure page surface dimensions and margins in document CSS pixels. */
export function measurePageGeometry(surface: HTMLElement, pageHtml: string): PageGeometry {
  const padding = resolvePageCanvasMarginPadding(queryPageAtRule(pageHtml))
  return {
    pageWidthPx: surface.offsetWidth,
    pageHeightPx: surface.offsetHeight,
    marginsPx: {
      top: parseLengthToPx(padding.top, 0),
      right: parseLengthToPx(padding.right, 0),
      bottom: parseLengthToPx(padding.bottom, 0),
      left: parseLengthToPx(padding.left, 0),
    },
  }
}
