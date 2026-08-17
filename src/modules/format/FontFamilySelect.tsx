import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import type { FontFace } from '../../core/fontFamily'
import { useT } from '../../i18n/LocaleProvider'
import type { ToolbarWidgetProps } from '../../toolbar/types'
import { Tooltip } from '../../toolbar/Tooltip'
import { FontFamilyList, fontFamilyTriggerLabel } from './FontFamilyList'
import styles from './FontFamilySelect.module.css'

const VIEWPORT_PAD_PX = 4

export type FontFamilyComboboxProps = {
  family: string | null
  mixed?: boolean
  fonts: readonly FontFace[]
  disabled?: boolean
  tooltip?: string
  toolbar?: boolean
  triggerId?: string
  onChange: (family: string | null) => void
}

export function FontFamilyCombobox({
  family,
  mixed = false,
  fonts,
  disabled,
  tooltip,
  toolbar = false,
  triggerId,
  onChange,
}: FontFamilyComboboxProps) {
  const t = useT()
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const label = fontFamilyTriggerLabel(family, mixed, fonts, t('fontFamilyDefault'))

  const updatePosition = useCallback(() => {
    const field = fieldRef.current
    const list = listRef.current
    if (!field) return
    const rect = field.getBoundingClientRect()
    const listHeight = list?.offsetHeight ?? 0
    const listWidth = Math.max(rect.width, list?.offsetWidth ?? 0)
    let top = rect.bottom
    if (top + listHeight > window.innerHeight - VIEWPORT_PAD_PX) {
      top = Math.max(VIEWPORT_PAD_PX, rect.top - listHeight)
    }
    const left = Math.min(
      Math.max(rect.left, VIEWPORT_PAD_PX),
      window.innerWidth - listWidth - VIEWPORT_PAD_PX,
    )
    setCoords({ top, left, width: listWidth })
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
  }, [open, updatePosition, fonts.length])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (wrapRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  const control = (
    <div className={`${styles.wrap}${toolbar ? ` ${styles.wrapToolbar}` : ''}`} ref={wrapRef}>
      <div className={styles.field} ref={fieldRef}>
        <button
          type="button"
          id={triggerId}
          className={styles.trigger}
          disabled={disabled}
          aria-label={toolbar ? t('commandFontFamilyAria') : undefined}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          style={family && !mixed ? { fontFamily: family } : undefined}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((next) => !next)}
        >
          {label}
        </button>
        <span className={styles.chevron} aria-hidden="true" />
      </div>
      {open
        ? (
      <ChromePortal>

            <FontFamilyList
              listRef={listRef}
              listId={listId}
              value={mixed ? null : family}
              mixed={mixed}
              fonts={fonts}
              disabled={disabled}
              style={{ top: coords.top, left: coords.left, minWidth: coords.width }}
              onSelect={(next) => {
                onChange(next)
                setOpen(false)
              }}
            />
      </ChromePortal>
    )
        : null}
    </div>
  )

  if (!tooltip) return control
  return <Tooltip label={tooltip}>{control}</Tooltip>
}

export function FontFamilySelect({ commands, queries, disabled }: ToolbarWidgetProps) {
  const t = useT()
  const isDisabled = Boolean(disabled || !queries.isVisualMode())
  return (
    <FontFamilyCombobox
      family={queries.isFontFamilyMixed() ? null : queries.getFontFamily()}
      mixed={queries.isFontFamilyMixed()}
      fonts={queries.getFontFaces()}
      disabled={isDisabled}
      tooltip={t('commandFontFamily')}
      toolbar
      onChange={(family) => {
        commands.setFontFamily(family)
      }}
    />
  )
}
