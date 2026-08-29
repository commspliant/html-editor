import { useEffect, useId, useRef, useState, type ComponentType } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useViewportAnchoredPosition } from '../../hooks/useViewportAnchoredPosition'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import type { IconProps } from '../../icons'
import { Tooltip } from '../../toolbar/Tooltip'
import toolbarStyles from '../../toolbar/Toolbar.module.css'
import { ColorPicker } from './ColorPicker'
import styles from './ColorSelect.module.css'

export type ColorSelectProps = {
  icon: ComponentType<IconProps>
  value: string | null
  mixed: boolean
  noneKey: MessageKey
  labelKey: MessageKey
  ariaKey: MessageKey
  fallbackCustom?: string
  disabled?: boolean
  onChange: (color: string | null) => void
}

export function ColorSelect({
  icon: Icon,
  value,
  mixed,
  noneKey,
  labelKey,
  ariaKey,
  fallbackCustom,
  disabled,
  onChange,
}: ColorSelectProps) {
  const t = useT()
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

  const apply = (color: string | null) => {
    onChange(color)
  }

  const barClass = `${styles.bar}${!value || mixed ? ` ${styles.barEmpty}` : ''}`
  const barStyle = value && !mixed ? { backgroundColor: value } : undefined

  const control = (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`${toolbarStyles.iconButton} ${styles.button}`}
        aria-label={t(ariaKey)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((next) => !next)}
      >
        <Icon className={`${toolbarStyles.icon} ${styles.icon}`} />
        <span className={barClass} style={barStyle} />
      </button>
      {open
        ? (
      <ChromePortal>

            <div
              ref={popoverRef}
              id={listId}
              className={styles.popover}
              style={{ top: coords.top, left: coords.left }}
            >
              <ColorPicker
                value={value}
                mixed={mixed}
                noneLabel={t(noneKey)}
                ariaLabel={t(ariaKey)}
                disabled={disabled}
                fallbackCustom={fallbackCustom}
                onChange={apply}
                onCommit={() => setOpen(false)}
              />
            </div>
      </ChromePortal>
    )
        : null}
    </div>
  )

  return <Tooltip label={t(labelKey)}>{control}</Tooltip>
}
