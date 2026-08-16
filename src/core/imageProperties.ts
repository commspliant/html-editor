import { isInside } from './inlineRange'
import { closestImage } from './image'
import {
  formatImageSize,
  imageSizeLengthsEqual,
  parseImageSize,
  scaleLockedSize,
  type ImageSizeLength,
} from './imageSize'
import { cssLengthsEqual } from './cssLength'
import {
  EMPTY_BORDER,
  EMPTY_BOX_SIDES,
  boxSidesEqual,
  bordersEqual,
  readParagraphBox,
  shadowsEqual,
  writeParagraphBox,
  type BoxSides,
  type CssLength,
  type ParagraphBorder,
  type ParagraphShadow,
} from './paragraphBox'
import { formatFontSizeNumber, roundFontSize } from './fontSizeUnits'

export type ImageSizeMode = 'width' | 'height' | 'lock'

export type ImageAlign = 'left' | 'center' | 'right'

export type ImageObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'

export type ImagePropertiesApply = {
  sizeMode: ImageSizeMode
  width: ImageSizeLength | null
  height: ImageSizeLength | null
  align: ImageAlign | null
  margin: BoxSides
  border: ParagraphBorder
  borderRadius: CssLength | null
  boxShadow: ParagraphShadow | null
  opacity: number | null
  objectFit: ImageObjectFit | null
  objectPosition: string | null
  rotateDeg: number | null
  hoverCss: string
}

export const IMAGE_HOVER_CSS_ATTR = 'data-hover-css'

export const IMAGE_OBJECT_FITS: ImageObjectFit[] = [
  'fill',
  'contain',
  'cover',
  'none',
  'scale-down',
]

export const IMAGE_OBJECT_POSITIONS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top left',
  'top right',
  'bottom left',
  'bottom right',
] as const

export type ImageObjectPosition = (typeof IMAGE_OBJECT_POSITIONS)[number]

const OBJECT_FIT_SET = new Set<string>(IMAGE_OBJECT_FITS)
const OBJECT_POSITION_SET = new Set<string>(IMAGE_OBJECT_POSITIONS)

const HOVER_CSS_OVER =
  "if(this._hp==null)this._hp=this.getAttribute('style')||'';this.setAttribute('style',(this._hp?this._hp+';':'')+(this.getAttribute('data-hover-css')||''))"

const HOVER_CSS_OUT =
  "if(this._hp!=null){this.setAttribute('style',this._hp);this._hp=null}"

const SAFE_PROPERTY = /^-?[a-z][a-z0-9-]*$/i
const DANGEROUS_VALUE = /expression\s*\(|javascript:|vbscript:|-moz-binding|\bbehavior\b/i

const ROTATE_PATTERN = /rotate\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*deg\s*\)/i

export function defaultImagePropertiesApply(
  overrides: Partial<ImagePropertiesApply> = {},
): ImagePropertiesApply {
  return {
    sizeMode: 'width',
    width: null,
    height: null,
    align: null,
    margin: { ...EMPTY_BOX_SIDES },
    border: { ...EMPTY_BORDER },
    borderRadius: null,
    boxShadow: null,
    opacity: null,
    objectFit: null,
    objectPosition: null,
    rotateDeg: null,
    hoverCss: '',
    ...overrides,
  }
}

export function imageAspectRatio(img: HTMLImageElement): number {
  const width = img.naturalWidth
  const height = img.naturalHeight
  if (width > 0 && height > 0) return width / height
  return 1
}

export function ensureSizeForObjectFit(
  draft: ImagePropertiesApply,
  aspectRatio: number,
): ImagePropertiesApply {
  const fit = draft.objectFit
  if (fit !== 'cover' && fit !== 'contain' && fit !== 'fill') return draft
  if (draft.width && draft.height) return draft
  if (!draft.width && !draft.height) return draft
  if (draft.width) {
    const locked = scaleLockedSize('width', draft.width, aspectRatio)
    return { ...draft, sizeMode: 'lock', width: locked.width, height: locked.height }
  }
  if (draft.height) {
    const locked = scaleLockedSize('height', draft.height, aspectRatio)
    return { ...draft, sizeMode: 'lock', width: locked.width, height: locked.height }
  }
  return draft
}

export function sanitizeHoverCss(raw: string): string {
  const parts: string[] = []
  for (const chunk of raw.split(';')) {
    const declaration = chunk.trim()
    if (!declaration) continue
    const colon = declaration.indexOf(':')
    if (colon <= 0) continue
    const property = declaration.slice(0, colon).trim().toLowerCase()
    const value = declaration.slice(colon + 1).trim()
    if (!property || !value) continue
    if (!SAFE_PROPERTY.test(property)) continue
    if (property === 'behavior' || property.endsWith('binding')) continue
    if (DANGEROUS_VALUE.test(value)) continue
    parts.push(`${property}: ${value}`)
  }
  return parts.join('; ')
}

