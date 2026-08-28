export {
  MIN_PRINTABLE_PX,
  RULER_GUTTER_WIDTH_PX,
  type PageGeometry,
  type PageMarginsPx,
} from '../../core/pageGeometry'

export type RulerDragTarget =
  | { type: 'margin-left'; startMarginPx: number }
  | { type: 'margin-right'; startMarginPx: number }
  | { type: 'margin-top'; startMarginPx: number }
  | { type: 'margin-bottom'; startMarginPx: number }
  | { type: 'first-line-indent'; startFirstLinePx: number; startLeftIndentPx: number }
  | { type: 'left-indent'; startLeftIndentPx: number; startFirstLinePx: number }
  | { type: 'right-indent'; startRightIndentPx: number }
