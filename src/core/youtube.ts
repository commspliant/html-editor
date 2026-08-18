import { isInside } from './inlineRange'

export type YoutubeAttrs = {
  url: string
  title: string
  css?: string
}

export type VideoAttrs = {
  src: string
  title: string
  css?: string
}

export type YoutubeUrlError = 'empty' | 'invalid'

const DANGEROUS_SCHEME = /^(javascript|vbscript|file|blob):/i

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:[^&]*&)*v=|youtube\.com\/watch\?v=)([\w-]{11})/i,
  /youtu\.be\/([\w-]{11})/i,
  /youtube\.com\/embed\/([\w-]{11})/i,
  /youtube\.com\/shorts\/([\w-]{11})/i,
]

export function defaultYoutubeAttrs(overrides: Partial<YoutubeAttrs> = {}): YoutubeAttrs {
  return {
    url: '',
    title: '',
    ...overrides,
  }
}

export function defaultVideoAttrs(overrides: Partial<VideoAttrs> = {}): VideoAttrs {
  return {
    src: '',
    title: '',
    ...overrides,
  }
}

export function parseYoutubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

export function validateYoutubeUrl(url: string): YoutubeUrlError | null {
  const trimmed = url.trim()
  if (!trimmed) return 'empty'
  if (DANGEROUS_SCHEME.test(trimmed)) return 'invalid'
  return parseYoutubeVideoId(trimmed) ? null : 'invalid'
}

export function validateVideoSrc(src: string): 'empty' | 'invalid' | null {
  const trimmed = src.trim()
  if (!trimmed) return 'empty'
  if (DANGEROUS_SCHEME.test(trimmed)) return 'invalid'
  if (parseYoutubeVideoId(trimmed)) return null
  if (trimmed.toLowerCase().startsWith('data:')) {
    return /^data:video\//i.test(trimmed) ? null : 'invalid'
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    const scheme = trimmed.slice(0, trimmed.indexOf(':')).toLowerCase()
    return scheme === 'http' || scheme === 'https' ? null : 'invalid'
  }
  return null
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

function applyYoutubeIframeAttrs(iframe: HTMLIFrameElement, embedUrl: string, attrs: YoutubeAttrs): void {
  iframe.setAttribute('src', embedUrl)
  iframe.setAttribute('frameborder', '0')
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  )
  iframe.setAttribute('allowfullscreen', '')
  const title = attrs.title.trim()
  if (title) iframe.setAttribute('title', title)
  else iframe.removeAttribute('title')
  iframe.style.maxWidth = '100%'
  iframe.style.width = '560px'
  iframe.style.aspectRatio = '16 / 9'
  iframe.style.border = '0'
  applyInlineCss(iframe, attrs.css)
}

function applyVideoAttrs(video: HTMLVideoElement, attrs: VideoAttrs): void {
  video.setAttribute('controls', '')
  video.setAttribute('src', attrs.src.trim())
  const title = attrs.title.trim()
  if (title) video.setAttribute('title', title)
  else video.removeAttribute('title')
  video.style.maxWidth = '100%'
  applyInlineCss(video, attrs.css)
}

export function insertYoutubeInDocument(root: HTMLElement, attrs: YoutubeAttrs): boolean {
  const next = defaultYoutubeAttrs(attrs)
  if (validateYoutubeUrl(next.url)) return false
  const videoId = parseYoutubeVideoId(next.url)
  if (!videoId) return false

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  if (!range.collapsed) range.deleteContents()

  const iframe = document.createElement('iframe')
  applyYoutubeIframeAttrs(iframe, youtubeEmbedUrl(videoId), next)
  range.insertNode(iframe)
  range.setStartAfter(iframe)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

export function insertVideoInDocument(root: HTMLElement, attrs: VideoAttrs): boolean {
  const next = defaultVideoAttrs(attrs)
  if (validateVideoSrc(next.src)) return false

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false

  if (!range.collapsed) range.deleteContents()

  const youtubeId = parseYoutubeVideoId(next.src)
  if (youtubeId) {
    const iframe = document.createElement('iframe')
    applyYoutubeIframeAttrs(iframe, youtubeEmbedUrl(youtubeId), {
      url: next.src,
      title: next.title,
      css: next.css,
    })
    range.insertNode(iframe)
    range.setStartAfter(iframe)
  } else {
    const video = document.createElement('video')
    applyVideoAttrs(video, next)
    range.insertNode(video)
    range.setStartAfter(video)
  }
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}
