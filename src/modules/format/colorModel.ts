import { normalizeCssColor } from '../../core/inlineColor'

export type Rgb = { r: number; g: number; b: number }
export type Hsv = { h: number; s: number; v: number }

export const RECENT_COLOR_CAP = 8

let recents: string[] = []
const listeners = new Set<() => void>()

export function getRecentColors(): readonly string[] {
  return recents
}

export function rememberRecentColor(raw: string): void {
  const hex = normalizeCssColor(raw)
  if (!hex) return
  recents = [hex, ...recents.filter((item) => item !== hex)].slice(0, RECENT_COLOR_CAP)
  listeners.forEach((listener) => listener())
}

export function subscribeRecentColors(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function resetRecentColors(): void {
  recents = []
  listeners.forEach((listener) => listener())
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeCssColor(hex)
  if (!normalized) return null
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const byte = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const hue = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c
  let rp = 0
  let gp = 0
  let bp = 0
  if (hue < 60) {
    rp = c
    gp = x
  } else if (hue < 120) {
    rp = x
    gp = c
  } else if (hue < 180) {
    gp = c
    bp = x
  } else if (hue < 240) {
    gp = x
    bp = c
  } else if (hue < 300) {
    rp = x
    bp = c
  } else {
    rp = c
    bp = x
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  }
}

export function hasEyeDropper(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window
}

type EyeDropperResult = { sRGBHex: string }

export async function pickFromScreen(): Promise<string | null> {
  if (!hasEyeDropper()) return null
  const Dropper = (window as unknown as { EyeDropper: new () => { open: () => Promise<EyeDropperResult> } })
    .EyeDropper
  try {
    const result = await new Dropper().open()
    return normalizeCssColor(result.sRGBHex)
  } catch {
    return null
  }
}