export function imageAtSelection(root: HTMLElement): HTMLImageElement | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return null

  if (range.startContainer instanceof HTMLImageElement) return range.startContainer
  if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
    const child = range.startContainer.childNodes[range.startOffset]
    if (child instanceof HTMLImageElement && isInside(root, child)) return child
  }
  return closestImage(root, range.commonAncestorContainer)
}

export function queryImageAtSelection(root: HTMLElement): ImagePropertiesApply | null {
  const img = imageAtSelection(root)
  return img ? readImageProperties(img) : null
}

export function readImageProperties(img: HTMLImageElement): ImagePropertiesApply {
  const box = readParagraphBox(img)
  const align = readAlign(img)
  const margin = align === 'center' ? { ...box.margin, left: null, right: null } : box.margin
  const size = readSize(img)
  return defaultImagePropertiesApply({
    sizeMode: size.sizeMode,
    width: size.width,
    height: size.height,
    align,
    margin,
    border: box.border,
    borderRadius: box.borderRadius,
    boxShadow: box.boxShadow,
    opacity: box.opacity,
    objectFit: readObjectFit(img),
    objectPosition: readObjectPosition(img),
    rotateDeg: readRotate(img),
    hoverCss: img.getAttribute(IMAGE_HOVER_CSS_ATTR) ?? '',
  })
}

export function writeImageProperties(img: HTMLImageElement, draft: ImagePropertiesApply): boolean {
  let changed = false
  if (writeSize(img, draft)) changed = true
  if (
    writeParagraphBox(img, {
      margin: draft.align === 'center' ? { ...draft.margin, left: null, right: null } : draft.margin,
      marginMixed: false,
      padding: EMPTY_BOX_SIDES,
      paddingMixed: true,
      lineHeight: null,
      lineHeightMixed: true,
      border: draft.border,
      borderMixed: false,
      borderRadius: draft.borderRadius,
      radiusMixed: false,
      boxShadow: draft.boxShadow,
      shadowMixed: false,
      backgroundColor: null,
      backgroundMixed: true,
      opacity: draft.opacity,
      opacityMixed: false,
    })
  ) {
    changed = true
  }
  if (writeAlign(img, draft.align)) changed = true
  if (writeObjectFit(img, draft.objectFit)) changed = true
  if (writeObjectPosition(img, draft.objectPosition)) changed = true
  if (writeRotate(img, draft.rotateDeg)) changed = true
  if (writeHoverCss(img, draft.hoverCss)) changed = true
  return changed
}

export function applyImagePropertiesInDocument(
  root: HTMLElement,
  draft: ImagePropertiesApply,
): boolean {
  const img = imageAtSelection(root)
  if (!img) return false
  return writeImageProperties(img, draft)
}

function readSize(img: HTMLImageElement): {
  sizeMode: ImageSizeMode
  width: ImageSizeLength | null
  height: ImageSizeLength | null
} {
  const width = parseImageSize(img.style.width)
  const height = parseImageSize(img.style.height)
  if (width && height) return { sizeMode: 'lock', width, height }
  if (height && !width) return { sizeMode: 'height', width: null, height }
  return { sizeMode: 'width', width, height: null }
}

function writeSize(img: HTMLImageElement, draft: ImagePropertiesApply): boolean {
  const before = {
    width: img.style.width,
    height: img.style.height,
    maxWidth: img.style.maxWidth,
  }
  const next = normalizeSize(draft)
  if (next.width) img.style.width = formatImageSize(next.width)
  else img.style.removeProperty('width')
  if (next.height) img.style.height = formatImageSize(next.height)
  else img.style.height = 'auto'
  if (next.width || next.height) img.style.removeProperty('max-width')
  else img.style.maxWidth = '100%'
  return (
    before.width !== img.style.width ||
    before.height !== img.style.height ||
    before.maxWidth !== img.style.maxWidth
  )
}

function normalizeSize(draft: ImagePropertiesApply): {
  sizeMode: ImageSizeMode
  width: ImageSizeLength | null
  height: ImageSizeLength | null
} {
  if (draft.sizeMode === 'width') return { sizeMode: 'width', width: draft.width, height: null }
  if (draft.sizeMode === 'height') return { sizeMode: 'height', width: null, height: draft.height }
  return { sizeMode: 'lock', width: draft.width, height: draft.height }
}

function readAlign(img: HTMLImageElement): ImageAlign | null {
  const float = img.style.float.trim().toLowerCase()
  if (float === 'left') return 'left'
  if (float === 'right') return 'right'
  const display = img.style.display.trim().toLowerCase()
  const marginLeft = img.style.marginLeft.trim().toLowerCase()
  const marginRight = img.style.marginRight.trim().toLowerCase()
  if (display === 'block' && marginLeft === 'auto' && marginRight === 'auto') return 'center'
  return null
}

