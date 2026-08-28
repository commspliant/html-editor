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

export type RulerDragTarget =
  | { type: 'margin-left'; startMarginPx: number }
  | { type: 'margin-right'; startMarginPx: number }
  | { type: 'margin-top'; startMarginPx: number }
  | { type: 'margin-bottom'; startMarginPx: number }
  | { type: 'first-line-indent'; startFirstLinePx: number; startLeftIndentPx: number }
  | { type: 'left-indent'; startLeftIndentPx: number; startFirstLinePx: number }
  | { type: 'right-indent'; startRightIndentPx: number }
