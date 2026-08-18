import { isInside } from './inlineRange'

export type AudioAttrs = {
  src: string
  title: string
  css?: string
}

export type AudioSrcError = 'empty' | 'invalid'

export type AudioFileError = 'type' | 'tooLarge'

export const AUDIO_MAX_FILE_BYTES = 5 * 1024 * 1024

export const AUDIO_ACCEPT =
  'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/aac,audio/webm,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.aac,.webm,.m4a'

const ALLOWED_AUDIO_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
])

const ALLOWED_AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'aac', 'webm', 'm4a'])

const DATA_AUDIO_SRC =
  /^data:audio\/(?:mpeg|mp3|wav|x-wav|ogg|aac|webm|mp4|x-m4a)(?:;charset=[^;,]+)?;base64,/i

const DANGEROUS_SCHEME = /^(javascript|vbscript|file|blob):/i

export function defaultAudioAttrs(overrides: Partial<AudioAttrs> = {}): AudioAttrs {
  return {
    src: '',
    title: '',
    ...overrides,
  }
}

export function validateAudioSrc(src: string): AudioSrcError | null {
  const trimmed = src.trim()
  if (!trimmed) return 'empty'
  if (DANGEROUS_SCHEME.test(trimmed)) return 'invalid'
  if (trimmed.toLowerCase().startsWith('data:')) {
    return DATA_AUDIO_SRC.test(trimmed) ? null : 'invalid'
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    const scheme = trimmed.slice(0, trimmed.indexOf(':')).toLowerCase()
    return scheme === 'http' || scheme === 'https' ? null : 'invalid'
  }
  return null
}

export function validateAudioFile(file: File): AudioFileError | null {
  if (file.size > AUDIO_MAX_FILE_BYTES) return 'tooLarge'
  if (!isAllowedAudioFile(file)) return 'type'
  return null
}

export function readAudioFileAsDataUrl(file: File): Promise<string> {
  const error = validateAudioFile(file)
  if (error) {
    return Promise.reject(new Error(error))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      if (validateAudioSrc(result)) {
        reject(new Error('invalid'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function applyAudioAttrs(audio: HTMLAudioElement, attrs: AudioAttrs): void {
  audio.setAttribute('controls', '')
  audio.setAttribute('src', attrs.src.trim())
  const title = attrs.title.trim()
  if (title) audio.setAttribute('title', title)
  else audio.removeAttribute('title')
  audio.style.maxWidth = '100%'
  applyInlineCss(audio, attrs.css)
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

export function insertAudioInDocument(root: HTMLElement, attrs: AudioAttrs): boolean {
  const next = defaultAudioAttrs(attrs)
  if (validateAudioSrc(next.src)) return false

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  if (!range.collapsed) range.deleteContents()

  const audio = document.createElement('audio')
  applyAudioAttrs(audio, next)
  range.insertNode(audio)
  range.setStartAfter(audio)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

function isAllowedAudioFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime && ALLOWED_AUDIO_MIME.has(mime)) return true
  const ext = extensionOf(file.name)
  if (!mime && ext && ALLOWED_AUDIO_EXT.has(ext)) return true
  return false
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}
