import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useViewportAnchoredPosition } from '../../hooks/useViewportAnchoredPosition'
import { ColorPicker } from './ColorPicker'
import styles from './ColorSelect.module.css'
import fieldStyles from './ColorField.module.css'

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

  const coords = useViewportAnchoredPosition(open, buttonRef, popoverRef)

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
