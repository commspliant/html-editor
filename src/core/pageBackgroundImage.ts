import { validateImageSrc } from './image'
import {
  IMAGE_OBJECT_FITS,
  IMAGE_OBJECT_POSITIONS,
  type ImageObjectFit,
} from './imageProperties'
import {
  formatImageSize,
  parseImageSize,
  type ImageSizeLength,
} from './imageSize'
import { clearEmptyStyle } from './blocks'
import {
  clampOpacity,
  formatOpacity,
} from './paragraphBox'
import {
  PAGE_BG_LAYER_ATTR,
  PAGE_BG_LAYER_ID,
  queryPageBackgroundLayer,
  queryPageBackgroundLayers,
} from './page'

export type PageBackgroundImageApply = {
  src: string | null
  opacity: number | null
  fit: ImageObjectFit | null
  position: string | null
  width: ImageSizeLength | null
  height: ImageSizeLength | null
}

export const DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH: ImageSizeLength = { value: 100, unit: '%' }

const OBJECT_FIT_SET = new Set<string>(IMAGE_OBJECT_FITS)
const OBJECT_POSITION_SET = new Set<string>(IMAGE_OBJECT_POSITIONS)
const KEYWORD_FITS = new Set<ImageObjectFit>(['cover', 'contain', 'scale-down', 'none'])

const BG_SIZE_TO_FIT: Record<string, ImageObjectFit> = {
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
    width: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
    height: null,
  }
}

