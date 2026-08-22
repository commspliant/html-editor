import { describe, expect, it } from 'vitest'
import {
  PAGE_SIZED_ATTR,
  PAGE_SIZE_PRESETS,
  isPageCanvasSized,
  resolvePageCanvasMarginPadding,
  resolvePageCanvasSize,
  syncPageCanvasLayout,
} from './pageCanvasLayout'
import { emptyPageAtRuleApply } from './pageAtRule'

describe('pageCanvasLayout', () => {
  it('resolves preset page sizes with portrait orientation', () => {
    expect(
      resolvePageCanvasSize({
        ...emptyPageAtRuleApply(),
        sizePreset: 'A4',
        orientation: 'portrait',
      }),
    ).toEqual(PAGE_SIZE_PRESETS.A4)
  })

  it('resolves preset page sizes', () => {
    expect(
      resolvePageCanvasSize({ ...emptyPageAtRuleApply(), sizePreset: 'A4' }),
    ).toEqual(PAGE_SIZE_PRESETS.A4)
    expect(
      resolvePageCanvasSize({ ...emptyPageAtRuleApply(), sizePreset: 'letter' }),
    ).toEqual(PAGE_SIZE_PRESETS.letter)
  })

  it('resolves custom page size', () => {
    expect(
      resolvePageCanvasSize({
        ...emptyPageAtRuleApply(),
        sizePreset: 'custom',
        customWidth: { value: 20, unit: 'pt' },
        customHeight: { value: 30, unit: 'pt' },
      }),
    ).toEqual({ width: '20pt', height: '30pt' })
  })

  it('swaps dimensions for landscape orientation', () => {
    expect(
      resolvePageCanvasSize({
        ...emptyPageAtRuleApply(),
        sizePreset: 'A4',
        orientation: 'landscape',
      }),
    ).toEqual({ width: '297mm', height: '210mm' })
  })

  it('returns null for auto size without orientation', () => {
    expect(resolvePageCanvasSize(emptyPageAtRuleApply())).toBeNull()
    expect(isPageCanvasSized(emptyPageAtRuleApply())).toBe(false)
  })

  it('resolves print margin padding', () => {
    expect(
      resolvePageCanvasMarginPadding({
        ...emptyPageAtRuleApply(),
        margin: {
          top: { value: 20, unit: 'pt' },
          right: { value: 10, unit: 'pt' },
          bottom: { value: 20, unit: 'pt' },
          left: { value: 10, unit: 'pt' },
        },
      }),
    ).toEqual({
      top: '20pt',
      right: '10pt',
      bottom: '20pt',
      left: '10pt',
    })
  })

  it('syncPageCanvasLayout applies display-only styles without mutating innerHTML', () => {
    const html =
      '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'
    const el = document.createElement('div')
    el.innerHTML = '<div data-page><p>Hello</p></div>'

    syncPageCanvasLayout(el, html)

    expect(el.getAttribute(PAGE_SIZED_ATTR)).toBe('')
    expect(el.style.width).toBe('210mm')
    expect(el.style.minHeight).toBe('297mm')
    expect(el.style.paddingTop).toBe('20pt')
    expect(el.querySelector('[data-page] p')?.textContent).toBe('Hello')
    expect(el.querySelector('style[data-page-at-rule]')).toBeNull()
  })

  it('syncPageCanvasLayout clears styles for auto page size', () => {
    const html = '<div data-page><p>Hello</p></div>'
    const el = document.createElement('div')
    el.innerHTML = html
    el.setAttribute(PAGE_SIZED_ATTR, '')
    el.style.width = '210mm'
    el.style.minHeight = '297mm'
    el.style.paddingTop = '20pt'

    syncPageCanvasLayout(el, html)

    expect(el.hasAttribute(PAGE_SIZED_ATTR)).toBe(false)
    expect(el.style.width).toBe('')
    expect(el.style.minHeight).toBe('')
    expect(el.style.paddingTop).toBe('')
  })

  it('syncPageCanvasLayout sizes canvas from pageHtml when DOM has no style tag', () => {
    const pageHtml =
      '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'
    const el = document.createElement('div')
    el.innerHTML = '<div data-page><p>Hello</p></div>'

    syncPageCanvasLayout(el, pageHtml)

    expect(el.getAttribute(PAGE_SIZED_ATTR)).toBe('')
    expect(el.style.width).toBe('210mm')
    expect(el.querySelector('style[data-page-at-rule]')).toBeNull()
  })
})
