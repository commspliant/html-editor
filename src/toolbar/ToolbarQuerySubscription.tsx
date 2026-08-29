import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ToolbarQueryRevisions, ToolbarQuerySlice } from './toolbarQueryRevisions'

const ToolbarQueryRevisionsContext = createContext<ToolbarQueryRevisions | null>(null)

export function ToolbarQueryRevisionsProvider({
  value,
  children,
}: {
  value: ToolbarQueryRevisions
  children: React.ReactNode
}) {
  return (
    <ToolbarQueryRevisionsContext.Provider value={value}>
      {children}
    </ToolbarQueryRevisionsContext.Provider>
  )
}

export function useToolbarQuerySlices(slices: readonly ToolbarQuerySlice[]): void {
  const store = useContext(ToolbarQueryRevisionsContext)
  const sliceKey = useMemo(() => slices.join('\0'), [slices])
  const stableSlices = useMemo(() => slices, [sliceKey, slices])

  useSyncExternalStore(
    (listener) => {
      if (!store) return () => {}
      const cleanups = stableSlices.map((slice) => store.subscribe(slice, listener))
      return () => {
        for (const cleanup of cleanups) cleanup()
      }
    },
    () => {
      if (!store) return 0
      let snapshot = 0
      for (const slice of stableSlices) {
        snapshot += store.getSnapshot(slice)
      }
      return snapshot
    },
    () => {
      if (!store) return 0
      let snapshot = 0
      for (const slice of stableSlices) {
        snapshot += store.getSnapshot(slice)
      }
      return snapshot
    },
  )
}
