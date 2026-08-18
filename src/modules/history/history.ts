export const HISTORY_COALESCE_MS = 400

/** Maximum undo steps retained in memory to avoid unbounded growth on long sessions. */
export const HISTORY_MAX_PAST_ENTRIES = 100

export type RecordOptions = {
  coalesce?: boolean
}

export type DocumentHistory = {
  record: (next: string, options?: RecordOptions) => void
  undo: () => string | null
  redo: () => string | null
  canUndo: () => boolean
  canRedo: () => boolean
  syncExternal: (html: string) => void
  markApplying: () => void
}

export function createDocumentHistory(initialHtml: string): DocumentHistory {
  let past: string[] = []
  let present = initialHtml
  let future: string[] = []
  let applying = false
  let coalescing = false
  let lastRecordAt = 0

  function trimPast(): void {
    if (past.length <= HISTORY_MAX_PAST_ENTRIES) return
    past.splice(0, past.length - HISTORY_MAX_PAST_ENTRIES)
  }

  function pushPast(entry: string): void {
    past.push(entry)
    trimPast()
  }

  function record(next: string, options?: RecordOptions): void {
    if (applying) {
      present = next
      applying = false
      return
    }
    if (next === present) return

    const now = Date.now()
    const wantCoalesce = options?.coalesce === true
    const inWindow = wantCoalesce && coalescing && now - lastRecordAt < HISTORY_COALESCE_MS

    if (inWindow) {
      present = next
      lastRecordAt = now
      return
    }

    pushPast(present)
    present = next
    future = []
    lastRecordAt = now
    coalescing = wantCoalesce
  }

  function undo(): string | null {
    if (past.length === 0) return null
    coalescing = false
    future.push(present)
    present = past.pop() as string
    return present
  }

  function redo(): string | null {
    if (future.length === 0) return null
    coalescing = false
    pushPast(present)
    present = future.pop() as string
    return present
  }

  function syncExternal(html: string): void {
    if (applying) {
      present = html
      applying = false
      return
    }
    if (html === present) return
    pushPast(present)
    present = html
    future = []
    coalescing = false
  }

  return {
    record,
    undo,
    redo,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    syncExternal,
    markApplying: () => {
      applying = true
    },
  }
}
