import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { ColorPicker } from './ColorPicker'
import styles from './ColorSelect.module.css'
import fieldStyles from './ColorField.module.css'

const VIEWPORT_PAD_PX = 4

export type ColorFieldProps = {
  label: string
  noneLabel: string
  value: string | null
  mixed?: boolean
  disabled?: boolean
  fallbackCustom?: string
  onChange: (color: string | null) => void
}

export function ColorField({
  label,
  noneLabel,
  value,
  mixed = false,
  disabled,
  fallbackCustom,
  onChange,
}: ColorFieldProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    const popover = popoverRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const height = popover?.offsetHeight ?? 0
    const width = popover?.offsetWidth ?? 240
    let top = rect.bottom
    if (top + height > window.innerHeight - VIEWPORT_PAD_PX) {
      top = Math.max(VIEWPORT_PAD_PX, rect.top - height)
    }
    const left = Math.min(
      Math.max(rect.left, VIEWPORT_PAD_PX),
      window.innerWidth - width - VIEWPORT_PAD_PX,
    )
    setCoords({ top, left })
  }, [])

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
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (wrapRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  const swatchClass = `${fieldStyles.swatch}${!value || mixed ? ` ${fieldStyles.swatchEmpty}` : ''}`
  const swatchStyle = value && !mixed ? { backgroundColor: value } : undefined

  return (
    <div className={fieldStyles.field} ref={wrapRef}>
      <span className={fieldStyles.label}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        className={fieldStyles.button}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => setOpen((next) => !next)}
      >
        <span className={swatchClass} style={swatchStyle} />
      </button>
      {open
        ? (
      <ChromePortal>

            <div
              ref={popoverRef}
              id={listId}
              className={styles.popover}
              style={{ top: coords.top, left: coords.left, zIndex: 1400 }}
            >
              <ColorPicker
                value={value}
                mixed={mixed}
                noneLabel={noneLabel}
                ariaLabel={label}
                disabled={disabled}
                fallbackCustom={fallbackCustom}
                onChange={onChange}
                onCommit={() => setOpen(false)}
              />
            </div>
      </ChromePortal>
    )
        : null}
    </div>
  )
}
