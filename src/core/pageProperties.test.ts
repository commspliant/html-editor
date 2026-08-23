import { afterEach, describe, expect, it } from 'vitest'
import { PAGE_SIZED_ATTR } from './pageCanvasLayout'
import { emptyPageAtRuleApply } from './pageAtRule'
import {
  applyDefaultPagePropertiesToPageHtml,
  applyPagePropertiesInDocument,
  emptyPagePropertiesApply,
  mergePagePropertiesDefaults,
  resetPageAtRuleInDocument,
} from './pageProperties'

function mountVisual(html: string): HTMLDivElement {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('applyPagePropertiesInDocument @page sync', () => {
  it('returns authoritative pageHtml with @page and sizes the canvas', () => {
    const el = mountVisual('<p>Hello</p>')
    const result = applyPagePropertiesInDocument(el, {
      ...emptyPagePropertiesApply(),
      atRule: { ...emptyPageAtRuleApply(), sizePreset: 'A4' },
    })

    expect(result.changed).toBe(true)
    expect(result.pageHtml).toContain('data-page-at-rule')
    expect(el.getAttribute(PAGE_SIZED_ATTR)).toBe('')
    expect(el.style.width).toBe('210mm')
    expect(el.style.minHeight).toBe('297mm')
    expect(el.querySelector('style[data-page-at-rule]')).toBeNull()
  })

  it('syncs canvas from nextHtml when innerHTML read drops the style tag', () => {
    const el = mountVisual('<p>Hello</p>')
    let stored = '<p>Hello</p>'

    Object.defineProperty(el, 'innerHTML', {
      configurable: true,
      get() {
        return stored.replace(/<style[\s\S]*?<\/style>/gi, '')
      },
      set(value: string) {
        stored = value
      },
    })

    const result = applyPagePropertiesInDocument(el, {
      ...emptyPagePropertiesApply(),
      atRule: { ...emptyPageAtRuleApply(), sizePreset: 'A4' },
    })

    expect(result.pageHtml).toContain('data-page-at-rule')
    expect(el.getAttribute(PAGE_SIZED_ATTR)).toBe('')
    expect(el.style.width).toBe('210mm')
    expect(stored.replace(/<style[\s\S]*?<\/style>/gi, '')).not.toContain('data-page-at-rule')
  })
})

describe('mergePagePropertiesDefaults', () => {
  it('merges only provided atRule fields onto current state', () => {
    const current = {
      ...emptyPagePropertiesApply(),
      atRule: {
        ...emptyPageAtRuleApply(),
        sizePreset: 'A4' as const,
      },
    }
    const merged = mergePagePropertiesDefaults(current, {
      atRule: { orientation: 'landscape' },
    })
    expect(merged.atRule.sizePreset).toBe('A4')
    expect(merged.atRule.orientation).toBe('landscape')
  })

  it('merges partial font marks without clearing other marks', () => {
    const current = {
      ...emptyPagePropertiesApply(),
      font: {
        ...emptyPagePropertiesApply().font,
        marks: { bold: true, italic: false, underline: false, strikethrough: false },
      },
    }
    const merged = mergePagePropertiesDefaults(current, {
      font: { marks: { italic: true } },
    })
    expect(merged.font.marks).toEqual({
      bold: true,
      italic: true,
      underline: false,
      strikethrough: false,
    })
  })
})

describe('applyDefaultPagePropertiesToPageHtml', () => {
  it('applies @page defaults to bare page HTML', () => {
    const html = applyDefaultPagePropertiesToPageHtml('<p>Hello</p>', {
      atRule: { sizePreset: 'A4' },
    })
    expect(html).toContain('data-page-at-rule')
    expect(html).toContain('size: A4')
    expect(html).toContain('data-page')
  })

  it('returns input unchanged when defaults are empty', () => {
    const input = '<p>Hello</p>'
    expect(applyDefaultPagePropertiesToPageHtml(input, {})).toBe(input)
  })
})

describe('resetPageAtRuleInDocument', () => {
  it('returns authoritative pageHtml without @page and clears canvas sizing', () => {
    const sourceHtml =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Hello</p></div>'
    const el = mountVisual('<div data-page><p>Hello</p></div>')
    el.setAttribute(PAGE_SIZED_ATTR, '')
    el.style.width = '210mm'

    const result = resetPageAtRuleInDocument(el, sourceHtml)

    expect(result.changed).toBe(true)
    expect(result.pageHtml).not.toContain('data-page-at-rule')
    expect(el.hasAttribute(PAGE_SIZED_ATTR)).toBe(false)
    expect(el.style.width).toBe('')
    expect(el.querySelector('style[data-page-at-rule]')).toBeNull()
  })
})
