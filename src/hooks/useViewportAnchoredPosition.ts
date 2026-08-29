import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'

export const VIEWPORT_PAD_PX = 4

export type ViewportAnchorCoords = {
  top: number
  left: number
  width?: number
}

export type ComputeViewportAnchorOptions = {
  anchorRect: DOMRect
  floatingWidth: number
  floatingHeight: number
  pad?: number
  minWidth?: number
  matchAnchorWidth?: boolean
}

export function computeViewportAnchoredPosition({
  anchorRect,
  floatingWidth,
  floatingHeight,
  pad = VIEWPORT_PAD_PX,
  minWidth = 0,
  matchAnchorWidth = false,
}: ComputeViewportAnchorOptions): ViewportAnchorCoords {
  const width = matchAnchorWidth ? Math.max(anchorRect.width, floatingWidth, minWidth) : floatingWidth
  let top = anchorRect.bottom
  if (top + floatingHeight > window.innerHeight - pad) {
    top = Math.max(pad, anchorRect.top - floatingHeight)
  }
  const left = Math.min(
    Math.max(anchorRect.left, pad),
    window.innerWidth - width - pad,
  )
  return matchAnchorWidth ? { top, left, width } : { top, left }
}

export type UseViewportAnchoredPositionOptions = {
  pad?: number
  minWidth?: number
  matchAnchorWidth?: boolean
  deps?: readonly unknown[]
}

export function useViewportAnchoredPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  floatingRef: RefObject<HTMLElement | null>,
  {
    pad = VIEWPORT_PAD_PX,
    minWidth = 0,
    matchAnchorWidth = false,
    deps = [],
  }: UseViewportAnchoredPositionOptions = {},
): ViewportAnchorCoords {
  const [coords, setCoords] = useState<ViewportAnchorCoords>({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor) return
    const anchorRect = anchor.getBoundingClientRect()
    const floatingWidth = Math.max(
      matchAnchorWidth ? anchorRect.width : 0,
      floating?.offsetWidth ?? 0,
      minWidth,
    )
    const floatingHeight = floating?.offsetHeight ?? 0
    setCoords(
      computeViewportAnchoredPosition({
        anchorRect,
        floatingWidth,
        floatingHeight,
        pad,
        minWidth,
        matchAnchorWidth,
      }),
    )
  }, [anchorRef, floatingRef, matchAnchorWidth, minWidth, pad])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onReposition = () => updatePosition()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, updatePosition, ...deps])

  return coords
}
