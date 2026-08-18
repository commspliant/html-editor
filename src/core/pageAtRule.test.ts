import { describe, expect, it } from 'vitest'
import {
  applyPageAtRule,
  emptyPageAtRuleApply,
  parsePageAtRuleCss,
  queryPageAtRule,
  resetPageAtRule,
  serializePageAtRuleCss,
} from './pageAtRule'

describe('pageAtRule', () => {
  it('serializes and parses size and margins', () => {
    const draft = {
      ...emptyPageAtRuleApply(),
      sizePreset: 'A4' as const,
      margin: {
        top: { value: 20, unit: 'pt' as const },
        right: { value: 20, unit: 'pt' as const },
        bottom: { value: 20, unit: 'pt' as const },
        left: { value: 20, unit: 'pt' as const },
      },
    }
    const css = serializePageAtRuleCss(draft)
    expect(css).toContain('size: A4')
    expect(css).toContain('margin: 20pt')
    expect(parsePageAtRuleCss(css)).toMatchObject({
      sizePreset: 'A4',
      margin: draft.margin,
    })
  })

  it('applies and resets @page style in page html', () => {
    const html = '<div data-page><p>Hello</p></div>'
    const withRule = applyPageAtRule(html, {
      ...emptyPageAtRuleApply(),
      sizePreset: 'letter',
    })
    expect(withRule).toContain('data-page-at-rule')
    expect(queryPageAtRule(withRule).sizePreset).toBe('letter')
    expect(resetPageAtRule(withRule)).toContain('<div data-page')
    expect(resetPageAtRule(withRule)).toContain('<p>Hello</p>')
  })
})
