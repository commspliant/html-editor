import type { FontSizeValue } from './fontSize'
import { applyPendingFontSize } from './fontSize'
import {
  applyPendingFontFamily,
  breakOutOfFontFamily,
  peelFontFamilyFromNode,
  pendingClearsFontFamily,
  type PendingFontFamily,
} from './fontFamily'
import { applyPendingCustomCss } from './customCss'
import {
  applyPendingInlineColor,
  breakOutOfInlineColor,
  peelInlineColorFromNode,
  pendingClearKinds,
  type PendingInlineColors,
} from './inlineColor'
import {
  isolateNodeInParent,
  isFormattingWrapper,
  isInside,
  restoreTextSelection,
  shouldUnwrapSpan,
  splitRangeBoundaries,
  textNodesInRange,
  unwrapElement,
  wrapTextWithStyle,
} from './inlineRange'

export type FontMark = 'bold' | 'italic' | 'underline' | 'strikethrough'

export type FontMarkState = Record<FontMark, boolean>

export type PendingFontMarks = Partial<Record<FontMark, boolean>>

export const FONT_MARKS: FontMark[] = ['bold', 'italic', 'underline', 'strikethrough']

const SEMANTIC_TAGS: Record<FontMark, ReadonlySet<string>> = {
  bold: new Set(['strong', 'b']),
  italic: new Set(['em', 'i']),
  underline: new Set(['u']),
  strikethrough: new Set(['s', 'strike', 'del']),
}

const DECORATION_TOKENS = new Set(['underline', 'line-through', 'overline'])

export function emptyFontMarkState(): FontMarkState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  }
}

export function fontMarkStateEqual(a: FontMarkState, b: FontMarkState): boolean {
  return FONT_MARKS.every((mark) => a[mark] === b[mark])
}

export function hasPendingFontMarks(pending: PendingFontMarks): boolean {
  return FONT_MARKS.some((mark) => pending[mark] !== undefined)
}

export function mergePendingFontMarks(
  inherited: FontMarkState,
  pending: PendingFontMarks | undefined,
): FontMarkState {
  const next = { ...inherited }
  if (!pending) return next
  for (const mark of FONT_MARKS) {
    const override = pending[mark]
    if (override !== undefined) next[mark] = override
  }
  return next
}

export function togglePendingFontMark(
  pending: PendingFontMarks,
  inherited: FontMarkState,
  mark: FontMark,
): PendingFontMarks {
  const current = pending[mark] ?? inherited[mark]
  const next: PendingFontMarks = { ...pending, [mark]: !current }
  if (next[mark] === inherited[mark]) {
    delete next[mark]
  }
  return next
}

function decorationLines(el: HTMLElement): string[] {
  const raw = el.style.textDecorationLine || el.style.textDecoration
  return raw.split(/\s+/).filter((token) => DECORATION_TOKENS.has(token))
}

function setDecorationLines(el: HTMLElement, tokens: string[]): void {
  if (tokens.length === 0) {
    el.style.textDecorationLine = ''
    el.style.removeProperty('text-decoration-line')
    if (el.style.textDecoration) {
      el.style.textDecoration = ''
      el.style.removeProperty('text-decoration')
    }
    return
  }
  el.style.textDecorationLine = tokens.join(' ')
}

function elementMarkValue(el: Element, mark: FontMark): boolean | null {
  const html = el as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (mark === 'bold') {
    if (SEMANTIC_TAGS.bold.has(tag)) return true
    const weight = html.style.fontWeight
    if (!weight) return null
    if (weight === 'bold' || weight === 'bolder') return true
    const numeric = Number(weight)
    if (!Number.isNaN(numeric)) return numeric >= 700
    if (weight === 'normal' || weight === 'lighter') return false
    return null
  }

  if (mark === 'italic') {
    if (SEMANTIC_TAGS.italic.has(tag)) return true
    const style = html.style.fontStyle
    if (!style) return null
    if (style === 'italic' || style === 'oblique') return true
    if (style === 'normal') return false
    return null
  }

  if (mark === 'underline') {
    if (SEMANTIC_TAGS.underline.has(tag)) return true
    const line = html.style.textDecorationLine || html.style.textDecoration
    if (!line) return null
    if (line === 'none') return false
    const tokens = decorationLines(html)
    if (tokens.includes('underline')) return true
    if (tokens.length > 0) return false
    return null
  }

  if (SEMANTIC_TAGS.strikethrough.has(tag)) return true
  const line = html.style.textDecorationLine || html.style.textDecoration
  if (!line) return null
  if (line === 'none') return false
  const tokens = decorationLines(html)
  if (tokens.includes('line-through')) return true
  if (tokens.length > 0) return false
  return null
}

function elementAppliesMark(el: Element, mark: FontMark): boolean {
  return elementMarkValue(el, mark) === true
}

export function isMarkActiveAtNode(root: HTMLElement, node: Node, mark: FontMark): boolean {
  let current: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  while (current && current !== root && current instanceof Element) {
    const value = elementMarkValue(current, mark)
    if (value !== null) return value
    current = current.parentElement
  }
  return false
}

