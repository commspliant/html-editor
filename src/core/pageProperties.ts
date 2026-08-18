import { clearEmptyStyle, currentRange, restoreOffsets, textOffsetFromRoot } from './blocks'
import type { FontPropertiesApply, PagePropertiesApply } from './commandTypes'
import {
  clampFontSize,
  DEFAULT_FONT_SIZE_UNIT,
  formatFontSize,
  isFontSizeUnit,
  parseFontSize,
} from './fontSizeUnits'
import { fontFamiliesEqual } from './fontFamily'
import { normalizeCssColor } from './inlineColor'
import { emptyFontMarkState, type FontMarkState } from './marks'
import { ensurePageShell, ensurePageShellLayout, queryPageShell, syncPageHolderBackground } from './page'
import {
  emptyPageBackgroundImageApply,
  readPageBackgroundImage,
  writePageBackgroundImage,
} from './pageBackgroundImage'
import {
  applyPageAtRule,
  emptyPageAtRuleApply,
  queryPageAtRule,
  resetPageAtRule,
} from './pageAtRule'
import {
  emptyParagraphBoxApply,
  readParagraphBox,
  writeParagraphBox,
  type ParagraphBoxApply,
} from './paragraphBox'

export function emptyFontPropertiesApply(): FontPropertiesApply {
  return {
    size: null,
    unit: DEFAULT_FONT_SIZE_UNIT,
    marks: emptyFontMarkState(),
    fontFamily: null,
    fontFamilyMixed: false,
    fontColor: null,
    highlightColor: null,
    fontColorMixed: false,
    highlightColorMixed: false,
  }
}

export function emptyPagePropertiesApply(): PagePropertiesApply {
  return {
    font: emptyFontPropertiesApply(),
    box: emptyParagraphBoxApply(),
    backgroundImage: emptyPageBackgroundImageApply(),
    atRule: emptyPageAtRuleApply(),
  }
}

function readPageFont(el: HTMLElement): FontPropertiesApply {
  const rawSize = el.style.fontSize
  const parsed = rawSize ? parseFontSize(rawSize) : null
  const size =
    parsed && isFontSizeUnit(parsed.unit)
      ? { value: parsed.value, unit: parsed.unit }
      : null
  const decoration = `${el.style.textDecorationLine} ${el.style.textDecoration}`.toLowerCase()
  const weight = el.style.fontWeight.trim().toLowerCase()
  const marks: FontMarkState = {
    bold: weight === 'bold' || Number(weight) >= 700,
    italic: el.style.fontStyle.trim().toLowerCase() === 'italic',
    underline: /\bunderline\b/.test(decoration),
    strikethrough: /\bline-through\b/.test(decoration),
  }
  const colorRaw = el.style.color
  const familyRaw = el.style.fontFamily.trim()
  return {
    size: size?.value ?? null,
    unit: size?.unit ?? DEFAULT_FONT_SIZE_UNIT,
    marks,
    fontFamily: familyRaw || null,
    fontFamilyMixed: false,
    fontColor: colorRaw ? normalizeCssColor(colorRaw) : null,
    highlightColor: null,
    fontColorMixed: false,
    highlightColorMixed: false,
  }
}

function writeFontSize(el: HTMLElement, draft: FontPropertiesApply): boolean {
  const current = el.style.fontSize
  const clamped = draft.size === null ? null : clampFontSize(draft.size, draft.unit)
  if (!clamped) {
    if (!current) return false
    el.style.removeProperty('font-size')
    return true
  }
  const next = formatFontSize(clamped.value, clamped.unit)
  if (current === next) return false
  el.style.fontSize = next
  return true
}

function writeFontFamily(el: HTMLElement, draft: FontPropertiesApply): boolean {
  if (draft.fontFamilyMixed) return false
  const next = draft.fontFamily?.trim() ? draft.fontFamily.trim() : null
  const current = el.style.fontFamily.trim() || null
  if (fontFamiliesEqual(current, next)) return false
  if (next) el.style.fontFamily = next
  else el.style.removeProperty('font-family')
  return true
}

function writeFontColor(el: HTMLElement, draft: FontPropertiesApply): boolean {
  if (draft.fontColorMixed) return false
  const next = draft.fontColor ? normalizeCssColor(draft.fontColor) : null
  const current = el.style.color ? normalizeCssColor(el.style.color) : null
  if (current === next) return false
  if (next) el.style.color = next
  else el.style.removeProperty('color')
  return true
}

