import type { CSSProperties, ReactNode } from 'react'
import type { ParagraphIndentState } from '../core/paragraphIndent'
import {
  HorizontalRuler,
  VerticalRuler,
  RULER_GUTTER_WIDTH_PX,
  type PageGeometry,
} from '../modules/ruler'
import type { RulerUnit } from '../core/rulerUnits'
import styles from './Editor.module.css'

type RulerMarginSides = {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

type RulerIndentSides = {
  firstLineIndentPx?: number
  leftIndentPx?: number
  rightIndentPx?: number
}

type RulerChromeProps = {
  showRulers: boolean
  geometry: PageGeometry | null
  indentState: ParagraphIndentState
  rulerUnit: RulerUnit
  zoomScale: number
  onMarginChange?: (sides: RulerMarginSides) => void
  onMarginPreview?: (sides: RulerMarginSides) => void
  onIndentChange?: (indents: RulerIndentSides) => void
}

export function buildPageZoomContentStyle(zoomScale: number): CSSProperties | undefined {
  if (zoomScale === 1) return undefined
  return {
    zoom: zoomScale,
    ['--page-zoom' as string]: String(zoomScale),
  }
}

export function RulerHorizontalHeader({
  showRulers,
  geometry,
  indentState,
  rulerUnit,
  zoomScale,
  onMarginChange,
  onMarginPreview,
  onIndentChange,
}: RulerChromeProps) {
  if (!showRulers) return null

  const gutterWidth = RULER_GUTTER_WIDTH_PX

  return (
    <div className={styles.multiPageRulerLayer}>
      <div className={styles.pageBlock}>
        <div
          className={styles.pageSurfaceRulerGutter}
          style={{ width: `${gutterWidth}px`, flex: `0 0 ${gutterWidth}px` }}
          aria-hidden
        />
        <HorizontalRuler
          geometry={geometry}
          indentState={indentState}
          unit={rulerUnit}
          zoomScale={zoomScale}
          onMarginChange={onMarginChange}
          onMarginPreview={onMarginPreview}
          onIndentChange={onIndentChange}
        />
      </div>
    </div>
  )
}

type RulerPageRowProps = Omit<RulerChromeProps, 'showRulers'> & {
  children: ReactNode
  pageBlockStyle?: CSSProperties
  /** When true, show the vertical ruler gutter and ruler for this page row. */
  showVerticalRuler?: boolean
  /** When true, the page has a fixed @page size; when false, use full-width / full-height fluid layout. */
  pageSized?: boolean
}

export function RulerPageRow({
  showVerticalRuler = false,
  pageSized = false,
  geometry,
  rulerUnit,
  zoomScale,
  onMarginChange,
  onMarginPreview,
  children,
  pageBlockStyle,
}: RulerPageRowProps) {
  const layoutScale = zoomScale > 0 ? zoomScale : 1
  const gutterWidth = showVerticalRuler ? RULER_GUTTER_WIDTH_PX / layoutScale : 0

  return (
    <div
      className={`${styles.pageBlock} ${!pageSized ? styles.pageBlockFluid : ''}`}
      style={pageBlockStyle}
    >
      <div
        className={styles.pageSurfaceRulerGutter}
        style={{ width: `${gutterWidth}px`, flex: `0 0 ${gutterWidth}px` }}
      >
        {showVerticalRuler ? (
          <VerticalRuler
            geometry={geometry}
            unit={rulerUnit}
            zoomScale={zoomScale}
            onMarginChange={onMarginChange}
            onMarginPreview={onMarginPreview}
          />
        ) : null}
      </div>
      {children}
    </div>
  )
}

type RulerVisualFrameProps = RulerChromeProps & {
  children: ReactNode
}

/** Single-page print layout: horizontal ruler header + page row with vertical ruler. */
export function RulerVisualFrame({
  showRulers,
  geometry,
  indentState,
  rulerUnit,
  zoomScale,
  onMarginChange,
  onMarginPreview,
  onIndentChange,
  children,
}: RulerVisualFrameProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: showRulers ? 'center' : 'stretch',
        width: '100%',
        height: '100%',
        minHeight: '100%',
        position: 'relative',
      }}
    >
      <RulerHorizontalHeader
        showRulers={showRulers}
        geometry={geometry}
        indentState={indentState}
        rulerUnit={rulerUnit}
        zoomScale={zoomScale}
        onMarginChange={onMarginChange}
        onMarginPreview={onMarginPreview}
        onIndentChange={onIndentChange}
      />
      <div
        className={styles.pageZoomContent}
        style={buildPageZoomContentStyle(zoomScale)}
      >
        <RulerPageRow
          showVerticalRuler={showRulers}
          pageSized={showRulers}
          geometry={geometry}
          indentState={indentState}
          rulerUnit={rulerUnit}
          zoomScale={zoomScale}
          onMarginChange={onMarginChange}
          onMarginPreview={onMarginPreview}
          onIndentChange={onIndentChange}
        >
          {children}
        </RulerPageRow>
      </div>
    </div>
  )
}
