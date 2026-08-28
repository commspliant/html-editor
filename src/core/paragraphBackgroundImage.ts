import { collectSelectedBlocks, ensureSelectedBlocks, withRestoredSelection } from './blocks'
import { formatImageSize } from './imageSize'
import {
  emptyPageBackgroundImageApply,
  readBackgroundImageStyles,
  writeBackgroundImageStyles,
  type PageBackgroundImageApply,
} from './pageBackgroundImage'

function sizeToken(length: PageBackgroundImageApply['width']): string {
  if (!length) return ''
  return formatImageSize(length)
}

function backgroundImagesEqual(
  a: PageBackgroundImageApply,
  b: PageBackgroundImageApply,
): boolean {
  return (
    a.src === b.src &&
    a.opacity === b.opacity &&
    a.fit === b.fit &&
    a.position === b.position &&
    sizeToken(a.width) === sizeToken(b.width) &&
    sizeToken(a.height) === sizeToken(b.height)
  )
}

export function queryParagraphBackgroundImage(root: HTMLElement): PageBackgroundImageApply {
  const blocks = collectSelectedBlocks(root)
  if (blocks.length === 0) return emptyPageBackgroundImageApply()
  const images = blocks.map(readBackgroundImageStyles)
  const first = images[0]
  if (images.some((image) => !backgroundImagesEqual(image, first))) {
    return emptyPageBackgroundImageApply()
  }
  return first
}

export function applyParagraphBackgroundImageInDocument(
  root: HTMLElement,
  draft: PageBackgroundImageApply,
): boolean {
  return withRestoredSelection(root, () => {
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false
    let changed = false
    for (const block of blocks) {
      if (writeBackgroundImageStyles(block, draft)) changed = true
    }
    return changed
  })
}
