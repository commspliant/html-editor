import { readImageProperties, writeImageProperties } from './imageProperties'
import { clampImageSize, IMAGE_SIZE_LIMITS } from './imageSize'

export type ImageResizeHandle = 'e' | 's' | 'se'

export type ImageResizeStart = {
  width: number
  height: number
}

export type ImageResizeDelta = {
  x: number
  y: number
}

export type ImageResizeSize = {
  width: number
  height: number
}

export const IMAGE_RESIZE_MIN_PX = 16

function clampDim(value: number): number {
  return Math.min(IMAGE_SIZE_LIMITS.px.max, Math.max(IMAGE_RESIZE_MIN_PX, value))
}

function startAspect(start: ImageResizeStart): number {
  if (start.width > 0 && start.height > 0) return start.width / start.height
  return 1
}

function lockedFromWidth(width: number, aspect: number): ImageResizeSize {
  const minWidth = Math.max(IMAGE_RESIZE_MIN_PX, IMAGE_RESIZE_MIN_PX * aspect)
  const maxWidth = Math.min(IMAGE_SIZE_LIMITS.px.max, IMAGE_SIZE_LIMITS.px.max * aspect)
  const nextWidth = Math.min(maxWidth, Math.max(minWidth, width))
  return { width: nextWidth, height: nextWidth / aspect }
}

function lockedFromHeight(height: number, aspect: number): ImageResizeSize {
  const minHeight = Math.max(IMAGE_RESIZE_MIN_PX, IMAGE_RESIZE_MIN_PX / aspect)
  const maxHeight = Math.min(IMAGE_SIZE_LIMITS.px.max, IMAGE_SIZE_LIMITS.px.max / aspect)
  const nextHeight = Math.min(maxHeight, Math.max(minHeight, height))
  return { width: nextHeight * aspect, height: nextHeight }
}

export function nextImageResizeSize(
  handle: ImageResizeHandle,
  start: ImageResizeStart,
  delta: ImageResizeDelta,
): ImageResizeSize {
  const aspect = startAspect(start)
  if (handle === 'e') return lockedFromWidth(start.width + delta.x, aspect)
  if (handle === 's') return lockedFromHeight(start.height + delta.y, aspect)
  return {
    width: clampDim(start.width + delta.x),
    height: clampDim(start.height + delta.y),
  }
}

export function imageResizeStartSize(img: HTMLImageElement): ImageResizeStart {
  const rect = img.getBoundingClientRect()
  const width = img.offsetWidth || rect.width
  const height = img.offsetHeight || rect.height
  return {
    width: width > 0 ? width : IMAGE_RESIZE_MIN_PX,
    height: height > 0 ? height : IMAGE_RESIZE_MIN_PX,
  }
}

export function writeImagePixelSize(
  img: HTMLImageElement,
  widthPx: number,
  heightPx: number,
): boolean {
  const width = clampImageSize(Math.max(IMAGE_RESIZE_MIN_PX, widthPx), 'px')
  const height = clampImageSize(Math.max(IMAGE_RESIZE_MIN_PX, heightPx), 'px')
  if (!width || !height) return false
  return writeImageProperties(img, {
    ...readImageProperties(img),
    sizeMode: 'lock',
    width,
    height,
  })
}
