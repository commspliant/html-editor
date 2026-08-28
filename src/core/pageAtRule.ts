import { formatCssLength, parseCssLength, type CssLength } from './cssLength'
import {
  BOX_SIDES,
  EMPTY_BOX_SIDES,
  type BoxSide,
  type BoxSides,
} from './paragraphBox'
import { parseFlexibleCssLength, pxToMarginCssLength, unitToPx } from './rulerUnits'

/** Parse @page margin lengths, including physical units (in/cm/mm) normalized to pt. */
function parsePageMarginCssLength(raw: string): CssLength | null {
  const parsed = parseCssLength(raw)
  if (parsed) return parsed

  const flex = parseFlexibleCssLength(raw)
  if (!flex) return null

  if (flex.unit === 'in' || flex.unit === 'cm' || flex.unit === 'mm') {
    return pxToMarginCssLength(unitToPx(flex.value, flex.unit))
  }

  return null
}

export const PAGE_AT_RULE_ATTR = 'data-page-at-rule'

export type PageSizePreset = 'auto' | 'A4' | 'letter' | 'legal' | 'custom'

export type PageAtRuleApply = {
  sizePreset: PageSizePreset
  customWidth: CssLength | null
  customHeight: CssLength | null
  orientation: 'portrait' | 'landscape' | null
  margin: BoxSides
  marginMixed: boolean
}

export function emptyPageAtRuleApply(): PageAtRuleApply {
  return {
    sizePreset: 'auto',
    customWidth: null,
    customHeight: null,
    orientation: null,
    margin: { ...EMPTY_BOX_SIDES },
    marginMixed: false,
  }
}

function parsePageHtml(html: string): Document {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  return doc
}

function serializePageBody(doc: Document): string {
  return doc.body.innerHTML.replace(/\s*data-page=""/g, ' data-page')
}

export function extractPageAtRuleCss(html: string): string | null {
  const doc = parsePageHtml(html)
  const style = doc.querySelector(`style[${PAGE_AT_RULE_ATTR}]`)
  return style?.textContent?.trim() ?? null
}

function readMarginSide(block: string, side: BoxSide): CssLength | null {
  const re = new RegExp(`margin-${side}\\s*:\\s*([^;]+)`, 'i')
  const match = block.match(re)
  if (!match) return null
  return parsePageMarginCssLength(match[1].trim())
}

