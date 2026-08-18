import { validateImageSrc } from './image'
import {
  IMAGE_OBJECT_FITS,
  IMAGE_OBJECT_POSITIONS,
  type ImageObjectFit,
} from './imageProperties'
import { clearEmptyStyle } from './blocks'
import {
  clampOpacity,
  formatOpacity,
} from './paragraphBox'
import {
  PAGE_BG_LAYER_ATTR,
  queryPageBackgroundLayer,
} from './page'

export type PageBackgroundImageApply = {
  src: string | null
  opacity: number | null
  fit: ImageObjectFit | null
  position: string | null
}

const OBJECT_FIT_SET = new Set<string>(IMAGE_OBJECT_FITS)
const OBJECT_POSITION_SET = new Set<string>(IMAGE_OBJECT_POSITIONS)

const BG_SIZE_TO_FIT: Record<string, ImageObjectFit> = {
  '100% 100%': 'fill',
  contain: 'contain',
  cover: 'cover',
  auto: 'none',
}

const FIT_TO_BG_SIZE: Record<ImageObjectFit, string> = {
  fill: '100% 100%',
  contain: 'contain',
  cover: 'cover',
  none: 'auto',
  'scale-down': 'contain',
}

export function emptyPageBackgroundImageApply(): PageBackgroundImageApply {
  return {
    src: null,
    opacity: null,
    fit: null,
    position: null,
  }
}

function readOpacity(el: HTMLElement): number | null {
  const raw = el.style.opacity.trim()
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  return clampOpacity(value)
}

function writeOpacity(el: HTMLElement, value: number | null): boolean {
  const current = readOpacity(el)
  const next = value === null ? null : clampOpacity(value)
  if (current === next) return false
  if (next === null) el.style.removeProperty('opacity')
  else el.style.opacity = formatOpacity(next)
  return true
}

function readBackgroundImageUrl(el: HTMLElement): string | null {
  const raw = el.style.backgroundImage.trim()
  if (!raw || raw === 'none') return null
  const match = /^url\(\s*["']?(.+?)["']?\s*\)$/i.exec(raw)
  if (!match) return null
  const src = match[1].trim()
  return src || null
}

function formatBackgroundImageUrl(src: string): string {
  const escaped = src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `url("${escaped}")`
}

function writeBackgroundImage(el: HTMLElement, src: string | null): boolean {
  const current = readBackgroundImageUrl(el)
  const trimmed = src?.trim() ?? ''
  const next = trimmed && validateImageSrc(trimmed) === null ? trimmed : null
  if (current === next) return false
  if (next) el.style.backgroundImage = formatBackgroundImageUrl(next)
  else el.style.removeProperty('background-image')
  return true
}

function readBackgroundFit(el: HTMLElement): ImageObjectFit | null {
  const raw = el.style.backgroundSize.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!raw) return null
  if (BG_SIZE_TO_FIT[raw]) return BG_SIZE_TO_FIT[raw]
  if (OBJECT_FIT_SET.has(raw)) return raw as ImageObjectFit
  return null
}

function writeBackgroundFit(el: HTMLElement, fit: ImageObjectFit | null): boolean {
  const current = readBackgroundFit(el)
  if (current === fit) return false
  if (fit) el.style.backgroundSize = FIT_TO_BG_SIZE[fit]
  else el.style.removeProperty('background-size')
  return true
}

function readBackgroundPosition(el: HTMLElement): string | null {
  const value = el.style.backgroundPosition.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!value) return null
  if (OBJECT_POSITION_SET.has(value)) return value
  return value
}

function writeBackgroundPosition(el: HTMLElement, position: string | null): boolean {
  const next = position?.trim().toLowerCase().replace(/\s+/g, ' ') || ''
  const current = el.style.backgroundPosition.trim().toLowerCase().replace(/\s+/g, ' ')
  if (current === next) return false
  if (next) el.style.backgroundPosition = next
  else el.style.removeProperty('background-position')
  return true
}

function ensureBackgroundLayerStyles(layer: HTMLElement): void {
  layer.style.position = 'absolute'
  layer.style.inset = '0'
  layer.style.zIndex = '0'
  layer.style.pointerEvents = 'none'
  layer.style.backgroundRepeat = 'no-repeat'
}

function ensureBackgroundLayer(shell: HTMLElement): HTMLElement {
  const existing = queryPageBackgroundLayer(shell)
  if (existing) return existing

  const layer = document.createElement('div')
  layer.setAttribute(PAGE_BG_LAYER_ATTR, '')
  layer.setAttribute('contenteditable', 'false')
  ensureBackgroundLayerStyles(layer)
  shell.insertBefore(layer, shell.firstChild)
  return layer
}

function removeBackgroundLayer(shell: HTMLElement): boolean {
  const layer = queryPageBackgroundLayer(shell)
  if (!layer) return false
  layer.remove()
  return true
}

function syncShellPosition(shell: HTMLElement): void {
  if (queryPageBackgroundLayer(shell)) {
    if (shell.style.position !== 'relative') shell.style.position = 'relative'
  } else if (shell.style.position === 'relative') {
    shell.style.removeProperty('position')
  }
}

export function readPageBackgroundImage(shell: HTMLElement): PageBackgroundImageApply {
  const layer = queryPageBackgroundLayer(shell)
  if (!layer) return emptyPageBackgroundImageApply()
  return {
    src: readBackgroundImageUrl(layer),
    opacity: readOpacity(layer),
    fit: readBackgroundFit(layer),
    position: readBackgroundPosition(layer),
  }
}

export function writePageBackgroundImage(
  shell: HTMLElement,
  draft: PageBackgroundImageApply,
): boolean {
  const src = draft.src?.trim() ?? ''
  const hasSrc = src.length > 0 && validateImageSrc(src) === null

  if (!hasSrc) {
    const removed = removeBackgroundLayer(shell)
    syncShellPosition(shell)
    if (removed) clearEmptyStyle(shell)
    return removed
  }

  const layer = ensureBackgroundLayer(shell)
  ensureBackgroundLayerStyles(layer)
  syncShellPosition(shell)

  let changed = false
  if (writeBackgroundImage(layer, src)) changed = true
  if (writeBackgroundFit(layer, draft.fit)) changed = true
  if (writeBackgroundPosition(layer, draft.position)) changed = true
  if (writeOpacity(layer, draft.opacity)) changed = true

  if (changed) {
    clearEmptyStyle(layer)
    clearEmptyStyle(shell)
  }

  return changed
}
