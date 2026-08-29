import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePageStore } from './usePageStore'

describe('usePageStore', () => {
  it('updates a single page while preserving sibling references', () => {
    const { result } = renderHook(() =>
      usePageStore({
        enabled: true,
        defaultPages: ['<p>One</p>', '<p>Two</p>'],
      }),
    )

    const before = result.current.pages
    act(() => {
      result.current.updatePage(1, '<p>Two edited</p>')
    })

    expect(result.current.pages[0]).toBe(before[0])
    expect(result.current.pages[1]).toBe('<p>Two edited</p>')
    expect(result.current.revision).toBe(1)
    expect(result.current.dirtyPagesRef.current.has(1)).toBe(true)
  })

  it('does not bump revision when page content is unchanged', () => {
    const { result } = renderHook(() =>
      usePageStore({
        enabled: true,
        defaultPages: ['<p>One</p>'],
      }),
    )

    act(() => {
      result.current.updatePage(0, '<p>One</p>')
    })

    expect(result.current.revision).toBe(0)
  })

  it('syncs controlled pages with structural sharing', () => {
    const { result, rerender } = renderHook(
      ({ pagesProp }) =>
        usePageStore({
          enabled: true,
          pagesProp,
          defaultPages: ['<p>One</p>', '<p>Two</p>'],
        }),
      { initialProps: { pagesProp: ['<p>One</p>', '<p>Two</p>'] as string[] } },
    )

    const stableOne = result.current.pages[0]
    rerender({ pagesProp: ['<p>One</p>', '<p>Two changed</p>'] })

    expect(result.current.pages[0]).toBe(stableOne)
    expect(result.current.pages[1]).toBe('<p>Two changed</p>')
  })
})