export function isKeywordPageBackgroundFit(fit: ImageObjectFit | null): boolean {
  return fit != null && KEYWORD_FITS.has(fit)
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

function normalizeBackgroundSize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseSizeToken(token: string): ImageSizeLength | null {
  if (!token || token === 'auto') return null
  return parseImageSize(token)
}

function formatBackgroundSizeValue(draft: PageBackgroundImageApply): string | null {
  if (isKeywordPageBackgroundFit(draft.fit) && draft.fit) {
    return FIT_TO_BG_SIZE[draft.fit]
  }
  if (draft.fit === 'fill') return FIT_TO_BG_SIZE.fill
  if (draft.width && draft.height) {
    return `${formatImageSize(draft.width)} ${formatImageSize(draft.height)}`
  }
  if (draft.width) return formatImageSize(draft.width)
  if (draft.height) return `auto ${formatImageSize(draft.height)}`
  return null
}

function readBackgroundSize(el: HTMLElement): Pick<
  PageBackgroundImageApply,
  'fit' | 'width' | 'height'
> {
  const raw = normalizeBackgroundSize(el.style.backgroundSize)
  if (!raw) return { fit: null, width: null, height: null }
  if (raw === '100% 100%') {
    return {
      fit: 'fill',
      width: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
      height: { ...DEFAULT_PAGE_BACKGROUND_IMAGE_WIDTH },
    }
  }
  if (BG_SIZE_TO_FIT[raw]) {
    return { fit: BG_SIZE_TO_FIT[raw], width: null, height: null }
  }
  if (OBJECT_FIT_SET.has(raw)) {
    return { fit: raw as ImageObjectFit, width: null, height: null }
  }

  const parts = raw.split(' ')
  if (parts.length === 1) {
    return { fit: null, width: parseSizeToken(parts[0]), height: null }
  }
  if (parts.length === 2) {
    return {
      fit: null,
      width: parseSizeToken(parts[0]),
      height: parseSizeToken(parts[1]),
    }
  }
  return { fit: null, width: null, height: null }
}

function writeBackgroundSize(el: HTMLElement, draft: PageBackgroundImageApply): boolean {
  const current = normalizeBackgroundSize(el.style.backgroundSize)
  const next = formatBackgroundSizeValue(draft)
  if (current === (next ?? '')) return false
  if (next) el.style.backgroundSize = next
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

function stampBackgroundLayer(layer: HTMLElement): boolean {
  let changed = false
  if (layer.id !== PAGE_BG_LAYER_ID) {
    layer.id = PAGE_BG_LAYER_ID
    changed = true
  }
  if (!layer.hasAttribute(PAGE_BG_LAYER_ATTR)) {
    layer.setAttribute(PAGE_BG_LAYER_ATTR, '')
    changed = true
  }
  if (layer.getAttribute('contenteditable') !== 'false') {
    layer.setAttribute('contenteditable', 'false')
    changed = true
  }
  return changed
}

function ensureBackgroundLayerStyles(layer: HTMLElement): boolean {
  const before = layer.getAttribute('style')
  layer.style.position = 'absolute'
  layer.style.inset = '0'
  layer.style.zIndex = '-1'
  layer.style.pointerEvents = 'none'
  layer.style.userSelect = 'none'
  layer.style.backgroundRepeat = 'no-repeat'
  return layer.getAttribute('style') !== before
}

function ensureBackgroundLayer(shell: HTMLElement): { layer: HTMLElement; changed: boolean } {
  const layers = queryPageBackgroundLayers(shell)
  const existing = layers[0] ?? null
  if (existing) {
    let changed = stampBackgroundLayer(existing)
    for (const extra of layers.slice(1)) {
      extra.remove()
      changed = true
    }
    if (existing.parentNode !== shell || existing !== shell.firstChild) {
      shell.insertBefore(existing, shell.firstChild)
      changed = true
    }
    return { layer: existing, changed }
  }

  const layer = document.createElement('div')
  stampBackgroundLayer(layer)
  ensureBackgroundLayerStyles(layer)
  shell.insertBefore(layer, shell.firstChild)
  return { layer, changed: true }
}

function removeBackgroundLayer(shell: HTMLElement): boolean {
  const layers = queryPageBackgroundLayers(shell)
  if (layers.length === 0) return false
  for (const layer of layers) layer.remove()
  return true
}

function syncShellPosition(shell: HTMLElement): boolean {
  let changed = false
  if (queryPageBackgroundLayer(shell)) {
    if (shell.style.position !== 'relative') {
      shell.style.position = 'relative'
      changed = true
    }
    if (shell.style.isolation !== 'isolate') {
      shell.style.isolation = 'isolate'
      changed = true
    }
  } else {
    if (shell.style.position === 'relative') {
      shell.style.removeProperty('position')
      changed = true
    }
    if (shell.style.isolation === 'isolate') {
      shell.style.removeProperty('isolation')
      changed = true
    }
  }
  return changed
}

export function readBackgroundImageStyles(el: HTMLElement): PageBackgroundImageApply {
  const size = readBackgroundSize(el)
  return {
    src: readBackgroundImageUrl(el),
    opacity: readOpacity(el),
    fit: size.fit,
    position: readBackgroundPosition(el),
    width: size.width,
    height: size.height,
  }
}

export function writeBackgroundImageStyles(
  el: HTMLElement,
  draft: PageBackgroundImageApply,
): boolean {
  const src = draft.src?.trim() ?? ''
  const hasSrc = src.length > 0 && validateImageSrc(src) === null

  let changed = false
  if (!hasSrc) {
    if (writeBackgroundImage(el, null)) changed = true
    const currentSize = normalizeBackgroundSize(el.style.backgroundSize)
    if (currentSize) {
      el.style.removeProperty('background-size')
      changed = true
    }
    if (writeBackgroundPosition(el, null)) changed = true
    if (writeOpacity(el, null)) changed = true
    if (el.style.backgroundRepeat) {
      el.style.removeProperty('background-repeat')
      changed = true
    }
    if (changed) clearEmptyStyle(el)
    return changed
  }

  if (writeBackgroundImage(el, src)) changed = true
  if (writeBackgroundSize(el, draft)) changed = true
  if (writeBackgroundPosition(el, draft.position)) changed = true
  if (writeOpacity(el, draft.opacity)) changed = true
  if (el.style.backgroundRepeat !== 'no-repeat') {
    el.style.backgroundRepeat = 'no-repeat'
    changed = true
  }
  if (changed) clearEmptyStyle(el)
  return changed
}

export function readPageBackgroundImage(shell: HTMLElement): PageBackgroundImageApply {
  const layer = queryPageBackgroundLayer(shell)
  if (!layer) return emptyPageBackgroundImageApply()
  return readBackgroundImageStyles(layer)
}

export function writePageBackgroundImage(
  shell: HTMLElement,
  draft: PageBackgroundImageApply,
): boolean {
  const src = draft.src?.trim() ?? ''
  const hasSrc = src.length > 0 && validateImageSrc(src) === null

  if (!hasSrc) {
    const removed = removeBackgroundLayer(shell)
    const shellChanged = syncShellPosition(shell)
    if (removed || shellChanged) clearEmptyStyle(shell)
    return removed || shellChanged
  }

  const ensured = ensureBackgroundLayer(shell)
  const layer = ensured.layer
  let changed = ensured.changed
  if (stampBackgroundLayer(layer)) changed = true
  if (ensureBackgroundLayerStyles(layer)) changed = true
  if (syncShellPosition(shell)) changed = true

  if (writeBackgroundImageStyles(layer, draft)) changed = true

  if (changed) {
    clearEmptyStyle(layer)
    clearEmptyStyle(shell)
  }

  return changed
}