function addMarkToElement(el: HTMLElement, mark: FontMark): void {
  if (mark === 'bold') {
    el.style.fontWeight = '700'
    return
  }
  if (mark === 'italic') {
    el.style.fontStyle = 'italic'
    return
  }
  if (mark === 'underline') {
    const tokens = decorationLines(el)
    if (!tokens.includes('underline')) tokens.push('underline')
    setDecorationLines(el, tokens)
    return
  }
  const tokens = decorationLines(el)
  if (!tokens.includes('line-through')) tokens.push('line-through')
  setDecorationLines(el, tokens)
}

function removeMarkFromElement(el: HTMLElement, mark: FontMark): void {
  if (mark === 'bold') {
    el.style.fontWeight = ''
    el.style.removeProperty('font-weight')
    return
  }
  if (mark === 'italic') {
    el.style.fontStyle = ''
    el.style.removeProperty('font-style')
    return
  }
  if (mark === 'underline') {
    setDecorationLines(
      el,
      decorationLines(el).filter((token) => token !== 'underline'),
    )
    return
  }
  setDecorationLines(
    el,
    decorationLines(el).filter((token) => token !== 'line-through'),
  )
}

function applyMarkOffToElement(el: HTMLElement, mark: FontMark): void {
  if (mark === 'bold') {
    el.style.fontWeight = '400'
    return
  }
  if (mark === 'italic') {
    el.style.fontStyle = 'normal'
    return
  }
  if (mark === 'underline') {
    const tokens = decorationLines(el).filter((token) => token !== 'underline')
    if (tokens.length === 0) {
      el.style.textDecorationLine = 'none'
      return
    }
    setDecorationLines(el, tokens)
    return
  }
  const tokens = decorationLines(el).filter((token) => token !== 'line-through')
  if (tokens.length === 0) {
    el.style.textDecorationLine = 'none'
    return
  }
  setDecorationLines(el, tokens)
}

function wrapTextWithMark(text: Text, mark: FontMark): void {
  wrapTextWithStyle(text, (el) => addMarkToElement(el, mark))
}

function unwrapMarkFromText(root: HTMLElement, text: Text, mark: FontMark): void {
  let node: Node = text
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent) || !elementAppliesMark(parent, mark)) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    if (elementAppliesMark(parent, mark)) {
      if (SEMANTIC_TAGS[mark].has(parent.tagName.toLowerCase())) {
        unwrapElement(parent)
        continue
      }
      removeMarkFromElement(parent as HTMLElement, mark)
      if (shouldUnwrapSpan(parent as HTMLElement)) {
        unwrapElement(parent)
        continue
      }
    }
    node = parent
  }
}

function isMarkActiveInRange(root: HTMLElement, range: Range, mark: FontMark): boolean {
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  if (texts.length === 0) {
    return isMarkActiveAtNode(root, range.startContainer, mark)
  }
  return texts.every((text) => isMarkActiveAtNode(root, text, mark))
}

function applyMarkToRange(root: HTMLElement, range: Range, mark: FontMark, enable: boolean): void {
  splitRangeBoundaries(range)
  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  for (const text of texts) {
    if (enable) {
      if (!isMarkActiveAtNode(root, text, mark)) {
        wrapTextWithMark(text, mark)
      }
    } else {
      unwrapMarkFromText(root, text, mark)
    }
  }
  restoreTextSelection(texts)
}

export function queryInheritedFontMarks(root: HTMLElement): FontMarkState {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return emptyFontMarkState()
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return emptyFontMarkState()

  if (range.collapsed) {
    return marksFromCaret(root, range)
  }

  const texts = textNodesInRange(range).filter((node) => node.data.length > 0)
  if (texts.length === 0) return marksFromCaret(root, range)

  const first = emptyFontMarkState()
  for (const mark of FONT_MARKS) {
    first[mark] = isMarkActiveAtNode(root, texts[0], mark)
  }
  for (let i = 1; i < texts.length; i += 1) {
    for (const mark of FONT_MARKS) {
      first[mark] = first[mark] && isMarkActiveAtNode(root, texts[i], mark)
    }
  }
  return first
}

function marksFromCaret(root: HTMLElement, range: Range): FontMarkState {
  const state = emptyFontMarkState()
  for (const mark of FONT_MARKS) {
    state[mark] = isMarkActiveAtNode(root, range.startContainer, mark)
  }
  return state
}

export function queryFontMarks(
  root: HTMLElement,
  pending?: PendingFontMarks,
): FontMarkState {
  return mergePendingFontMarks(queryInheritedFontMarks(root), pending)
}

export function toggleFontMarkInDocument(root: HTMLElement, mark: FontMark): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return false
  if (range.collapsed) return false

  const active = isMarkActiveInRange(root, range, mark)
  applyMarkToRange(root, range, mark, !active)
  return true
}

