import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { getOverflowState, overflowScrollAmount, type OverflowState } from './overflow'

const NO_OVERFLOW: OverflowState = { canScrollLeft: false, canScrollRight: false }

export function useIconNavOverflow(observeKey: unknown) {
  const trackRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState<OverflowState>(NO_OVERFLOW)

  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setOverflow(getOverflowState(el))
  }, [])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    measure()
    track.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(track)
    if (innerRef.current) observer?.observe(innerRef.current)

    return () => {
      track.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [measure, observeKey])

  const scrollByStep = useCallback((direction: -1 | 1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: direction * overflowScrollAmount(el), behavior: 'smooth' })
  }, [])

  const scrollLeft = useCallback(() => {
    scrollByStep(-1)
  }, [scrollByStep])

  const scrollRight = useCallback(() => {
    scrollByStep(1)
  }, [scrollByStep])

  return {
    trackRef,
    innerRef,
    canScrollLeft: overflow.canScrollLeft,
    canScrollRight: overflow.canScrollRight,
    scrollLeft,
    scrollRight,
  }
}