function readShorthandMargin(block: string): BoxSides {
  const match = block.match(/(?:^|[\s{;])margin\s*:\s*([^;]+)/i)
  if (!match) return { ...EMPTY_BOX_SIDES }
  const parts = match[1].trim().split(/\s+/).map((part) => parsePageMarginCssLength(part))
  const [top, right = top, bottom = top, left = right] = parts
  return {
    top: top ?? null,
    right: right ?? null,
    bottom: bottom ?? null,
    left: left ?? null,
  }
}

function readSize(block: string): Pick<PageAtRuleApply, 'sizePreset' | 'customWidth' | 'customHeight' | 'orientation'> {
  const empty = {
    sizePreset: 'auto' as const,
    customWidth: null,
    customHeight: null,
    orientation: null,
  }
  const match = block.match(/(?:^|[\s{;])size\s*:\s*([^;]+)/i)
  if (!match) return empty

  const raw = match[1].trim().toLowerCase()
  if (raw === 'auto') return empty

  const landscape = raw.includes('landscape')
  const portrait = raw.includes('portrait')
  const orientation = landscape ? 'landscape' : portrait ? 'portrait' : null
  const cleaned = raw.replace(/\b(landscape|portrait)\b/g, '').trim()
  const tokens = cleaned.split(/\s+/).filter(Boolean)

  if (tokens.length === 1) {
    if (tokens[0] === 'a4') {
      return { sizePreset: 'A4', customWidth: null, customHeight: null, orientation }
    }
    if (tokens[0] === 'letter') {
      return { sizePreset: 'letter', customWidth: null, customHeight: null, orientation }
    }
    if (tokens[0] === 'legal') {
      return { sizePreset: 'legal', customWidth: null, customHeight: null, orientation }
    }
  }

  if (tokens.length >= 2) {
    const width = parseCssLength(tokens[0])
    const height = parseCssLength(tokens[1])
    if (width && height) {
      return {
        sizePreset: 'custom',
        customWidth: width,
        customHeight: height,
        orientation,
      }
    }
  }

  if (!cleaned && orientation) {
    return { sizePreset: 'auto', customWidth: null, customHeight: null, orientation }
  }

  return empty
}

export function parsePageAtRuleCss(css: string | null): PageAtRuleApply {
  const empty = emptyPageAtRuleApply()
  if (!css) return empty
  const match = css.match(/@page\s*\{([^}]*)\}/is)
  if (!match) return empty
  const block = match[1]
  const size = readSize(block)
  const marginFromSides: BoxSides = {
    top: readMarginSide(block, 'top'),
    right: readMarginSide(block, 'right'),
    bottom: readMarginSide(block, 'bottom'),
    left: readMarginSide(block, 'left'),
  }
  const hasSideMargins = BOX_SIDES.some((side) => marginFromSides[side] !== null)
  const margin = hasSideMargins ? marginFromSides : readShorthandMargin(block)
  return {
    ...size,
    margin,
    marginMixed: false,
  }
}

export function queryPageAtRule(pageHtml: string): PageAtRuleApply {
  return parsePageAtRuleCss(extractPageAtRuleCss(pageHtml))
}

/** Re-apply a previous @page rule when body HTML lost the managed style tag. */
export function preservePageAtRuleInBody(bodyHtml: string, previousPageHtml: string): string {
  if (extractPageAtRuleCss(bodyHtml)) return bodyHtml
  const previousCss = extractPageAtRuleCss(previousPageHtml)
  if (!previousCss) return bodyHtml
  return applyPageAtRule(bodyHtml, queryPageAtRule(previousPageHtml))
}

function formatMargin(margin: BoxSides): string | null {
  const sides = BOX_SIDES.map((side) => margin[side])
  if (sides.every((side) => side === null)) return null
  const formatted = sides.map((side) => (side ? formatCssLength(side) : '0'))
  if (
    formatted[0] === formatted[1] &&
    formatted[1] === formatted[2] &&
    formatted[2] === formatted[3]
  ) {
    return `margin: ${formatted[0]};`
  }
  return BOX_SIDES.map((side) =>
    margin[side] ? `margin-${side}: ${formatCssLength(margin[side]!)};` : null,
  )
    .filter(Boolean)
    .join(' ')
}

function formatSize(draft: PageAtRuleApply): string | null {
  if (draft.sizePreset === 'auto' && !draft.orientation) return null
  const parts: string[] = []
  if (draft.sizePreset === 'A4') parts.push('A4')
  else if (draft.sizePreset === 'letter') parts.push('letter')
  else if (draft.sizePreset === 'legal') parts.push('legal')
  else if (
    draft.sizePreset === 'custom' &&
    draft.customWidth &&
    draft.customHeight
  ) {
    parts.push(formatCssLength(draft.customWidth), formatCssLength(draft.customHeight))
  }
  if (draft.orientation) parts.push(draft.orientation)
  if (parts.length === 0) return null
  return `size: ${parts.join(' ')};`
}

export function serializePageAtRuleCss(draft: PageAtRuleApply): string | null {
  const size = formatSize(draft)
  const margin = formatMargin(draft.margin)
  if (!size && !margin) return null
  return `@page { ${[size, margin].filter(Boolean).join(' ')} }`
}

/** Remove the managed @page style tag from page HTML, leaving editable body content. */
export function stripPageAtRuleFromHtml(html: string): string {
  const doc = parsePageHtml(html)
  for (const style of doc.querySelectorAll(`style[${PAGE_AT_RULE_ATTR}]`)) {
    style.remove()
  }
  return serializePageBody(doc)
}

function upsertAtRuleStyle(html: string, css: string): string {
  const doc = parsePageHtml(html)
  let style = doc.querySelector(`style[${PAGE_AT_RULE_ATTR}]`)
  if (!style) {
    style = doc.createElement('style')
    style.setAttribute(PAGE_AT_RULE_ATTR, '')
    doc.body.insertBefore(style, doc.body.firstChild)
  }
  style.textContent = css
  return serializePageBody(doc)
}

export function applyPageAtRule(pageHtml: string, draft: PageAtRuleApply): string {
  const css = serializePageAtRuleCss(draft)
  if (!css) return resetPageAtRule(pageHtml)
  return upsertAtRuleStyle(pageHtml, css)
}

export function resetPageAtRule(pageHtml: string): string {
  return stripPageAtRuleFromHtml(pageHtml)
}

export function collectPageAtRulesForPrint(pages: readonly string[]): string {
  const rules = pages
    .map((page) => extractPageAtRuleCss(page))
    .filter((css): css is string => Boolean(css))
  if (rules.length === 0) return ''
  return rules.join('\n')
}