function splitTextAtCaret(range: Range): void {
  const node = range.startContainer
  const offset = range.startOffset
  if (node.nodeType !== Node.TEXT_NODE) return
  const text = node as Text
  if (offset <= 0 || offset >= text.length) return
  const after = text.splitText(offset)
  range.setStart(after, 0)
  range.collapse(true)
}

function breakOutOfMarks(root: HTMLElement, range: Range, marks: FontMark[]): Node {
  splitTextAtCaret(range)
  let insertAt: Node =
    range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0
      ? range.startContainer
      : range.startContainer.childNodes[range.startOffset] ??
        range.startContainer.lastChild ??
        range.startContainer

  if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
    const spacer = document.createTextNode('')
    range.startContainer.parentNode?.insertBefore(
      spacer,
      (range.startContainer as Text).nextSibling,
    )
    insertAt = spacer
  } else if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
    const spacer = document.createTextNode('')
    range.startContainer.parentNode?.insertBefore(spacer, range.startContainer)
    insertAt = spacer
  } else {
    const spacer = document.createTextNode('')
    if (insertAt && insertAt !== range.startContainer) {
      insertAt.parentNode?.insertBefore(spacer, insertAt)
    } else {
      range.startContainer.appendChild(spacer)
    }
    insertAt = spacer
  }

  let node: Node = insertAt
  while (node.parentElement && node.parentElement !== root) {
    const parent = node.parentElement
    if (!isFormattingWrapper(parent)) {
      node = parent
      continue
    }
    const leaves = marks.some((mark) => elementAppliesMark(parent, mark))
    if (!leaves) {
      node = parent
      continue
    }
    isolateNodeInParent(parent, node)
    for (const mark of marks) {
      if (!elementAppliesMark(parent, mark)) continue
      if (SEMANTIC_TAGS[mark].has(parent.tagName.toLowerCase())) {
        unwrapElement(parent)
        break
      }
      removeMarkFromElement(parent as HTMLElement, mark)
      if (shouldUnwrapSpan(parent as HTMLElement)) {
        unwrapElement(parent)
        break
      }
    }
    node = parent.isConnected ? parent : insertAt
  }

  return insertAt
}

function applyDesiredOverrides(
  span: HTMLElement,
  inherited: FontMarkState,
  desired: FontMarkState,
): void {
  for (const mark of FONT_MARKS) {
    if (desired[mark] === inherited[mark]) continue
    if (desired[mark]) addMarkToElement(span, mark)
    else applyMarkOffToElement(span, mark)
  }
}

export function applyPendingFontMarksOnInsert(
  root: HTMLElement,
  text: string,
  pending: PendingFontMarks,
  pendingFontSize?: FontSizeValue | null,
  pendingColors?: PendingInlineColors | null,
  pendingFontFamily?: PendingFontFamily,
  pendingCustomCss?: string | null,
): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (!isInside(root, range.commonAncestorContainer)) return

  const inherited = marksFromCaret(root, range)
  const desired = mergePendingFontMarks(inherited, pending)
  const leave = FONT_MARKS.filter((mark) => inherited[mark] && !desired[mark])
  const leaveColors = pendingClearKinds(root, range.startContainer, pendingColors)
  const leaveFontFamily = pendingClearsFontFamily(root, range.startContainer, pendingFontFamily)

  let insertAt: Node | null = null
  if (leave.length > 0) {
    insertAt = breakOutOfMarks(root, range, leave)
    if (leaveColors.length > 0) {
      peelInlineColorFromNode(root, insertAt, leaveColors)
    }
    if (leaveFontFamily) {
      peelFontFamilyFromNode(root, insertAt)
    }
  } else if (leaveColors.length > 0) {
    insertAt = breakOutOfInlineColor(root, range, leaveColors)
    if (leaveFontFamily) {
      peelFontFamilyFromNode(root, insertAt)
    }
  } else if (leaveFontFamily) {
    insertAt = breakOutOfFontFamily(root, range)
  } else {
    range.deleteContents()
  }

  const span = document.createElement('span')
  applyDesiredOverrides(span, inherited, desired)
  if (pendingFontSize) applyPendingFontSize(span, pendingFontSize)
  if (pendingColors?.color) applyPendingInlineColor(span, 'color', pendingColors.color)
  if (pendingColors?.backgroundColor) {
    applyPendingInlineColor(span, 'backgroundColor', pendingColors.backgroundColor)
  }
  if (pendingFontFamily) applyPendingFontFamily(span, pendingFontFamily)
  if (pendingCustomCss) applyPendingCustomCss(span, pendingCustomCss)
  span.textContent = text

  const nodeToInsert = span.style.cssText.trim() ? span : document.createTextNode(text)

  if (insertAt) {
    insertAt.parentNode?.insertBefore(nodeToInsert, insertAt)
    if (insertAt.nodeType === Node.TEXT_NODE && !(insertAt as Text).data) {
      insertAt.parentNode?.removeChild(insertAt)
    }
  } else {
    range.insertNode(nodeToInsert)
  }

  const caret = document.createRange()
  caret.selectNodeContents(nodeToInsert)
  caret.collapse(false)
  sel.removeAllRanges()
  sel.addRange(caret)
}
