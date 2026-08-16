import { afterEach, describe, expect, it } from 'vitest'
import { IMAGE_SIZE_LIMITS } from './imageSize'
import {
  IMAGE_RESIZE_MIN_PX,
  nextImageResizeSize,
  writeImagePixelSize,
} from './imageResize'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('nextImageResizeSize', () => {
  const start = { width: 200, height: 100 }

  it('keeps aspect ratio when dragging the right edge', () => {
    expect(nextImageResizeSize('e', start, { x: 50, y: 80 })).toEqual({
      width: 250,
      height: 125,
    })
  })

  it('keeps aspect ratio when dragging the bottom edge', () => {
    expect(nextImageResizeSize('s', start, { x: 80, y: 50 })).toEqual({
      width: 300,
      height: 150,
    })
  })

  it('does not keep aspect ratio when dragging the bottom-right corner', () => {
    expect(nextImageResizeSize('se', start, { x: 40, y: 10 })).toEqual({
      width: 240,
      height: 110,
    })
  })

  it('clamps east drags so both sides stay at least the minimum', () => {
    const next = nextImageResizeSize('e', start, { x: -1000, y: 0 })
    expect(next.width).toBe(IMAGE_RESIZE_MIN_PX * 2)
    expect(next.height).toBe(IMAGE_RESIZE_MIN_PX)
  })

  it('clamps free resize independently on each side', () => {
    expect(nextImageResizeSize('se', start, { x: -1000, y: 5000 })).toEqual({
      width: IMAGE_RESIZE_MIN_PX,
      height: IMAGE_SIZE_LIMITS.px.max,
    })
  })
})

describe('writeImagePixelSize', () => {
  it('writes locked px size as inline styles and drops max-width', () => {
    const el = mountVisual(
      '<p><img src="https://example.com/a.png" style="max-width: 100%; height: auto"></p>',
    )
    const img = el.querySelector('img') as HTMLImageElement

    expect(writeImagePixelSize(img, 180, 90)).toBe(true)
    expect(img.style.width).toBe('180px')
    expect(img.style.height).toBe('90px')
    expect(img.style.maxWidth).toBe('')
    expect(img.className).toBe('')
    expect(img.outerHTML).not.toContain('class=')
  })

  it('clamps to the resize minimum', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement

    writeImagePixelSize(img, 2, 4)
    expect(img.style.width).toBe(`${IMAGE_RESIZE_MIN_PX}px`)
    expect(img.style.height).toBe(`${IMAGE_RESIZE_MIN_PX}px`)
  })
})
