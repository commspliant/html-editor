import { useMemo, useRef } from 'react'
import { extractFontStylesheets } from '../core/fontFamily'

/** Derive visual page bodies with per-index caching when page strings are unchanged. */
export function useVisualPageBodies(pages: readonly string[], revision: number): string[] {
  const pagesSnapshotRef = useRef<readonly string[]>([])
  const bodiesRef = useRef<string[]>([])

  return useMemo(() => {
    const prevPages = pagesSnapshotRef.current
    const prevBodies = bodiesRef.current
    const next: string[] = []
    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i] ?? ''
      if (prevPages[i] === page && prevBodies[i] !== undefined) {
        next.push(prevBodies[i]!)
      } else {
        next.push(extractFontStylesheets(page).body)
      }
    }
    pagesSnapshotRef.current = pages
    bodiesRef.current = next
    return next
    // revision bumps when pages content changes even if array reference were stable
  }, [pages, revision])
}
