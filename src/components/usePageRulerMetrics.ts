import { useCallback, useLayoutEffect, useState } from 'react'
import {
  emptyParagraphIndentState,
  queryParagraphIndent,
  type ParagraphIndentState,
} from '../core/paragraphIndent'
import type { PageGeometry } from '../core/pageGeometry'
import { measurePageGeometry } from '../core/pageGeometry'

export function usePageRulerMetrics(
  surface: HTMLElement | null,
  pageHtml: string,
  enabled = true,
): {
  geometry: PageGeometry | null
  indentState: ParagraphIndentState
  refresh: () => void
} {
  const [geometry, setGeometry] = useState<PageGeometry | null>(null)
  const [indentState, setIndentState] = useState<ParagraphIndentState>(emptyParagraphIndentState())

  const refresh = useCallback(() => {
    if (!enabled || !surface) return
    setGeometry(measurePageGeometry(surface, pageHtml))
    setIndentState(queryParagraphIndent(surface))
  }, [enabled, surface, pageHtml])

  useLayoutEffect(() => {
    if (!enabled) return
    const frame = requestAnimationFrame(refresh)
    return () => cancelAnimationFrame(frame)
  }, [enabled, refresh])

  useLayoutEffect(() => {
    if (!enabled || !surface || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => refresh())
    observer.observe(surface)
    return () => observer.disconnect()
  }, [enabled, surface, refresh])

  useLayoutEffect(() => {
    if (!enabled || !surface) return
    const handleSelection = () => {
      setIndentState(queryParagraphIndent(surface))
    }
    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [enabled, surface])

  return { geometry, indentState, refresh }
}
