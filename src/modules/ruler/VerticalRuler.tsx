import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  formatMeasurement,
  generateRulerTicks,
  snapRulerPosition,
  type RulerUnit,
} from '../../core/rulerUnits'
import { useT } from '../../i18n/LocaleProvider'
import type { PageGeometry, RulerDragTarget } from './rulerTypes'
import { MIN_PRINTABLE_PX } from './rulerTypes'
import styles from './Ruler.module.css'

export type VerticalRulerProps = {
  geometry: PageGeometry | null
  unit?: RulerUnit
  /** Viewport zoom factor for converting screen pointer deltas to document px. */
  zoomScale?: number
  onMarginChange?: (sides: { top?: number; bottom?: number }) => void
  /** Live preview during margin drag; does not commit document HTML. */
  onMarginPreview?: (sides: { top?: number; bottom?: number }) => void
}

type DragPreview = {
  target: RulerDragTarget['type']
  marginTop?: number
  marginBottom?: number
  measurementPx: number
  clientX: number
  clientY: number
}

export const VerticalRuler: React.FC<VerticalRulerProps> = ({
  geometry,
  unit = 'in',
  zoomScale = 1,
  onMarginChange,
  onMarginPreview,
}) => {
  const t = useT()
  const [activeTarget, setActiveTarget] = useState<RulerDragTarget['type'] | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  const pageHeight = geometry?.pageHeightPx ?? 1056
  const baseMarginTop = geometry?.marginsPx.top ?? 96
  const baseMarginBottom = geometry?.marginsPx.bottom ?? 96
  const dragScale = zoomScale > 0 ? zoomScale : 1

  const marginTop = dragPreview?.marginTop ?? baseMarginTop
  const marginBottom = dragPreview?.marginBottom ?? baseMarginBottom
  const printableHeight = Math.max(0, pageHeight - marginTop - marginBottom)

  const ticks = useMemo(() => {
    return generateRulerTicks(pageHeight, marginTop, unit)
  }, [pageHeight, marginTop, unit])

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
        const deltaY = (clientY - startY) / dragScale
        const preview: DragPreview = {
          target: target.type,
          marginTop: baseMarginTop,
          marginBottom: baseMarginBottom,
          measurementPx: 0,
          clientX,
          clientY,
        }

        if (target.type === 'margin-top') {
          const raw = Math.max(
            0,
            Math.min(pageHeight - baseMarginBottom - MIN_PRINTABLE_PX, target.startMarginPx + deltaY),
          )
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.marginTop = snapped
          preview.measurementPx = snapped
        } else if (target.type === 'margin-bottom') {
          const raw = Math.max(
            0,
            Math.min(pageHeight - baseMarginTop - MIN_PRINTABLE_PX, target.startMarginPx - deltaY),
          )
          const snapped = snapRulerPosition(raw, unit, alt, 0)
          preview.marginBottom = snapped
          preview.measurementPx = snapped
        }

        return preview
      }

      const emitMarginPreview = (preview: DragPreview) => {
        if (target.type === 'margin-top') {
          onMarginPreview?.({ top: preview.marginTop })
        } else if (target.type === 'margin-bottom') {
          onMarginPreview?.({ bottom: preview.marginBottom })
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

        if (target.type === 'margin-top') {
          onMarginChange?.({ top: finalPreview.marginTop })
        } else if (target.type === 'margin-bottom') {
          onMarginChange?.({ bottom: finalPreview.marginBottom })
        }
      }

      setDragPreview(updateDragState(startX, startY, isAlt))
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [baseMarginTop, baseMarginBottom, pageHeight, unit, dragScale, onMarginChange, onMarginPreview],
  )

  return (
    <div
      ref={outerRef}
      className={`${styles.rulerRoot} ${styles.verticalRuler}`}
      style={{ height: `${pageHeight}px` }}
      data-testid="vertical-ruler"
    >
      <div
        className={styles.verticalInner}
        style={{
          top: `${marginTop}px`,
          height: `${printableHeight}px`,
        }}
        data-testid="ruler-printable-area-vertical"
      >
        <div
          className={`${styles.dragEdgeTop} ${activeTarget === 'margin-top' ? styles.dragEdgeActiveV : ''}`}
          title={t('rulerMarginTop')}
          aria-label={t('rulerMarginTop')}
          data-testid="ruler-margin-splitter-top"
          onPointerDown={(e) =>
            startDrag({ type: 'margin-top', startMarginPx: baseMarginTop }, e)
          }
        />
        <div
          className={`${styles.dragEdgeBottom} ${activeTarget === 'margin-bottom' ? styles.dragEdgeActiveV : ''}`}
          title={t('rulerMarginBottom')}
          aria-label={t('rulerMarginBottom')}
          data-testid="ruler-margin-splitter-bottom"
          onPointerDown={(e) =>
            startDrag({ type: 'margin-bottom', startMarginPx: baseMarginBottom }, e)
          }
        />
      </div>

      {ticks.map((tick, i) => (
        <React.Fragment key={i}>
          <div
            className={styles.tickV}
            style={{
              top: `${tick.positionPx}px`,
              width: `${tick.height}px`,
            }}
          />
          {tick.label ? (
            <span className={styles.tickLabelV} style={{ top: `${tick.positionPx}px` }}>
              {tick.label}
            </span>
          ) : null}
        </React.Fragment>
      ))}

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
