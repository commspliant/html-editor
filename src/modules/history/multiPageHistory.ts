import { pagesArraysEqual } from '../../core/multiPage'
import {
  HISTORY_COALESCE_MS,
  HISTORY_MAX_PAST_ENTRIES,
  HISTORY_MAX_TOTAL_CHARS,
  type RecordOptions,
} from './history'

export type PageEditEntry = {
  type: 'pageEdit'
  pageIndex: number
  before: string
}

export type InsertPageEntry = {
  type: 'insertPage'
  index: number
  page: string
}

export type DeletePageEntry = {
  type: 'deletePage'
  index: number
  page: string
}

export type ReplaceAllEntry = {
  type: 'replaceAll'
  beforePages: string[]
}

export type MultiPageHistoryEntry =
  | PageEditEntry
  | InsertPageEntry
  | DeletePageEntry
  | ReplaceAllEntry

export type MultiPageHistory = {
  getPresent: () => readonly string[]
  recordPageEdit: (pageIndex: number, nextPage: string, options?: RecordOptions) => void
  recordInsertPage: (index: number, nextPages: readonly string[]) => void
  recordDeletePage: (index: number, deletedPage: string, nextPages: readonly string[]) => void
  recordReplaceAll: (nextPages: readonly string[]) => void
  undo: () => readonly string[] | null
  redo: () => readonly string[] | null
  canUndo: () => boolean
  canRedo: () => boolean
  syncPages: (pages: readonly string[]) => void
  applyPresent: (pages: readonly string[]) => void
  markApplying: () => void
}

function clonePages(pages: readonly string[]): string[] {
  return pages.map((page) => page)
}

function entryCharSize(entry: MultiPageHistoryEntry): number {
  switch (entry.type) {
    case 'pageEdit':
      return entry.before.length
    case 'insertPage':
      return entry.page.length
    case 'deletePage':
      return entry.page.length
    case 'replaceAll':
      return entry.beforePages.reduce((sum, page) => sum + page.length, 0)
  }
}

