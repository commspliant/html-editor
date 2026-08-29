import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useViewportAnchoredPosition } from '../../hooks/useViewportAnchoredPosition'
import type { FontSizeUnit } from '../../core/fontSizeUnits'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { Tooltip } from '../../toolbar/Tooltip'
import {
  FONT_SIZE_PRESETS,
  FONT_SIZE_UNITS,
  formatFontSizeNumber,
  parseFontSizeInput,
} from './fontSize'
import styles from './FontSizeSelect.module.css'

const UNIT_KEYS: Record<FontSizeUnit, MessageKey> = {
  pt: 'fontSizeUnitPt',
  px: 'fontSizeUnitPx',
  em: 'fontSizeUnitEm',
  rem: 'fontSizeUnitRem',
  '%': 'fontSizeUnitPercent',
}

export type FontSizeComboboxProps = {
  size: number | null
  unit: FontSizeUnit
  onSizeChange: (size: number, unit: FontSizeUnit) => void
  onUnitChange: (unit: FontSizeUnit) => void
  disabled?: boolean
  tooltip?: string
  sizeInputId?: string
  toolbar?: boolean
}

export function FontSizeCombobox({
  size,
  unit,
  onSizeChange,
  onUnitChange,
  disabled,
  tooltip,
  sizeInputId,
  toolbar = false,
}: FontSizeComboboxProps) {
  const t = useT()
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [draft, setDraft] = useState(() => (size === null ? '' : formatFontSizeNumber(size)))
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)

  const coords = useViewportAnchoredPosition(open, fieldRef, listRef, {
    matchAnchorWidth: true,
    minWidth: 72,
  })

  useEffect(() => {
    if (!focused) {
      setDraft(size === null ? '' : formatFontSizeNumber(size))
    }
  }, [size, focused])

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

  const commit = (raw: string) => {
    const parsed = parseFontSizeInput(raw, unit)
    if (!parsed) {
      setDraft(size === null ? '' : formatFontSizeNumber(size))
      return
    }
    onSizeChange(parsed.value, parsed.unit)
    setDraft(formatFontSizeNumber(parsed.value))
  }

  const presets = FONT_SIZE_PRESETS[unit]

  const list = open
    ? (
      <ChromePortal>

        <ul
          ref={listRef}
          className={styles.list}
          role="listbox"
          id={listId}
          style={{ top: coords.top, left: coords.left, minWidth: coords.width }}
        >
          {presets.map((preset) => (
            <li key={preset} role="presentation">
              <button
                type="button"
                className={styles.option}
                role="option"
                aria-selected={size === preset}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSizeChange(preset, unit)
                  setDraft(formatFontSizeNumber(preset))
                  setOpen(false)
                }}
              >
                {formatFontSizeNumber(preset)}
              </button>
            </li>
          ))}
        </ul>
      </ChromePortal>
    )
    : null

  const control = (
    <div className={`${styles.wrap}${toolbar ? ` ${styles.wrapToolbar}` : ''}`} ref={wrapRef}>
      <div className={styles.field} ref={fieldRef}>
        <input
          id={sizeInputId}
          className={styles.input}
          value={draft}
          disabled={disabled}
          aria-label={t('commandFontSizeAria')}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          role="combobox"
          inputMode="decimal"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            commit(draft)
          }}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit(draft)
              setOpen(false)
              event.currentTarget.blur()
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
            }
          }}
        />
        <button
          type="button"
          className={styles.toggle}
          tabIndex={-1}
          disabled={disabled}
          aria-label={t('commandFontSizeAria')}
          aria-expanded={open}
          aria-controls={listId}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((value) => !value)}
        />
      </div>
      <div className={styles.field}>
        <select
          className={styles.unit}
          value={unit}
          disabled={disabled}
          aria-label={t('commandFontSizeUnitAria')}
          onChange={(event) => {
            onUnitChange(event.target.value as FontSizeUnit)
          }}
        >
          {FONT_SIZE_UNITS.map((item) => (
            <option key={item} value={item}>
              {t(UNIT_KEYS[item])}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true" />
      </div>
      {list}
    </div>
  )

  if (!tooltip) return control
  return <Tooltip label={tooltip}>{control}</Tooltip>
}