function writeFontMarks(el: HTMLElement, marks: FontMarkState): boolean {
  let changed = false
  const nextWeight = marks.bold ? 'bold' : ''
  if (el.style.fontWeight !== nextWeight) {
    if (nextWeight) el.style.fontWeight = nextWeight
    else el.style.removeProperty('font-weight')
    changed = true
  }
  const nextStyle = marks.italic ? 'italic' : ''
  if (el.style.fontStyle !== nextStyle) {
    if (nextStyle) el.style.fontStyle = nextStyle
    else el.style.removeProperty('font-style')
    changed = true
  }
  const decorations: string[] = []
  if (marks.underline) decorations.push('underline')
  if (marks.strikethrough) decorations.push('line-through')
  const nextDecoration = decorations.join(' ')
  const currentDecoration = (el.style.textDecorationLine || el.style.textDecoration).trim()
  if (currentDecoration !== nextDecoration) {
    if (nextDecoration) el.style.textDecoration = nextDecoration
    else {
      el.style.removeProperty('text-decoration')
      el.style.removeProperty('text-decoration-line')
    }
    changed = true
  }
  return changed
}

export function writePageFont(el: HTMLElement, draft: FontPropertiesApply): boolean {
  let changed = false
  if (writeFontSize(el, draft)) changed = true
  if (writeFontFamily(el, draft)) changed = true
  if (writeFontColor(el, draft)) changed = true
  if (writeFontMarks(el, draft.marks)) changed = true
  if (changed) clearEmptyStyle(el)
  return changed
}

function boxWithPageFill(draft: PagePropertiesApply): ParagraphBoxApply {
  const box = draft.box
  if (box.backgroundMixed) return box
  if (box.backgroundColor) return box
  if (!draft.font.highlightColorMixed && draft.font.highlightColor) {
    return { ...box, backgroundColor: draft.font.highlightColor }
  }
  return box
}

export function queryPageProperties(root: HTMLElement): PagePropertiesApply {
  const shell = queryPageShell(root)
  if (!shell) return emptyPagePropertiesApply()
  const box = readParagraphBox(shell)
  return {
    font: readPageFont(shell),
    box: {
      margin: box.margin,
      marginMixed: false,
      padding: box.padding,
      paddingMixed: false,
      lineHeight: box.lineHeight,
      lineHeightMixed: false,
      border: box.border,
      borderMixed: false,
      borderRadius: box.borderRadius,
      radiusMixed: false,
      boxShadow: box.boxShadow,
      shadowMixed: false,
      backgroundColor: box.backgroundColor,
      backgroundMixed: false,
      opacity: box.opacity,
      opacityMixed: false,
    },
    backgroundImage: readPageBackgroundImage(shell),
    atRule: queryPageAtRule(root.innerHTML),
  }
}

export function applyPagePropertiesInDocument(
  root: HTMLElement,
  draft: PagePropertiesApply,
): boolean {
  const range = currentRange(root)
  const start = range
    ? textOffsetFromRoot(root, range.startContainer, range.startOffset)
    : null
  const end = range
    ? textOffsetFromRoot(root, range.endContainer, range.endOffset)
    : null

  const existed = queryPageShell(root)
  const shell = ensurePageShell(root)
  ensurePageShellLayout(shell)
  const wroteFont = writePageFont(shell, draft.font)
  const wroteBox = writeParagraphBox(shell, boxWithPageFill(draft))
  const wroteBackgroundImage = writePageBackgroundImage(shell, draft.backgroundImage)
  syncPageHolderBackground(root)

  const previousAtRule = queryPageAtRule(root.innerHTML)
  const nextHtml = applyPageAtRule(root.innerHTML, draft.atRule)
  if (nextHtml !== root.innerHTML) {
    root.innerHTML = nextHtml
  }
  const wroteAtRule = JSON.stringify(previousAtRule) !== JSON.stringify(draft.atRule)

  if (start !== null && end !== null) {
    restoreOffsets(root, Math.min(start, end), Math.max(start, end))
  }

  return !existed || wroteFont || wroteBox || wroteBackgroundImage || wroteAtRule
}

export function resetPageAtRuleInDocument(root: HTMLElement): boolean {
  const nextHtml = resetPageAtRule(root.innerHTML)
  if (nextHtml === root.innerHTML) return false
  root.innerHTML = nextHtml
  syncPageHolderBackground(root)
  return true
}
