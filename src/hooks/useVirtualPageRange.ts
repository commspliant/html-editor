import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { buildPrefixSums } from '../core/pageRowHeight'

export const DEFAULT_PAGE_OVERSCAN = 2

export type VirtualPageRange = {
  startIndex: number
  endIndex: number
  topSpacerHeight: number
  bottomSpacerHeight: number
}

export function findFirstVisiblePageIndex(
  scrollTop: number,
  prefixSums: readonly number[],
  pageCount: number,
): number {
  if (pageCount <= 0) return 0
  let lo = 0
  let hi = pageCount - 1
  let result = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if ((prefixSums[mid + 1] ?? 0) > scrollTop) {
      result = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }
  return result
}

export function findLastVisiblePageIndex(
  scrollBottom: number,
  prefixSums: readonly number[],
  pageCount: number,
): number {
  if (pageCount <= 0) return -1
  let lo = 0
  let hi = pageCount - 1
  let result = pageCount - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if ((prefixSums[mid] ?? 0) < scrollBottom) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}

export function computeVirtualPageRange(
  scrollTop: number,
  viewportHeight: number,
  prefixSums: readonly number[],
  pageCount: number,
  overscan: number,
  activePageIndex: number,
  pinActivePage: boolean,
): VirtualPageRange {
  if (pageCount <= 0) {
    return { startIndex: 0, endIndex: -1, topSpacerHeight: 0, bottomSpacerHeight: 0 }
  }

  const totalHeight = prefixSums[pageCount] ?? 0
  if (totalHeight <= viewportHeight) {
    return { startIndex: 0, endIndex: pageCount - 1, topSpacerHeight: 0, bottomSpacerHeight: 0 }
  }

  const scrollBottom = scrollTop + viewportHeight
  const firstVisible = findFirstVisiblePageIndex(scrollTop, prefixSums, pageCount)
  const lastVisible = findLastVisiblePageIndex(scrollBottom, prefixSums, pageCount)
  let startIndex = Math.max(0, firstVisible - overscan)
  let endIndex = Math.min(pageCount - 1, lastVisible + overscan)
  if (pinActivePage) {
    startIndex = Math.min(startIndex, activePageIndex)
    endIndex = Math.max(endIndex, activePageIndex)
  }
  const topSpacerHeight = prefixSums[startIndex] ?? 0
  const bottomSpacerHeight = totalHeight - (prefixSums[endIndex + 1] ?? totalHeight)

  return { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight }
}

type UseVirtualPageRangeOptions = {
  scrollElementRef: RefObject<HTMLElement | null>
  pageCount: number
  getRowHeight: (index: number) => number
  overscan?: number
  activePageIndex: number
  pinActivePage?: boolean
}

export function useVirtualPageRange({
  scrollElementRef,
  pageCount,
  getRowHeight,
  overscan = DEFAULT_PAGE_OVERSCAN,
  activePageIndex,
  pinActivePage = true,
}: UseVirtualPageRangeOptions) {
  const estimateRowHeightRef = useRef(getRowHeight)
  estimateRowHeightRef.current = getRowHeight
  const measuredHeightsRef = useRef(new Map<number, number>())
  const [measureGeneration, setMeasureGeneration] = useState(0)

  useLayoutEffect(() => {
    measuredHeightsRef.current.clear()
  }, [pageCount])

  const resolveRowHeight = useCallback(
    (index: number) => {
      const measured = measuredHeightsRef.current.get(index)
      const estimate = estimateRowHeightRef.current(index)
      if (measured !== undefined) return Math.max(measured, estimate)
      return estimate
    },
    [measureGeneration],
  )

  const prefixSums = useMemo(
    () => buildPrefixSums(pageCount, resolveRowHeight),
    [pageCount, resolveRowHeight],
  )

  const [range, setRange] = useState<VirtualPageRange>(() => {
    const sums = buildPrefixSums(pageCount, (index) => estimateRowHeightRef.current(index))
    return computeVirtualPageRange(0, 300, sums, pageCount, overscan, activePageIndex, pinActivePage)
  })

  const updateRange = useCallback(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement || pageCount <= 0) return
    const viewportHeight = scrollElement.clientHeight > 0 ? scrollElement.clientHeight : 300
    const sums = buildPrefixSums(pageCount, resolveRowHeight)
    setRange(
      computeVirtualPageRange(
        scrollElement.scrollTop,
        viewportHeight,
        sums,
        pageCount,
        overscan,
        activePageIndex,
        pinActivePage,
      ),
    )
  }, [activePageIndex, overscan, pageCount, pinActivePage, resolveRowHeight, scrollElementRef])

  useLayoutEffect(() => {
    updateRange()
  }, [updateRange, prefixSums, activePageIndex, pageCount])

  useLayoutEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    const handleScroll = () => updateRange()
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateRange())
      resizeObserver.observe(scrollElement)
    }

    updateRange()
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      resizeObserver?.disconnect()
    }
  }, [scrollElementRef, updateRange])

  const notifyRowMeasured = useCallback((index: number, height: number) => {
    if (height <= 0) return
    const previous = measuredHeightsRef.current.get(index)
    if (previous !== undefined && Math.abs(previous - height) < 1) return
    measuredHeightsRef.current.set(index, height)
    setMeasureGeneration((generation) => generation + 1)
  }, [])

  const scrollToIndex = useCallback(
    (index: number) => {
      const scrollElement = scrollElementRef.current
      if (!scrollElement || index < 0 || index >= pageCount) return
      const sums = buildPrefixSums(pageCount, resolveRowHeight)
      scrollElement.scrollTop = sums[index] ?? 0
      updateRange()
    },
    [pageCount, resolveRowHeight, scrollElementRef, updateRange],
  )

  const visibleIndices = useMemo(() => {
    if (range.endIndex < range.startIndex) return []
    const indices: number[] = []
    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      indices.push(index)
    }
    return indices
  }, [range.endIndex, range.startIndex])

  return {
    ...range,
    visibleIndices,
    scrollToIndex,
    notifyRowMeasured,
  }
}
