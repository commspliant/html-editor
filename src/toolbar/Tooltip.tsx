import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toolbar.module.css'

export const TOOLTIP_HOVER_DELAY_MS = 400

const GAP_PX = 6
const VIEWPORT_PAD_PX = 4

type TooltipProps = {
  label: string
  children: ReactNode
  className?: string
  elevated?: boolean
}

export function Tooltip({ label, children, className, elevated }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const tipRef = useRef<HTMLSpanElement | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveringRef = useRef(false)
  const focusedRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current === null) return
    clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = null
  }, [])

  const updateOpen = useCallback(
    (immediate: boolean) => {
      const shouldShow = hoveringRef.current || focusedRef.current
      if (!shouldShow) {
        clearHoverTimer()
        setOpen(false)
        return
      }
      if (immediate || focusedRef.current) {
        clearHoverTimer()
        setOpen(true)
        return
      }
      clearHoverTimer()
      hoverTimerRef.current = setTimeout(() => {
        hoverTimerRef.current = null
        setOpen(true)
      }, TOOLTIP_HOVER_DELAY_MS)
    },
    [clearHoverTimer],
  )

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const tip = tipRef.current
    if (!trigger || !tip) return

    const rect = trigger.getBoundingClientRect()
    const tipWidth = tip.offsetWidth
    const tipHeight = tip.offsetHeight
    let top = rect.bottom + GAP_PX
    if (top + tipHeight > window.innerHeight - VIEWPORT_PAD_PX) {
      top = rect.top - GAP_PX - tipHeight
    }
    let left = rect.left + rect.width / 2 - tipWidth / 2
    left = Math.min(
      Math.max(left, VIEWPORT_PAD_PX),
      window.innerWidth - tipWidth - VIEWPORT_PAD_PX,
    )
    setCoords({ top, left })
  }, [])

  useEffect(() => () => clearHoverTimer(), [clearHoverTimer])

  useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const onFocusIn = () => {
      focusedRef.current = true
      updateOpen(true)
    }
    const onFocusOut = () => {
      focusedRef.current = false
      updateOpen(false)
    }
    trigger.addEventListener('focusin', onFocusIn)
    trigger.addEventListener('focusout', onFocusOut)
    return () => {
      trigger.removeEventListener('focusin', onFocusIn)
      trigger.removeEventListener('focusout', onFocusOut)
    }
  }, [updateOpen])

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
  }, [open, label, updatePosition])

  const triggerClassName = className
    ? `${styles.tooltipTrigger} ${className}`
    : styles.tooltipTrigger

  return (
    <>
      <span
        ref={triggerRef}
        className={triggerClassName}
        data-tooltip-trigger=""
        onMouseEnter={() => {
          hoveringRef.current = true
          updateOpen(false)
        }}
        onMouseLeave={() => {
          hoveringRef.current = false
          updateOpen(false)
        }}
      >
        {children}
      </span>
      {open
        ? createPortal(
            <span
              ref={tipRef}
              className={elevated ? `${styles.tooltip} ${styles.tooltipElevated}` : styles.tooltip}
              data-toolbar-tooltip=""
              style={{ top: coords.top, left: coords.left }}
              aria-hidden="true"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  )
}
