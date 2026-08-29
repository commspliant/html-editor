import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'
import { queryPageSurface } from '../core/multiPage'
import {
  emptyParagraphIndentState,
  queryParagraphIndent,
  type ParagraphIndentState,
} from '../core/paragraphIndent'
import type { PageGeometry } from '../core/pageGeometry'
import { measurePageGeometry } from '../core/pageGeometry'

function pageGeometriesEqual(
  previous: Record<number, PageGeometry>,
  measured: Record<number, PageGeometry>,
): boolean {
  const keys = Object.keys(measured)
  if (Object.keys(previous).length !== keys.length) return false
  return keys.every((key) => {
    const before = previous[Number(key)]
    const after = measured[Number(key)]
    return (
      before?.pageWidthPx === after.pageWidthPx &&
      before?.pageHeightPx === after.pageHeightPx &&
      before?.marginsPx.top === after.marginsPx.top &&
      before?.marginsPx.right === after.marginsPx.right &&
      before?.marginsPx.bottom === after.marginsPx.bottom &&
      before?.marginsPx.left === after.marginsPx.left
    )
  })
}

export function useMultiPageRulerMetrics(
  containerRef: RefObject<HTMLElement | null>,
  pages: readonly string[],
  mountedIndices: readonly number[],
  getActiveIndex: () => number,
  enabled = true,
  zoomScale = 1,
): {
  pageGeometries: Record<number, PageGeometry>
  geometryForPage: (index: number) => PageGeometry | null
  indentState: ParagraphIndentState
  refresh: () => void
} {
  const [pageGeometries, setPageGeometries] = useState<Record<number, PageGeometry>>({})
  const [indentState, setIndentState] = useState<ParagraphIndentState>(emptyParagraphIndentState())

  const geometryForPage = useCallback(
    (index: number): PageGeometry | null => pageGeometries[index] ?? null,
    [pageGeometries],
  )

  const refresh = useCallback(() => {
    const container = containerRef.current
    if (!enabled || !container) return
    const measured: Record<number, PageGeometry> = {}

    for (const index of mountedIndices) {
      const surface = queryPageSurface(container, index)
      if (!surface) continue
      const pageHtml = pages[index] ?? pages[0] ?? ''
      measured[index] = measurePageGeometry(surface, pageHtml)
    }

    setPageGeometries((previous) => {
      const merged = { ...previous, ...measured }
      return pageGeometriesEqual(previous, merged) ? previous : merged
    })

    const activeSurface = queryPageSurface(container, getActiveIndex())
    if (activeSurface) setIndentState(queryParagraphIndent(activeSurface))
  }, [containerRef, enabled, getActiveIndex, mountedIndices, pages])

  useLayoutEffect(() => {
    if (!enabled) return
    const frame = requestAnimationFrame(refresh)
    return () => cancelAnimationFrame(frame)
  }, [enabled, getActiveIndex, mountedIndices, pages, zoomScale, refresh])

  useLayoutEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') return
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => refresh())
    for (const index of mountedIndices) {
      const surface = queryPageSurface(container, index)
      if (surface) observer.observe(surface)
    }
    return () => observer.disconnect()
  }, [containerRef, enabled, mountedIndices, refresh])

  useLayoutEffect(() => {
    if (!enabled) return
    const handleSelection = () => {
      const container = containerRef.current
      if (!container) return
      const surface = queryPageSurface(container, getActiveIndex())
      if (surface) setIndentState(queryParagraphIndent(surface))
    }
    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [containerRef, enabled, getActiveIndex])

  return { pageGeometries, geometryForPage, indentState, refresh }
}
