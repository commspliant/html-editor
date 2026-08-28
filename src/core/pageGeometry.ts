import { resolvePageCanvasMarginPadding } from './pageCanvasLayout'
import { queryPageAtRule } from './pageAtRule'
import { parseLengthToPx } from './rulerUnits'

/** Width of the vertical ruler gutter column in document CSS pixels. */
export const RULER_GUTTER_WIDTH_PX = 24

export type PageMarginsPx = {
  top: number
  right: number
  bottom: number
  left: number
}

/** Page dimensions and margins in document CSS pixels (unzoomed layout space). */
export type PageGeometry = {
  pageWidthPx: number
  pageHeightPx: number
  marginsPx: PageMarginsPx
}

export const MIN_PRINTABLE_PX = 48

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
