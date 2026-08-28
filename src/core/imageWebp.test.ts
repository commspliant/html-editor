import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  convertImageFileToWebPDataUrl,
  resetWebPEncodingSupportCache,
  shouldConvertImageFileToWebP,
  supportsWebPEncoding,
} from './imageWebp'

describe('shouldConvertImageFileToWebP', () => {
  it('skips webp, avif, and gif', () => {
    expect(shouldConvertImageFileToWebP(new File(['x'], 'a.webp', { type: 'image/webp' }))).toBe(
      false,
    )
    expect(shouldConvertImageFileToWebP(new File(['x'], 'a.avif', { type: 'image/avif' }))).toBe(
      false,
    )
    expect(shouldConvertImageFileToWebP(new File(['x'], 'a.gif', { type: 'image/gif' }))).toBe(
      false,
    )
  })

  it('converts png, jpeg, and bmp', () => {
    expect(shouldConvertImageFileToWebP(new File(['x'], 'a.png', { type: 'image/png' }))).toBe(true)
    expect(shouldConvertImageFileToWebP(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe(
      true,
    )
    expect(shouldConvertImageFileToWebP(new File(['x'], 'a.bmp', { type: 'image/bmp' }))).toBe(
      true,
    )
  })

  it('skips gif by extension when mime is missing', () => {
    expect(shouldConvertImageFileToWebP(new File(['x'], 'anim.gif'))).toBe(false)
  })
})

describe('supportsWebPEncoding', () => {
  afterEach(() => {
    resetWebPEncodingSupportCache()
    vi.restoreAllMocks()
  })

  it('returns true when the browser encodes webp', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (type) {
      if (type === 'image/webp') return 'data:image/webp;base64,'
      return 'data:image/png;base64,'
    })
    expect(supportsWebPEncoding()).toBe(true)
  })

  it('returns false when toDataURL throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('not implemented')
    })
    expect(supportsWebPEncoding()).toBe(false)
  })
})

describe('convertImageFileToWebPDataUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when createImageBitmap is unavailable', async () => {
    const original = globalThis.createImageBitmap
    // @ts-expect-error test stub
    globalThis.createImageBitmap = undefined
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    await expect(convertImageFileToWebPDataUrl(file)).resolves.toBeNull()
    globalThis.createImageBitmap = original
  })

  it('returns a webp data URL when encoding succeeds', async () => {
    const close = vi.fn()
    const bitmap = { width: 2, height: 2, close } as unknown as ImageBitmap
    vi.spyOn(globalThis, 'createImageBitmap').mockResolvedValue(bitmap)

    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['webp'], { type: 'image/webp' }))
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlob)

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const result = await convertImageFileToWebPDataUrl(file)
    expect(result?.startsWith('data:image/webp;base64,')).toBe(true)
    expect(close).toHaveBeenCalled()
  })

  it('returns null when toBlob yields no blob', async () => {
    const bitmap = { width: 2, height: 2, close: vi.fn() } as unknown as ImageBitmap
    vi.spyOn(globalThis, 'createImageBitmap').mockResolvedValue(bitmap)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(null)
    })

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    await expect(convertImageFileToWebPDataUrl(file)).resolves.toBeNull()
  })

  it('returns null when createImageBitmap rejects', async () => {
    vi.spyOn(globalThis, 'createImageBitmap').mockRejectedValue(new Error('decode failed'))
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    await expect(convertImageFileToWebPDataUrl(file)).resolves.toBeNull()
  })
})
