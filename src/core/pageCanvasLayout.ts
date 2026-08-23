import { formatCssLength } from './cssLength'
import { BOX_SIDES, type BoxSides } from './paragraphBox'
import {
  queryPageAtRule,
  type PageAtRuleApply,
} from './pageAtRule'

export const PAGE_SIZED_ATTR = 'data-page-sized'

export type PageCanvasSize = {
  width: string
  height: string
}

export const PAGE_SIZE_PRESETS: Record<
  Exclude<PageAtRuleApply['sizePreset'], 'auto' | 'custom'>,
  PageCanvasSize
> = {
  A4: { width: '210mm', height: '297mm' },
  letter: { width: '8.5in', height: '11in' },
  legal: { width: '8.5in', height: '14in' },
}

export function resolvePageCanvasSize(atRule: PageAtRuleApply): PageCanvasSize | null {
  let size: PageCanvasSize | null = null

  if (atRule.sizePreset === 'A4' || atRule.sizePreset === 'letter' || atRule.sizePreset === 'legal') {
    size = { ...PAGE_SIZE_PRESETS[atRule.sizePreset] }
  } else if (
    atRule.sizePreset === 'custom' &&
    atRule.customWidth &&
    atRule.customHeight
  ) {
    size = {
      width: formatCssLength(atRule.customWidth),
      height: formatCssLength(atRule.customHeight),
    }
  } else if (atRule.orientation) {
    return null
  } else {
    return null
  }

  if (atRule.orientation === 'landscape') {
    return { width: size.height, height: size.width }
  }

  return size
}

export function isPageCanvasSized(atRule: PageAtRuleApply): boolean {
  return resolvePageCanvasSize(atRule) !== null
}

export type PageCanvasDimensions = {
  width: number
  height: number
}

/** Measure @page canvas box size in pixels before the visual surface has laid out. */
export function probePageCanvasDimensions(atRule: PageAtRuleApply): PageCanvasDimensions | null {
  const size = resolvePageCanvasSize(atRule)
  if (!size) return null

  const probe = document.createElement('div')
  probe.style.position = 'fixed'
  probe.style.left = '-10000px'
  probe.style.top = '0'
  probe.style.visibility = 'hidden'
  probe.style.boxSizing = 'border-box'
  probe.style.width = size.width
  probe.style.minHeight = size.height

  const padding = resolvePageCanvasMarginPadding(atRule)
  for (const side of BOX_SIDES) {
    const value = padding[side]
    if (value) probe.style.setProperty(`padding-${side}`, value)
  }

  document.body.appendChild(probe)
  const dimensions = { width: probe.offsetWidth, height: probe.offsetHeight }
  probe.remove()
  return dimensions
}

export type PageCanvasMarginPadding = {
  top: string | null
  right: string | null
  bottom: string | null
  left: string | null
}

export function resolvePageCanvasMarginPadding(atRule: PageAtRuleApply): PageCanvasMarginPadding {
  return formatMarginPadding(atRule.margin)
}

function formatMarginPadding(margin: BoxSides): PageCanvasMarginPadding {
  return {
    top: margin.top ? formatCssLength(margin.top) : null,
    right: margin.right ? formatCssLength(margin.right) : null,
    bottom: margin.bottom ? formatCssLength(margin.bottom) : null,
    left: margin.left ? formatCssLength(margin.left) : null,
  }
}

const PAGE_CANVAS_STYLE_PROPS = [
  'width',
  'min-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const

function clearPageCanvasLayout(visualRoot: HTMLElement): void {
  visualRoot.removeAttribute(PAGE_SIZED_ATTR)
  for (const prop of PAGE_CANVAS_STYLE_PROPS) {
    visualRoot.style.removeProperty(prop)
  }
}

/** Apply page size and print-margin preview to the visual holder. Does not change document HTML. */
export function syncPageCanvasLayout(visualRoot: HTMLElement, pageHtml: string): void {
  const atRule = queryPageAtRule(pageHtml)
  const size = resolvePageCanvasSize(atRule)

  if (!size) {
    clearPageCanvasLayout(visualRoot)
    return
  }

  visualRoot.setAttribute(PAGE_SIZED_ATTR, '')
  visualRoot.style.width = size.width
  visualRoot.style.minHeight = size.height

  const padding = resolvePageCanvasMarginPadding(atRule)
  for (const side of BOX_SIDES) {
    const prop = `padding-${side}` as const
    const value = padding[side]
    if (value) visualRoot.style.setProperty(prop, value)
    else visualRoot.style.removeProperty(prop)
  }
}
