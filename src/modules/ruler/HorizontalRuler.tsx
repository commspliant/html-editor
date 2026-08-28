import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  formatMeasurement,
  generateRulerTicks,
  snapRulerPosition,
  type RulerUnit,
} from '../../core/rulerUnits'
import type { ParagraphIndentState } from '../../core/paragraphIndent'
import { useT } from '../../i18n/LocaleProvider'
import type { PageGeometry, RulerDragTarget } from './rulerTypes'
import { MIN_PRINTABLE_PX } from './rulerTypes'
import { IndentArrowIcon } from './IndentArrowIcon'
import styles from './Ruler.module.css'

export type HorizontalRulerProps = {
  geometry: PageGeometry | null
  indentState: ParagraphIndentState
  unit?: RulerUnit
  /** Viewport zoom factor for converting screen pointer deltas to document px. */
  zoomScale?: number
  onMarginChange?: (sides: { left?: number; right?: number }) => void
  /** Live preview during margin drag; does not commit document HTML. */
  onMarginPreview?: (sides: { left?: number; right?: number }) => void
  onIndentChange?: (indent: {
    firstLineIndentPx?: number
    leftIndentPx?: number
    rightIndentPx?: number
  }) => void
}

type DragPreview = {
  target: RulerDragTarget['type']
  marginLeft?: number
  marginRight?: number
  firstLineIndentPx?: number
  leftIndentPx?: number
  rightIndentPx?: number
  measurementPx: number
  clientX: number
  clientY: number
}

