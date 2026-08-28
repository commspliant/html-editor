const WEBP_ENCODE_QUALITY = 0.85

const SKIP_WEBP_MIME = new Set(['image/webp', 'image/avif', 'image/gif'])

let webpEncodingSupported: boolean | null = null

/** Clears the cached capability probe (unit tests only). */
export function resetWebPEncodingSupportCache(): void {
  webpEncodingSupported = null
}

export function supportsWebPEncoding(): boolean {
  if (webpEncodingSupported !== null) return webpEncodingSupported
  webpEncodingSupported = false
  try {
    const canvas = document.createElement('canvas')
    const dataUrl = canvas.toDataURL('image/webp')
    webpEncodingSupported = dataUrl.startsWith('data:image/webp')
  } catch {
    // jsdom and other environments without canvas encode support fall back to the original file.
  }
  return webpEncodingSupported
}

export function shouldConvertImageFileToWebP(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime && SKIP_WEBP_MIME.has(mime)) return false
  const ext = extensionOf(file.name)
  if (!mime && (ext === 'webp' || ext === 'avif' || ext === 'gif')) return false
  return true
}

export function convertImageFileToWebPDataUrl(
  file: File,
  quality = WEBP_ENCODE_QUALITY,
): Promise<string | null> {
  if (typeof createImageBitmap !== 'function') {
    return Promise.resolve(null)
  }

  return createImageBitmap(file)
    .then((bitmap) => convertBitmapToWebPDataUrl(bitmap, quality))
    .catch(() => null)
}

function convertBitmapToWebPDataUrl(bitmap: ImageBitmap, quality: number): Promise<string | null> {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return Promise.resolve(null)
  }

  try {
    ctx.drawImage(bitmap, 0, 0)
  } finally {
    bitmap.close()
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null)
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          const result = String(reader.result ?? '')
          resolve(result.startsWith('data:image/webp') ? result : null)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      },
      'image/webp',
      quality,
    )
  })
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}