export function createMultiPageHistory(initialPages: readonly string[]): MultiPageHistory {
  let past: MultiPageHistoryEntry[] = []
  let pastCharCount = 0
  let present = clonePages(initialPages)
  let future: MultiPageHistoryEntry[] = []
  let futureCharCount = 0
  let applying = false
  let coalescing = false
  let coalescingPageIndex: number | null = null
  let lastRecordAt = 0

  function trimPast(): void {
    if (past.length > HISTORY_MAX_PAST_ENTRIES) {
      const removed = past.splice(0, past.length - HISTORY_MAX_PAST_ENTRIES)
      for (const item of removed) {
        pastCharCount -= entryCharSize(item)
      }
    }
    while (past.length > 1 && pastCharCount + futureCharCount > HISTORY_MAX_TOTAL_CHARS) {
      const removed = past.shift()
      if (removed) {
        pastCharCount -= entryCharSize(removed)
      }
    }
  }

  function pushPast(entry: MultiPageHistoryEntry): void {
    past.push(entry)
    pastCharCount += entryCharSize(entry)
    trimPast()
  }

  function pushFuture(entry: MultiPageHistoryEntry): void {
    future.push(entry)
    futureCharCount += entryCharSize(entry)
  }

  function clearFuture(): void {
    for (const entry of future) {
      futureCharCount -= entryCharSize(entry)
    }
    future = []
    futureCharCount = 0
  }

  function resetCoalescing(): void {
    coalescing = false
    coalescingPageIndex = null
  }

  function recordPageEdit(pageIndex: number, nextPage: string, options?: RecordOptions): void {
    if (applying) {
      const next = clonePages(present)
      next[pageIndex] = nextPage
      present = next
      applying = false
      return
    }
    if (present[pageIndex] === nextPage) return

    const now = Date.now()
    const wantCoalesce = options?.coalesce === true
    const inWindow =
      wantCoalesce &&
      coalescing &&
      coalescingPageIndex === pageIndex &&
      now - lastRecordAt < HISTORY_COALESCE_MS

    const next = clonePages(present)
    next[pageIndex] = nextPage

    if (inWindow) {
      present = next
      lastRecordAt = now
      return
    }

    pushPast({
      type: 'pageEdit',
      pageIndex,
      before: present[pageIndex] ?? '',
    })
    present = next
    clearFuture()
    lastRecordAt = now
    coalescing = wantCoalesce
    coalescingPageIndex = pageIndex
  }

  function recordInsertPage(index: number, nextPages: readonly string[]): void {
    if (applying) {
      present = clonePages(nextPages)
      applying = false
      return
    }
    if (pagesArraysEqual(present, nextPages)) return

    pushPast({
      type: 'insertPage',
      index,
      page: nextPages[index] ?? '',
    })
    present = clonePages(nextPages)
    clearFuture()
    resetCoalescing()
  }

  function recordDeletePage(
    index: number,
    deletedPage: string,
    nextPages: readonly string[],
  ): void {
    if (applying) {
      present = clonePages(nextPages)
      applying = false
      return
    }
    if (pagesArraysEqual(present, nextPages)) return

    pushPast({ type: 'deletePage', index, page: deletedPage })
    present = clonePages(nextPages)
    clearFuture()
    resetCoalescing()
  }

  function recordReplaceAll(nextPages: readonly string[]): void {
    if (applying) {
      present = clonePages(nextPages)
      applying = false
      return
    }
    if (pagesArraysEqual(present, nextPages)) return

    pushPast({ type: 'replaceAll', beforePages: clonePages(present) })
    present = clonePages(nextPages)
    clearFuture()
    resetCoalescing()
  }

  function applyPresent(nextPages: readonly string[]): void {
    if (applying) {
      present = clonePages(nextPages)
      applying = false
      return
    }
    if (pagesArraysEqual(present, nextPages)) return
    present = clonePages(nextPages)
  }

  function undo(): readonly string[] | null {
    if (past.length === 0) return null
    resetCoalescing()
    const entry = past.pop() as MultiPageHistoryEntry
    pastCharCount -= entryCharSize(entry)

    switch (entry.type) {
      case 'pageEdit': {
        const current = present[entry.pageIndex] ?? ''
        pushFuture({ type: 'pageEdit', pageIndex: entry.pageIndex, before: current })
        present[entry.pageIndex] = entry.before
        break
      }
      case 'insertPage': {
        const removed = present[entry.index] ?? ''
        pushFuture({ type: 'insertPage', index: entry.index, page: removed })
        present.splice(entry.index, 1)
        break
      }
      case 'deletePage': {
        pushFuture({ type: 'deletePage', index: entry.index, page: entry.page })
        present.splice(entry.index, 0, entry.page)
        break
      }
      case 'replaceAll': {
        pushFuture({ type: 'replaceAll', beforePages: clonePages(present) })
        present = clonePages(entry.beforePages)
        break
      }
    }

    trimPast()
    return present
  }

  function redo(): readonly string[] | null {
    if (future.length === 0) return null
    resetCoalescing()
    const entry = future.pop() as MultiPageHistoryEntry
    futureCharCount -= entryCharSize(entry)

    switch (entry.type) {
      case 'pageEdit': {
        const current = present[entry.pageIndex] ?? ''
        pushPast({ type: 'pageEdit', pageIndex: entry.pageIndex, before: current })
        present[entry.pageIndex] = entry.before
        break
      }
      case 'insertPage': {
        pushPast({ type: 'insertPage', index: entry.index, page: entry.page })
        present.splice(entry.index, 0, entry.page)
        break
      }
      case 'deletePage': {
        const removed = present[entry.index] ?? ''
        pushPast({ type: 'deletePage', index: entry.index, page: removed })
        present.splice(entry.index, 1)
        break
      }
      case 'replaceAll': {
        pushPast({ type: 'replaceAll', beforePages: clonePages(present) })
        present = clonePages(entry.beforePages)
        break
      }
    }

    return present
  }

  return {
    getPresent: () => present,
    recordPageEdit,
    recordInsertPage,
    recordDeletePage,
    recordReplaceAll,
    undo,
    redo,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    syncPages: (pages) => recordReplaceAll(pages),
    applyPresent,
    markApplying: () => {
      applying = true
    },
  }
}

export function isMultiPageHistory(
  history: unknown,
): history is MultiPageHistory {
  return (
    typeof history === 'object' &&
    history !== null &&
    'recordPageEdit' in history &&
    typeof (history as MultiPageHistory).recordPageEdit === 'function'
  )
}
