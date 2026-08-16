import { isInside } from './inlineRange'

export type ImageAttrs = {
  src: string
  alt: string
  title: string
  css?: string
}

export type ImageSrcError = 'empty' | 'invalid'

export type ImageFileError = 'type' | 'tooLarge'

export const IMAGE_MAX_FILE_BYTES = 2 * 1024 * 1024

export const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.bmp,.avif'

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/x-ms-bmp',
  'image/avif',
])

const ALLOWED_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif'])

const DATA_IMAGE_SRC =
  /^data:image\/(?:jpeg|jpg|png|gif|webp|bmp|avif)(?:;charset=[^;,]+)?;base64,/i

const DANGEROUS_SCHEME = /^(javascript|vbscript|file|blob):/i

export function defaultImageAttrs(overrides: Partial<ImageAttrs> = {}): ImageAttrs {
  return {
    src: '',
    alt: '',
    title: '',
    ...overrides,
  }
}

export function validateImageSrc(src: string): ImageSrcError | null {
  const trimmed = src.trim()
  if (!trimmed) return 'empty'
  if (DANGEROUS_SCHEME.test(trimmed)) return 'invalid'
  if (trimmed.toLowerCase().startsWith('data:')) {
    return DATA_IMAGE_SRC.test(trimmed) ? null : 'invalid'
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    const scheme = trimmed.slice(0, trimmed.indexOf(':')).toLowerCase()
    return scheme === 'http' || scheme === 'https' ? null : 'invalid'
  }
  return null
}

export function validateImageFile(file: File): ImageFileError | null {
  if (file.size > IMAGE_MAX_FILE_BYTES) return 'tooLarge'
  if (!isAllowedImageFile(file)) return 'type'
  return null
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  const error = validateImageFile(file)
  if (error) {
    return Promise.reject(new Error(error))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      if (validateImageSrc(result)) {
        reject(new Error('invalid'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function applyImageAttrs(img: HTMLImageElement, attrs: ImageAttrs): void {
  img.setAttribute('src', attrs.src.trim())
  const alt = attrs.alt.trim()
  const title = attrs.title.trim()
  if (alt) img.setAttribute('alt', alt)
  else img.removeAttribute('alt')
  if (title) img.setAttribute('title', title)
  else img.removeAttribute('title')
  img.style.maxWidth = '100%'
  img.style.height = 'auto'
  applyInlineCss(img, attrs.css)
}

function applyInlineCss(el: HTMLElement, css: string | undefined): void {
  if (!css) return
  for (const part of css.split(';')) {
    const declaration = part.trim()
    if (!declaration) continue
    const colon = declaration.indexOf(':')
    if (colon <= 0) continue
    const property = declaration.slice(0, colon).trim()
    const value = declaration.slice(colon + 1).trim()
    if (property && value) el.style.setProperty(property, value)
  }
}

export function insertImageInDocument(root: HTMLElement, attrs: ImageAttrs): boolean {
  const next = defaultImageAttrs(attrs)
  if (validateImageSrc(next.src)) return false

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  if (!range.collapsed) range.deleteContents()

  const img = document.createElement('img')
  applyImageAttrs(img, next)
  range.insertNode(img)
  range.setStartAfter(img)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

export function closestImage(root: HTMLElement, node: Node | null): HTMLImageElement | null {
  let current: Node | null = node
  while (current && current !== root) {
    if (current instanceof HTMLImageElement) return current
    current = current.parentNode
  }
  return null
}

export function selectImageInDocument(root: HTMLElement, img: HTMLImageElement): boolean {
  if (!isInside(root, img) || img === root) return false
  const range = document.createRange()
  range.selectNode(img)
  const sel = window.getSelection()
  if (!sel) return false
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

function isAllowedImageFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime && ALLOWED_IMAGE_MIME.has(mime)) return true
  const ext = extensionOf(file.name)
  if (!mime && ext && ALLOWED_IMAGE_EXT.has(ext)) return true
  return false
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}