export const HorizontalRuler: React.FC<HorizontalRulerProps> = ({
  geometry,
  indentState,
  unit = 'in',
  zoomScale = 1,
  onMarginChange,
  onMarginPreview,
  onIndentChange,
}) => {
  const t = useT()
  const [activeTarget, setActiveTarget] = useState<RulerDragTarget['type'] | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  const pageWidth = geometry?.pageWidthPx ?? 816
  const baseMarginLeft = geometry?.marginsPx.left ?? 96
  const baseMarginRight = geometry?.marginsPx.right ?? 96
  const layoutScale = zoomScale > 0 ? zoomScale : 1
  const dragScale = layoutScale

  const marginLeft = dragPreview?.marginLeft ?? baseMarginLeft
  const marginRight = dragPreview?.marginRight ?? baseMarginRight
  const firstLineIndentPx = dragPreview?.firstLineIndentPx ?? indentState.firstLineIndentPx
  const leftIndentPx = dragPreview?.leftIndentPx ?? indentState.leftIndentPx
  const rightIndentPx = dragPreview?.rightIndentPx ?? indentState.rightIndentPx

  const printableWidth = Math.max(0, pageWidth - marginLeft - marginRight)
  const showIndentHandles = !indentState.mixed

  const ticks = useMemo(() => {
    return generateRulerTicks(pageWidth, marginLeft, unit)
  }, [pageWidth, marginLeft, unit])

  const startDrag = useCallback(
    (target: RulerDragTarget, startEvent: React.PointerEvent) => {
      startEvent.preventDefault()
      startEvent.stopPropagation()

      setActiveTarget(target.type)

      const startX = Number.isFinite(startEvent.clientX) ? startEvent.clientX : 0
      const startY = Number.isFinite(startEvent.clientY) ? startEvent.clientY : 0
      const isAlt = startEvent.altKey

      const updateDragState = (
        clientX: number,
        clientY: number,
        alt: boolean,
      ): DragPreview => {
        const deltaX = (clientX - startX) / dragScale
        let measurementPx = 0
        const preview: DragPreview = {
          target: target.type,
          marginLeft: baseMarginLeft,
          marginRight: baseMarginRight,
          firstLineIndentPx: indentState.firstLineIndentPx,
          leftIndentPx: indentState.leftIndentPx,
          rightIndentPx: indentState.rightIndentPx,
          measurementPx: 0,
          clientX,
          clientY,
        }

        if (target.type === 'margin-left') {
          const raw = Math.max(
            0,
            Math.min(pageWidth - baseMarginRight - MIN_PRINTABLE_PX, target.startMarginPx + deltaX),
          )
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.marginLeft = snapped
          measurementPx = snapped
        } else if (target.type === 'margin-right') {
          const raw = Math.max(
            0,
            Math.min(pageWidth - baseMarginLeft - MIN_PRINTABLE_PX, target.startMarginPx - deltaX),
          )
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.marginRight = snapped
          measurementPx = snapped
        } else if (target.type === 'first-line-indent') {
          const minFirstLine = -target.startLeftIndentPx
          const maxFirstLine =
            pageWidth - baseMarginLeft - baseMarginRight - target.startLeftIndentPx - MIN_PRINTABLE_PX
          const raw = Math.max(
            minFirstLine,
            Math.min(maxFirstLine, target.startFirstLinePx + deltaX),
          )
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.firstLineIndentPx = snapped
          measurementPx = snapped
        } else if (target.type === 'left-indent') {
          const raw = Math.max(0, target.startLeftIndentPx + deltaX)
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.leftIndentPx = snapped
          preview.firstLineIndentPx = target.startFirstLinePx
          measurementPx = snapped
        } else if (target.type === 'right-indent') {
          const raw = Math.max(0, target.startRightIndentPx - deltaX)
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.rightIndentPx = snapped
          measurementPx = snapped
        }

        preview.measurementPx = measurementPx
        return preview
      }

      const emitMarginPreview = (preview: DragPreview) => {
        if (target.type === 'margin-left') {
          onMarginPreview?.({ left: preview.marginLeft })
        } else if (target.type === 'margin-right') {
          onMarginPreview?.({ right: preview.marginRight })
        }
      }

      const handlePointerMove = (e: PointerEvent) => {
        const cx = Number.isFinite(e.clientX) ? e.clientX : startX
        const cy = Number.isFinite(e.clientY) ? e.clientY : startY
        const preview = updateDragState(cx, cy, e.altKey)
        setDragPreview(preview)
        emitMarginPreview(preview)
      }

      const handlePointerUp = (e: PointerEvent) => {
        const cx = Number.isFinite(e.clientX) ? e.clientX : startX
        const cy = Number.isFinite(e.clientY) ? e.clientY : startY
        const finalPreview = updateDragState(cx, cy, e.altKey)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
        setActiveTarget(null)
        setDragPreview(null)

        if (target.type === 'margin-left') {
          onMarginChange?.({ left: finalPreview.marginLeft })
        } else if (target.type === 'margin-right') {
          onMarginChange?.({ right: finalPreview.marginRight })
        } else if (target.type === 'first-line-indent') {
          onIndentChange?.({ firstLineIndentPx: finalPreview.firstLineIndentPx })
        } else if (target.type === 'left-indent') {
          onIndentChange?.({ leftIndentPx: finalPreview.leftIndentPx })
        } else if (target.type === 'right-indent') {
          onIndentChange?.({ rightIndentPx: finalPreview.rightIndentPx })
        }
      }

      setDragPreview(updateDragState(startX, startY, isAlt))
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [
      baseMarginLeft,
      baseMarginRight,
      pageWidth,
      unit,
      dragScale,
      indentState,
      onMarginChange,
      onMarginPreview,
      onIndentChange,
    ],
  )

  const leftIndentAnchor = marginLeft + leftIndentPx
  const firstLinePos = leftIndentAnchor + firstLineIndentPx
  const rightIndentPos = pageWidth - marginRight - rightIndentPx
  const displayWidth = pageWidth * layoutScale

  return (
    <div
      ref={outerRef}
      className={`${styles.rulerRoot} ${styles.horizontalRulerGroup}`}
      style={{ width: `${displayWidth}px` }}
      data-testid="horizontal-ruler"
    >
      <div className={styles.horizontalRulerTrack}>
        <div
          className={styles.horizontalInner}
          style={{
            left: `${marginLeft * layoutScale}px`,
            width: `${printableWidth * layoutScale}px`,
          }}
          data-testid="ruler-printable-area"
        >
          <div
            className={`${styles.dragEdgeLeft} ${activeTarget === 'margin-left' ? styles.dragEdgeActive : ''}`}
            title={t('rulerMarginLeft')}
            aria-label={t('rulerMarginLeft')}
            data-testid="ruler-margin-splitter-left"
            onPointerDown={(e) =>
              startDrag({ type: 'margin-left', startMarginPx: baseMarginLeft }, e)
            }
          />
          <div
            className={`${styles.dragEdgeRight} ${activeTarget === 'margin-right' ? styles.dragEdgeActive : ''}`}
            title={t('rulerMarginRight')}
            aria-label={t('rulerMarginRight')}
            data-testid="ruler-margin-splitter-right"
            onPointerDown={(e) =>
              startDrag({ type: 'margin-right', startMarginPx: baseMarginRight }, e)
            }
          />
        </div>

        {ticks.map((tick, i) => (
          <React.Fragment key={i}>
            <div
              className={styles.tickH}
              style={{
                left: `${tick.positionPx * layoutScale}px`,
                height: `${tick.height}px`,
              }}
            />
            {tick.label ? (
              <span className={styles.tickLabelH} style={{ left: `${tick.positionPx * layoutScale}px` }}>
                {tick.label}
              </span>
            ) : null}
          </React.Fragment>
        ))}

        {showIndentHandles ? (
          <>
            <IndentArrowIcon
              type="down"
              style={{ left: `${firstLinePos * layoutScale}px` }}
              active={activeTarget === 'first-line-indent'}
              title={t('rulerFirstLineIndent')}
              aria-label={t('rulerFirstLineIndent')}
              data-testid="ruler-first-line-indent"
              onPointerDown={(e) =>
                startDrag(
                  {
                    type: 'first-line-indent',
                    startFirstLinePx: indentState.firstLineIndentPx,
                    startLeftIndentPx: indentState.leftIndentPx,
                  },
                  e,
                )
              }
            />
            <IndentArrowIcon
              type="up"
              style={{ left: `${leftIndentAnchor * layoutScale}px` }}
              active={activeTarget === 'left-indent'}
              title={t('rulerLeftIndent')}
              aria-label={t('rulerLeftIndent')}
              data-testid="ruler-left-indent"
              onPointerDown={(e) =>
                startDrag(
                  {
                    type: 'left-indent',
                    startLeftIndentPx: indentState.leftIndentPx,
                    startFirstLinePx: indentState.firstLineIndentPx,
                  },
                  e,
                )
              }
            />
            <IndentArrowIcon
              type="up"
              style={{ left: `${rightIndentPos * layoutScale}px` }}
              active={activeTarget === 'right-indent'}
              title={t('rulerRightIndent')}
              aria-label={t('rulerRightIndent')}
              data-testid="ruler-right-indent"
              onPointerDown={(e) =>
                startDrag(
                  { type: 'right-indent', startRightIndentPx: indentState.rightIndentPx },
                  e,
                )
              }
            />
          </>
        ) : null}
      </div>

      <div className={styles.horizontalRulerShelf} aria-hidden />

      {dragPreview ? (
        <div
          className={styles.rulerTooltip}
          style={{ left: dragPreview.clientX, top: dragPreview.clientY }}
          data-testid="ruler-drag-tooltip"
        >
          {formatMeasurement(dragPreview.measurementPx, unit)}
        </div>
      ) : null}
    </div>
  )
}
