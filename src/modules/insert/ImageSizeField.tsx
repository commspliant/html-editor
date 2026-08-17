import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import {
  DEFAULT_IMAGE_SIZE_UNIT,
  IMAGE_SIZE_PRESETS,
  IMAGE_SIZE_UNITS,
  parseImageSizeInput,
  type ImageSizeLength,
  type ImageSizeUnit,
} from '../../core/imageSize'
import { formatFontSizeNumber } from '../../core/fontSizeUnits'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import styles from '../format/FontSizeSelect.module.css'
import dialogStyles from '../format/FontPropertiesDialog.module.css'

const VIEWPORT_PAD_PX = 4

const UNIT_KEYS: Record<ImageSizeUnit, MessageKey> = {
  pt: 'fontSizeUnitPt',
  px: 'fontSizeUnitPx',
  em: 'fontSizeUnitEm',
  rem: 'fontSizeUnitRem',
  '%': 'fontSizeUnitPercent',
  pc: 'fontSizeUnitPc',
}

export type ImageSizeFieldProps = {
  label: string
  inputAria: string
  value: ImageSizeLength | null
  disabled?: boolean
  onChange: (next: ImageSizeLength | null) => void
}

export function ImageSizeField({
  label,
  inputAria,
  value,
  disabled,
  onChange,
}: ImageSizeFieldProps) {
  const t = useT()
  const listId = useId()
  const inputId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const unit = value?.unit ?? DEFAULT_IMAGE_SIZE_UNIT
  const [draft, setDraft] = useState(() => (value ? formatFontSizeNumber(value.value) : ''))
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!focused) {
      setDraft(value ? formatFontSizeNumber(value.value) : '')
    }
  }, [value, focused])

  const updatePosition = useCallback(() => {
    const field = fieldRef.current
    const list = listRef.current
    if (!field) return
    const rect = field.getBoundingClientRect()
    const listHeight = list?.offsetHeight ?? 0
    let top = rect.bottom
    if (top + listHeight > window.innerHeight - VIEWPORT_PAD_PX) {
      top = Math.max(VIEWPORT_PAD_PX, rect.top - listHeight)
    }
    const left = Math.min(
      Math.max(rect.left, VIEWPORT_PAD_PX),
      window.innerWidth - Math.max(rect.width, 72) - VIEWPORT_PAD_PX,
    )
    setCoords({ top, left, width: rect.width })
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
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange(null)
      setDraft('')
      return
    }
    const parsed = parseImageSizeInput(trimmed, unit)
    if (!parsed) {
      setDraft(value ? formatFontSizeNumber(value.value) : '')
      return
    }
    onChange(parsed)
    setDraft(formatFontSizeNumber(parsed.value))
  }

  const presets = IMAGE_SIZE_PRESETS[unit]
  const size = value?.value ?? null

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
                  onChange({ value: preset, unit })
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

  return (
    <div className={dialogStyles.lengthField}>
      <label className={dialogStyles.sideLabel} htmlFor={inputId}>
        {label}
      </label>
      <div className={`${styles.wrap} ${dialogStyles.lengthRow}`} ref={wrapRef}>
        <div className={styles.field} ref={fieldRef}>
          <input
            id={inputId}
            className={styles.input}
            value={draft}
            disabled={disabled}
            aria-label={inputAria}
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
            aria-label={inputAria}
            aria-expanded={open}
            aria-controls={listId}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setOpen((next) => !next)}
          />
        </div>
        <div className={styles.field}>
          <select
            className={styles.unit}
            value={unit}
            disabled={disabled}
            aria-label={t('imagePropertiesSizeUnitAria')}
            onChange={(event) => {
              const nextUnit = event.target.value as ImageSizeUnit
              if (value) {
                onChange({ value: value.value, unit: nextUnit })
                return
              }
              if (draft.trim()) {
                onChange(parseImageSizeInput(draft, nextUnit))
              }
            }}
          >
            {IMAGE_SIZE_UNITS.map((item) => (
              <option key={item} value={item}>
                {t(UNIT_KEYS[item])}
              </option>
            ))}
          </select>
          <span className={styles.chevron} aria-hidden="true" />
        </div>
        {list}
      </div>
    </div>
  )
}