function writeAlign(img: HTMLImageElement, align: ImageAlign | null): boolean {
  const before = {
    float: img.style.float,
    display: img.style.display,
    marginLeft: img.style.marginLeft,
    marginRight: img.style.marginRight,
  }

  if (align === 'left') {
    img.style.float = 'left'
    img.style.removeProperty('display')
    if (img.style.marginLeft.trim().toLowerCase() === 'auto') img.style.removeProperty('margin-left')
    if (img.style.marginRight.trim().toLowerCase() === 'auto') img.style.removeProperty('margin-right')
  } else if (align === 'right') {
    img.style.float = 'right'
    img.style.removeProperty('display')
    if (img.style.marginLeft.trim().toLowerCase() === 'auto') img.style.removeProperty('margin-left')
    if (img.style.marginRight.trim().toLowerCase() === 'auto') img.style.removeProperty('margin-right')
  } else if (align === 'center') {
    img.style.removeProperty('float')
    img.style.display = 'block'
    img.style.marginLeft = 'auto'
    img.style.marginRight = 'auto'
  } else {
    img.style.removeProperty('float')
    if (img.style.display.trim().toLowerCase() === 'block') img.style.removeProperty('display')
    if (img.style.marginLeft.trim().toLowerCase() === 'auto') img.style.removeProperty('margin-left')
    if (img.style.marginRight.trim().toLowerCase() === 'auto') img.style.removeProperty('margin-right')
  }

  return (
    before.float !== img.style.float ||
    before.display !== img.style.display ||
    before.marginLeft !== img.style.marginLeft ||
    before.marginRight !== img.style.marginRight
  )
}

function readObjectFit(img: HTMLImageElement): ImageObjectFit | null {
  const value = img.style.objectFit.trim().toLowerCase()
  if (OBJECT_FIT_SET.has(value)) return value as ImageObjectFit
  return null
}

function writeObjectFit(img: HTMLImageElement, fit: ImageObjectFit | null): boolean {
  const current = readObjectFit(img)
  if (current === fit) return false
  if (fit) img.style.objectFit = fit
  else img.style.removeProperty('object-fit')
  return true
}

function writeObjectPosition(img: HTMLImageElement, position: string | null): boolean {
  const next = position?.trim().toLowerCase().replace(/\s+/g, ' ') || ''
  const current = img.style.objectPosition.trim().toLowerCase().replace(/\s+/g, ' ')
  if (current === next) return false
  if (next) img.style.objectPosition = next
  else img.style.removeProperty('object-position')
  return true
}

function readObjectPosition(img: HTMLImageElement): string | null {
  const value = img.style.objectPosition.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!value) return null
  if (OBJECT_POSITION_SET.has(value)) return value
  return value
}

function readRotate(img: HTMLImageElement): number | null {
  const match = ROTATE_PATTERN.exec(img.style.transform)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  return roundFontSize(value)
}

function isOnlyRotate(transform: string): boolean {
  const trimmed = transform.trim()
  if (!trimmed) return true
  return ROTATE_PATTERN.test(trimmed) && trimmed.replace(ROTATE_PATTERN, '').trim() === ''
}

function writeRotate(img: HTMLImageElement, deg: number | null): boolean {
  const current = readRotate(img)
  const next = deg === null || deg === 0 ? null : roundFontSize(deg)
  if (current === next) return false
  if (next === null) {
    if (isOnlyRotate(img.style.transform)) {
      img.style.removeProperty('transform')
      return true
    }
    return false
  }
  img.style.transform = `rotate(${formatFontSizeNumber(next)}deg)`
  return true
}

function writeHoverCss(img: HTMLImageElement, raw: string): boolean {
  const next = sanitizeHoverCss(raw)
  const current = img.getAttribute(IMAGE_HOVER_CSS_ATTR) ?? ''
  const currentOver = img.getAttribute('onmouseover') ?? ''
  if (current === next && ((next && currentOver === HOVER_CSS_OVER) || (!next && !currentOver))) {
    return false
  }
  if (!next) {
    img.removeAttribute(IMAGE_HOVER_CSS_ATTR)
    img.removeAttribute('onmouseover')
    img.removeAttribute('onmouseout')
    return true
  }
  img.setAttribute(IMAGE_HOVER_CSS_ATTR, next)
  img.setAttribute('onmouseover', HOVER_CSS_OVER)
  img.setAttribute('onmouseout', HOVER_CSS_OUT)
  return true
}

export function imagePropertiesEqual(a: ImagePropertiesApply, b: ImagePropertiesApply): boolean {
  return (
    a.sizeMode === b.sizeMode &&
    imageSizeLengthsEqual(a.width, b.width) &&
    imageSizeLengthsEqual(a.height, b.height) &&
    a.align === b.align &&
    boxSidesEqual(a.margin, b.margin) &&
    bordersEqual(a.border, b.border) &&
    cssLengthsEqual(a.borderRadius, b.borderRadius) &&
    shadowsEqual(a.boxShadow, b.boxShadow) &&
    a.opacity === b.opacity &&
    a.objectFit === b.objectFit &&
    a.objectPosition === b.objectPosition &&
    a.rotateDeg === b.rotateDeg &&
    a.hoverCss === b.hoverCss
  )
}
