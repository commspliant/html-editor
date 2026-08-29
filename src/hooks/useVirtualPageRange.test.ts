import { describe, expect, it } from 'vitest'
import {
  computeVirtualPageRange,
  findFirstVisiblePageIndex,
  findLastVisiblePageIndex,
} from './useVirtualPageRange'

describe('useVirtualPageRange helpers', () => {
  const heights = [100, 200, 300, 400]
  const prefixSums = [0, 100, 300, 600, 1000]

  it('finds the first visible page from scrollTop', () => {
    expect(findFirstVisiblePageIndex(0, prefixSums, heights.length)).toBe(0)
    expect(findFirstVisiblePageIndex(150, prefixSums, heights.length)).toBe(1)
    expect(findFirstVisiblePageIndex(650, prefixSums, heights.length)).toBe(3)
  })

  it('finds the last visible page from scrollBottom', () => {
    expect(findLastVisiblePageIndex(50, prefixSums, heights.length)).toBe(0)
    expect(findLastVisiblePageIndex(250, prefixSums, heights.length)).toBe(1)
    expect(findLastVisiblePageIndex(1000, prefixSums, heights.length)).toBe(3)
  })

  it('computes spacer heights for a visible window', () => {
    const range = computeVirtualPageRange(150, 250, prefixSums, heights.length, 0, 2, true)
    expect(range.startIndex).toBe(1)
    expect(range.endIndex).toBe(2)
    expect(range.topSpacerHeight).toBe(100)
    expect(range.bottomSpacerHeight).toBe(400)
  })

  it('includes the active page in the visible range when pinned', () => {
    const range = computeVirtualPageRange(0, 50, prefixSums, heights.length, 0, 3, true)
    expect(range.startIndex).toBe(0)
    expect(range.endIndex).toBe(3)
  })

  it('does not pin the active page when scrolling away', () => {
    const range = computeVirtualPageRange(150, 250, prefixSums, heights.length, 0, 0, false)
    expect(range.startIndex).toBe(1)
    expect(range.endIndex).toBe(2)
  })
})
