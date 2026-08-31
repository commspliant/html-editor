import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import {
  joinPagesToHtml,
  mergePagesWithStructuralSharing,
  normalizePages,
  pagesArraysEqual,
  updatePageAt,
} from '../core/multiPage'

export type PageStoreSnapshot = {
  pages: string[]
  revision: number
}

export type SetPagesOptions = {
  editedIndex?: number
}

export type PageStore = {
  pages: string[]
  revision: number
  dirtyPagesRef: MutableRefObject<Set<number>>
  setPages: (nextPages: readonly string[], options?: SetPagesOptions) => PagesCommitResult
  updatePage: (index: number, nextPage: string, options?: SetPagesOptions) => PagesCommitResult
  replacePages: (nextPages: readonly string[]) => PagesCommitResult
  markPagesClean: (indices?: Iterable<number>) => void
  getJoinedHtml: () => string
}

export type PagesCommitResult = {
  changed: boolean
  pages: string[]
  joined: string
  changedIndices: number[]
}

const EMPTY_RESULT: PagesCommitResult = {
  changed: false,
  pages: [],
  joined: '',
  changedIndices: [],
}

function toCommitResult(
  merge: ReturnType<typeof mergePagesWithStructuralSharing>,
): PagesCommitResult {
  return {
    changed: merge.changed,
    pages: merge.pages,
    joined: joinPagesToHtml(merge.pages),
    changedIndices: merge.changedIndices,
  }
}

type UsePageStoreOptions = {
  enabled: boolean
  pagesProp?: string[]
  defaultPages: readonly string[]
}

function protectDirtyPagesFromProp(
  current: readonly string[],
  propPages: readonly string[],
  dirtyPages: ReadonlySet<number>,
): readonly string[] {
  if (dirtyPages.size === 0) return propPages
  return propPages.map((page, index) => {
    if (dirtyPages.has(index) && current[index] !== undefined && current[index] !== page) {
      return current[index]!
    }
    return page
  })
}

export function usePageStore({
  enabled,
  pagesProp,
  defaultPages,
}: UsePageStoreOptions): PageStore {
  const isControlled = enabled && pagesProp !== undefined
  const normalizedProp = useMemo(
    () => (pagesProp !== undefined ? normalizePages(pagesProp) : undefined),
    [pagesProp],
  )

  const [internal, setInternal] = useState<PageStoreSnapshot>(() => ({
    pages: normalizePages(defaultPages),
    revision: 0,
  }))

  const controlledCacheRef = useRef<string[]>(
    normalizedProp ?? normalizePages(defaultPages),
  )
  const dirtyPagesRef = useRef(new Set<number>())
  const propPagesRef = useRef(pagesProp)

  useEffect(() => {
    if (!enabled || !isControlled || normalizedProp === undefined) return
    if (propPagesRef.current === pagesProp && pagesArraysEqual(controlledCacheRef.current, normalizedProp)) {
      return
    }
    propPagesRef.current = pagesProp
    const incoming = protectDirtyPagesFromProp(
      controlledCacheRef.current,
      normalizedProp,
      dirtyPagesRef.current,
    )
    const merged = mergePagesWithStructuralSharing(controlledCacheRef.current, incoming)
    controlledCacheRef.current = merged.pages
    if (!merged.changed) return
    for (const index of merged.changedIndices) {
      dirtyPagesRef.current.add(index)
    }
    setInternal((prev) => ({
      pages: merged.pages,
      revision: prev.revision + 1,
    }))
  }, [enabled, isControlled, normalizedProp, pagesProp])

  const pages = useMemo(() => {
    if (!enabled) return []
    if (isControlled && normalizedProp !== undefined) {
      const incoming = protectDirtyPagesFromProp(
        controlledCacheRef.current,
        normalizedProp,
        dirtyPagesRef.current,
      )
      const merged = mergePagesWithStructuralSharing(controlledCacheRef.current, incoming)
      controlledCacheRef.current = merged.pages
      return merged.pages
    }
    return internal.pages
  }, [enabled, isControlled, normalizedProp, internal.pages, internal.revision])

  const applyPages = useCallback(
    (nextPages: readonly string[], editedIndex?: number): PagesCommitResult => {
      if (!enabled) return EMPTY_RESULT

      const current = isControlled ? controlledCacheRef.current : internal.pages
      const merged = mergePagesWithStructuralSharing(current, nextPages)
      if (!merged.changed) {
        return toCommitResult(merged)
      }

      for (const index of merged.changedIndices) {
        dirtyPagesRef.current.add(index)
      }
      if (editedIndex !== undefined) {
        dirtyPagesRef.current.add(editedIndex)
      }

      if (isControlled) {
        controlledCacheRef.current = merged.pages
      } else {
        setInternal((prev) => ({
          pages: merged.pages,
          revision: prev.revision + 1,
        }))
      }

      return toCommitResult(merged)
    },
    [enabled, internal.pages, isControlled],
  )

  const setPages = useCallback(
    (nextPages: readonly string[], options?: SetPagesOptions) =>
      applyPages(nextPages, options?.editedIndex),
    [applyPages],
  )

  const updatePage = useCallback(
    (index: number, nextPage: string, options?: SetPagesOptions): PagesCommitResult => {
      if (!enabled) return EMPTY_RESULT
      const current = isControlled ? controlledCacheRef.current : internal.pages
      const updated = updatePageAt(current, index, nextPage)
      if (!updated.changed) {
        return {
          changed: false,
          pages: current as string[],
          joined: joinPagesToHtml(current),
          changedIndices: [],
        }
      }
      return applyPages(updated.pages, options?.editedIndex ?? index)
    },
    [applyPages, enabled, internal.pages, isControlled],
  )

  const replacePages = useCallback(
    (nextPages: readonly string[]) => applyPages(normalizePages(nextPages)),
    [applyPages],
  )

  const markPagesClean = useCallback((indices?: Iterable<number>) => {
    if (indices === undefined) {
      dirtyPagesRef.current.clear()
      return
    }
    for (const index of indices) {
      dirtyPagesRef.current.delete(index)
    }
  }, [])

  const getJoinedHtml = useCallback(() => joinPagesToHtml(pages), [pages])

  return useMemo(
    () => ({
      pages,
      revision: internal.revision,
      dirtyPagesRef,
      setPages,
      updatePage,
      replacePages,
      markPagesClean,
      getJoinedHtml,
    }),
    [
      pages,
      internal.revision,
      setPages,
      updatePage,
      replacePages,
      markPagesClean,
      getJoinedHtml,
    ],
  )
}
