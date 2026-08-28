export const HISTORY_COALESCE_MS = 400

/** Maximum undo steps retained in memory to avoid unbounded growth on long sessions. */
export const HISTORY_MAX_PAST_ENTRIES = 100

/** Maximum cumulative character budget for past entries to prevent base64 images from causing OOM. (~20MB text) */
export const HISTORY_MAX_TOTAL_CHARS = 20_000_000

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
  let pastCharCount = 0
  let present = initialHtml
  let future: string[] = []
  let futureCharCount = 0
  let applying = false
  let coalescing = false
  let lastRecordAt = 0

  function trimPast(): void {
    if (past.length > HISTORY_MAX_PAST_ENTRIES) {
      const removed = past.splice(0, past.length - HISTORY_MAX_PAST_ENTRIES)
      for (const item of removed) {
        pastCharCount -= item.length
      }
    }
    while (past.length > 1 && pastCharCount + futureCharCount > HISTORY_MAX_TOTAL_CHARS) {
      const removed = past.shift()
      if (removed) {
        pastCharCount -= removed.length
      }
    }
  }

  function pushPast(entry: string): void {
    past.push(entry)
    pastCharCount += entry.length
    trimPast()
  }

  function clearFuture(): void {
    future = []
    futureCharCount = 0
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
    clearFuture()
    lastRecordAt = now
    coalescing = wantCoalesce
  }

  function undo(): string | null {
    if (past.length === 0) return null
    coalescing = false
    future.push(present)
    futureCharCount += present.length
    const next = past.pop() as string
    pastCharCount -= next.length
    present = next
    trimPast()
    return present
  }

  function redo(): string | null {
    if (future.length === 0) return null
    coalescing = false
    pushPast(present)
    const next = future.pop() as string
    futureCharCount -= next.length
    present = next
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
    clearFuture()
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
