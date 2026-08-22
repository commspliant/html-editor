export const BREAK_INSIDE_VALUES = ['auto', 'avoid'] as const
export const BREAK_BEFORE_AFTER_VALUES = ['auto', 'avoid', 'page'] as const

export type BreakInsideValue = (typeof BREAK_INSIDE_VALUES)[number]
export type BreakBeforeAfterValue = (typeof BREAK_BEFORE_AFTER_VALUES)[number]

const BREAK_INSIDE_SET = new Set<string>(BREAK_INSIDE_VALUES)
const BREAK_BEFORE_AFTER_SET = new Set<string>(BREAK_BEFORE_AFTER_VALUES)

function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase()
}

export function parseBreakInside(raw: string): BreakInsideValue {
  const value = normalizeToken(raw)
  if (value === 'avoid') return 'avoid'
  return 'auto'
}

export function parseBreakBeforeAfter(raw: string): BreakBeforeAfterValue {
  const value = normalizeToken(raw)
  if (value === 'avoid') return 'avoid'
  if (value === 'page' || value === 'always') return 'page'
  return 'auto'
}

function readBreakInside(el: HTMLElement): BreakInsideValue {
  const modern = el.style.breakInside
  if (modern) return parseBreakInside(modern)
  const legacy = el.style.pageBreakInside
  if (legacy) return parseBreakInside(legacy)
  return 'auto'
}

function readBreakAfter(el: HTMLElement): BreakBeforeAfterValue {
  const modern = el.style.breakAfter
  if (modern) return parseBreakBeforeAfter(modern)
  const legacy = el.style.pageBreakAfter
  if (legacy) return parseBreakBeforeAfter(legacy)
  return 'auto'
}

function readBreakBefore(el: HTMLElement): BreakBeforeAfterValue {
  const modern = el.style.breakBefore
  if (modern) return parseBreakBeforeAfter(modern)
  const legacy = el.style.pageBreakBefore
  if (legacy) return parseBreakBeforeAfter(legacy)
  return 'auto'
}

function clearBreakInside(el: HTMLElement): void {
  el.style.removeProperty('break-inside')
  el.style.removeProperty('page-break-inside')
}

function clearBreakAfter(el: HTMLElement): void {
  el.style.removeProperty('break-after')
  el.style.removeProperty('page-break-after')
}

function clearBreakBefore(el: HTMLElement): void {
  el.style.removeProperty('break-before')
  el.style.removeProperty('page-break-before')
}

export function readParagraphBreak(el: HTMLElement): {
  breakInside: BreakInsideValue
  breakAfter: BreakBeforeAfterValue
  breakBefore: BreakBeforeAfterValue
} {
  return {
    breakInside: readBreakInside(el),
    breakAfter: readBreakAfter(el),
    breakBefore: readBreakBefore(el),
  }
}

export function writeBreakInside(el: HTMLElement, value: BreakInsideValue): boolean {
  const current = readBreakInside(el)
  if (current === value) return false
  if (value === 'auto') {
    clearBreakInside(el)
    return true
  }
  el.style.breakInside = 'avoid'
  el.style.pageBreakInside = 'avoid'
  return true
}

export function writeBreakAfter(el: HTMLElement, value: BreakBeforeAfterValue): boolean {
  const current = readBreakAfter(el)
  if (current === value) return false
  if (value === 'auto') {
    clearBreakAfter(el)
    return true
  }
  if (value === 'avoid') {
    el.style.breakAfter = 'avoid'
    el.style.pageBreakAfter = 'avoid'
    return true
  }
  el.style.breakAfter = 'page'
  el.style.pageBreakAfter = 'always'
  return true
}

export function writeBreakBefore(el: HTMLElement, value: BreakBeforeAfterValue): boolean {
  const current = readBreakBefore(el)
  if (current === value) return false
  if (value === 'auto') {
    clearBreakBefore(el)
    return true
  }
  if (value === 'avoid') {
    el.style.breakBefore = 'avoid'
    el.style.pageBreakBefore = 'avoid'
    return true
  }
  el.style.breakBefore = 'page'
  el.style.pageBreakBefore = 'always'
  return true
}

export function breakInsideValuesEqual(a: BreakInsideValue, b: BreakInsideValue): boolean {
  return a === b
}

export function breakBeforeAfterValuesEqual(
  a: BreakBeforeAfterValue,
  b: BreakBeforeAfterValue,
): boolean {
  return a === b
}

export function isBreakInsideValue(value: string): value is BreakInsideValue {
  return BREAK_INSIDE_SET.has(value)
}

export function isBreakBeforeAfterValue(value: string): value is BreakBeforeAfterValue {
  return BREAK_BEFORE_AFTER_SET.has(value)
}
