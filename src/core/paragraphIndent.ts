import {
  collectSelectedBlocks,
  ensureSelectedBlocks,
  withRestoredSelection,
  clearEmptyStyle,
} from './blocks'
import { parseLengthToPx, pxToCssLength, type RulerUnit } from './rulerUnits'
import { formatCssLength } from './cssLength'

export type ParagraphIndentState = {
  firstLineIndentPx: number // relative to left margin (text-indent)
  leftIndentPx: number // paragraph margin-left
  rightIndentPx: number // paragraph margin-right
  mixed: boolean
}

export function emptyParagraphIndentState(): ParagraphIndentState {
  return {
    firstLineIndentPx: 0,
    leftIndentPx: 0,
    rightIndentPx: 0,
    mixed: false,
  }
}

/** Query the indent properties of the currently active/selected paragraph blocks */
export function queryParagraphIndent(root: HTMLElement): ParagraphIndentState {
  const blocks = collectSelectedBlocks(root)
  if (blocks.length === 0) return emptyParagraphIndentState()

  let firstLine: number | null = null
  let left: number | null = null
  let right: number | null = null
  let mixed = false

  for (const block of blocks) {
    const rawTextIndent = block.style.textIndent
    const rawMarginLeft = block.style.marginLeft
    const rawMarginRight = block.style.marginRight

    const blockFirstLine = rawTextIndent ? parseLengthToPx(rawTextIndent, 0) : 0
    const blockLeft = rawMarginLeft ? parseLengthToPx(rawMarginLeft, 0) : 0
    const blockRight = rawMarginRight ? parseLengthToPx(rawMarginRight, 0) : 0

    if (firstLine === null) {
      firstLine = blockFirstLine
      left = blockLeft
      right = blockRight
    } else {
      if (
        Math.abs(firstLine - blockFirstLine) > 1 ||
        Math.abs((left ?? 0) - blockLeft) > 1 ||
        Math.abs((right ?? 0) - blockRight) > 1
      ) {
        mixed = true
      }
    }
  }

  return {
    firstLineIndentPx: firstLine ?? 0,
    leftIndentPx: left ?? 0,
    rightIndentPx: right ?? 0,
    mixed,
  }
}

export type ApplyParagraphIndentOptions = {
  firstLineIndentPx?: number
  leftIndentPx?: number
  rightIndentPx?: number
  unit?: RulerUnit
}

/** Find target block element or fallback to nearest block/parent */
function resolveIndentBlock(root: HTMLElement): HTMLElement | null {
  const range = window.getSelection()?.getRangeAt(0)
  if (!range) return null

  let node: Node | null = range.startContainer
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode
  }

  while (node && node !== root && node !== document.body) {
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase()
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div'].includes(tag)) {
        return node
      }
    }
    node = node.parentNode
  }

  return null
}

/** Apply first line indent, left indent, and right indent to selected blocks or parent element */
export function applyParagraphIndentInDocument(
  root: HTMLElement,
  options: ApplyParagraphIndentOptions,
): boolean {
  return withRestoredSelection(root, () => {
    let blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) {
      const fallback = resolveIndentBlock(root)
      if (fallback) blocks = [fallback]
    }
    if (blocks.length === 0) return false

    const unit = options.unit ?? 'in'
    let changed = false

    for (const block of blocks) {
      if (options.firstLineIndentPx !== undefined) {
        if (Math.abs(options.firstLineIndentPx) < 0.5) {
          if (block.style.textIndent) {
            block.style.removeProperty('text-indent')
            changed = true
          }
        } else {
          const cssVal = formatCssLength(pxToCssLength(options.firstLineIndentPx, unit))
          if (block.style.textIndent !== cssVal) {
            block.style.textIndent = cssVal
            changed = true
          }
        }
      }

      if (options.leftIndentPx !== undefined) {
        if (options.leftIndentPx <= 0.5) {
          if (block.style.marginLeft) {
            block.style.removeProperty('margin-left')
            changed = true
          }
        } else {
          const cssVal = formatCssLength(pxToCssLength(options.leftIndentPx, unit))
          if (block.style.marginLeft !== cssVal) {
            block.style.marginLeft = cssVal
            changed = true
          }
        }
      }

      if (options.rightIndentPx !== undefined) {
        if (options.rightIndentPx <= 0.5) {
          if (block.style.marginRight) {
            block.style.removeProperty('margin-right')
            changed = true
          }
        } else {
          const cssVal = formatCssLength(pxToCssLength(options.rightIndentPx, unit))
          if (block.style.marginRight !== cssVal) {
            block.style.marginRight = cssVal
            changed = true
          }
        }
      }

      clearEmptyStyle(block)
    }

    return changed
  })
}
