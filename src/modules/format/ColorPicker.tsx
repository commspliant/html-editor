import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useT } from '../../i18n/LocaleProvider'
import { normalizeCssColor } from '../../core/inlineColor'
import { COLOR_PALETTE_COLUMNS, COLOR_PALETTE_SWATCHES } from './colorPalette'
import {
  getRecentColors,
  hasEyeDropper,
  hexToRgb,
  hsvToRgb,
  pickFromScreen,
  rememberRecentColor,
  rgbToHex,
  rgbToHsv,
  subscribeRecentColors,
  type Hsv,
  type Rgb,
} from './colorModel'
import styles from './ColorPicker.module.css'

export type ColorPickerProps = {
  value: string | null
  mixed?: boolean
  noneLabel: string
  ariaLabel?: string
  disabled?: boolean
  menu?: boolean
  fallbackCustom?: string
  onChange: (color: string | null) => void
  onCommit?: (color: string | null) => void
}

function parseChannel(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(255, n))
}

export function ColorPicker({
  value,
  mixed = false,
  noneLabel,
  ariaLabel,
  disabled,
  menu = false,
  fallbackCustom = '#000000',
  onChange,
  onCommit,
}: ColorPickerProps) {
  const t = useT()
  const fieldId = useId()
  const itemRole = menu ? 'menuitemradio' : 'option'
  const selected = mixed ? null : value
  const seed = hexToRgb(selected ?? fallbackCustom) ?? { r: 0, g: 0, b: 0 }
  const [customOpen, setCustomOpen] = useState(false)
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(seed))
  const [rgbText, setRgbText] = useState(() => ({
    r: String(seed.r),
    g: String(seed.g),
    b: String(seed.b),
  }))
  const [hexText, setHexText] = useState(() => rgbToHex(seed.r, seed.g, seed.b))
  const [recents, setRecents] = useState(() => [...getRecentColors()])
  const svRef = useRef<HTMLDivElement>(null)
  const lastHexRef = useRef(rgbToHex(seed.r, seed.g, seed.b))

  useEffect(() => subscribeRecentColors(() => setRecents([...getRecentColors()])), [])

  useEffect(() => {
    const next = hexToRgb(selected ?? fallbackCustom)
    if (!next) return
    const nextHsv = rgbToHsv(next)
    setHsv(nextHsv)
    setRgbText({ r: String(next.r), g: String(next.g), b: String(next.b) })
    setHexText(rgbToHex(next.r, next.g, next.b))
  }, [selected, fallbackCustom])

  const emit = (hex: string | null, commit: boolean, remember: boolean) => {
    if (hex) lastHexRef.current = hex
    if (remember && hex) rememberRecentColor(hex)
    onChange(hex)
    if (commit) onCommit?.(hex)
  }

  const applyRgb = (next: Rgb, commit: boolean, remember: boolean) => {
    const hex = rgbToHex(next.r, next.g, next.b)
    setHsv(rgbToHsv(next))
    setRgbText({ r: String(next.r), g: String(next.g), b: String(next.b) })
    setHexText(hex)
    emit(hex, commit, remember)
  }

  const applyHsv = (next: Hsv, commit: boolean, remember: boolean) => {
    const rgb = hsvToRgb(next)
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    setHsv(next)
    setRgbText({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) })
    setHexText(hex)
    emit(hex, commit, remember)
  }

  const onGridKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (!keys.includes(event.key)) return
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const index = buttons.findIndex((button) => button === document.activeElement)
    if (index < 0) return
    event.preventDefault()
    const delta =
      event.key === 'ArrowLeft'
        ? -1
        : event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp'
            ? -COLOR_PALETTE_COLUMNS
            : COLOR_PALETTE_COLUMNS
    const next = buttons[Math.max(0, Math.min(buttons.length - 1, index + delta))]
    next?.focus()
  }

  const moveSv = (event: ReactPointerEvent<HTMLDivElement>, commit: boolean) => {
    const node = svRef.current
    if (!node || disabled) return
    const rect = node.getBoundingClientRect()
    const s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const v = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height))
    applyHsv({ h: hsv.h, s, v }, commit, commit)
  }

  const onSvPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    moveSv(event, false)
  }

  const hueRgb = hsvToRgb({ h: hsv.h, s: 1, v: 1 })
  const hueColor = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b)
  const rgbNow = hsvToRgb(hsv)
  const currentHex = rgbToHex(rgbNow.r, rgbNow.g, rgbNow.b)
  const palette = new Set(COLOR_PALETTE_SWATCHES)
  const recentShown = recents.filter((hex) => !palette.has(hex))

  return (
    <div
      className={styles.picker}
      role={menu ? undefined : 'listbox'}
      aria-label={ariaLabel}
      data-color-picker=""
    >
      <button
        type="button"
        className={styles.none}
        role={itemRole}
        aria-checked={menu ? selected === null && !mixed : undefined}
        aria-selected={!menu ? selected === null && !mixed : undefined}
        disabled={disabled}
        onClick={() => emit(null, true, false)}
      >
        {noneLabel}
      </button>
      <div className={styles.grid} role={menu ? 'group' : 'none'} onKeyDown={onGridKeyDown}>
        {COLOR_PALETTE_SWATCHES.map((hex) => {
          const isSelected = selected === hex
          return (
            <button
              key={hex}
              type="button"
              className={styles.swatch}
              role={itemRole}
              aria-label={hex}
              aria-checked={menu ? isSelected : undefined}
              aria-selected={!menu ? isSelected : undefined}
              disabled={disabled}
              style={{ backgroundColor: hex }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => emit(hex, true, false)}
            />
          )
        })}
      </div>
      {recentShown.length > 0 ? (
        <>
          <p className={styles.sectionLabel}>{t('colorRecent')}</p>
          <div className={styles.recents} role={menu ? 'group' : 'none'} aria-label={t('colorRecent')}>
            {recentShown.map((hex) => (
              <button
                key={hex}
                type="button"
                className={styles.swatch}
                role={itemRole}
                aria-label={hex}
                aria-checked={menu ? selected === hex : undefined}
                aria-selected={!menu ? selected === hex : undefined}
                disabled={disabled}
                style={{ backgroundColor: hex }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => emit(hex, true, false)}
              />
            ))}
          </div>
        </>
      ) : null}
      <button
        type="button"
        className={styles.customToggle}
        disabled={disabled}
        aria-expanded={customOpen}
        onClick={() => setCustomOpen((open) => !open)}
      >
        {t('colorCustom')}
      </button>
      {customOpen ? (
        <div className={styles.custom}>
          <div
            ref={svRef}
            className={styles.sv}
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
            }}
            onPointerDown={onSvPointerDown}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
              moveSv(event, false)
            }}
            onPointerUp={(event) => {
              moveSv(event, true)
            }}
          >
            <span className={styles.svThumb} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
          </div>
          <input
            className={styles.hue}
            type="range"
            min={0}
            max={360}
            value={Math.round(hsv.h)}
            disabled={disabled}
            aria-label={t('colorCustom')}
            onChange={(event) => applyHsv({ ...hsv, h: Number(event.target.value) }, false, false)}
            onPointerUp={() => emit(lastHexRef.current, true, true)}
          />
          <div className={styles.rgbRow}>
            {(['r', 'g', 'b'] as const).map((channel) => (
              <div key={channel} className={styles.field}>
                <label htmlFor={`${fieldId}-${channel}`}>
                  {channel === 'r' ? t('colorRgbR') : channel === 'g' ? t('colorRgbG') : t('colorRgbB')}
                </label>
                <input
                  id={`${fieldId}-${channel}`}
                  inputMode="numeric"
                  value={rgbText[channel]}
                  disabled={disabled}
                  onChange={(event) => {
                    setRgbText((current) => ({ ...current, [channel]: event.target.value }))
                  }}
                  onBlur={() => {
                    const parsed = parseChannel(rgbText[channel])
                    if (parsed === null) {
                      setRgbText({ r: String(rgbNow.r), g: String(rgbNow.g), b: String(rgbNow.b) })
                      return
                    }
                    applyRgb({ ...rgbNow, [channel]: parsed }, true, true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.currentTarget.blur()
                  }}
                />
              </div>
            ))}
          </div>
          <div className={styles.hexRow}>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-hex`}>{t('colorHex')}</label>
              <input
                id={`${fieldId}-hex`}
                value={hexText}
                disabled={disabled}
                onChange={(event) => setHexText(event.target.value)}
                onBlur={() => {
                  const parsed = normalizeCssColor(hexText)
                  if (!parsed) {
                    setHexText(currentHex)
                    return
                  }
                  const rgb = hexToRgb(parsed)
                  if (!rgb) return
                  applyRgb(rgb, true, true)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.currentTarget.blur()
                }}
              />
            </div>
          </div>
          {hasEyeDropper() ? (
            <button
              type="button"
              className={styles.eyedrop}
              disabled={disabled}
              onClick={() => {
                void pickFromScreen().then((hex) => {
                  if (!hex) return
                  const rgb = hexToRgb(hex)
                  if (!rgb) return
                  applyRgb(rgb, true, true)
                })
              }}
            >
              {t('colorPickFromScreen')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
