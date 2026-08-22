import { describe, expect, it } from 'vitest'
import {
  applyPageAtRule,
  emptyPageAtRuleApply,
  parsePageAtRuleCss,
  preservePageAtRuleInBody,
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

  it('preservePageAtRuleInBody re-applies a lost @page rule from previous html', () => {
    const previous =
      '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'
    const body = '<div data-page><p>Hello</p></div>'
    const preserved = preservePageAtRuleInBody(body, previous)
    expect(preserved).toContain('data-page-at-rule')
    expect(queryPageAtRule(preserved).sizePreset).toBe('A4')
  })

  it('preservePageAtRuleInBody leaves body unchanged when @page is still present', () => {
    const previous =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Hello</p></div>'
    const body =
      '<style data-page-at-rule>@page { size: letter; }</style><div data-page><p>Hello</p></div>'
    expect(preservePageAtRuleInBody(body, previous)).toBe(body)
  })

  it('preservePageAtRuleInBody leaves body unchanged when previous had no @page rule', () => {
    const body = '<div data-page><p>Hello</p></div>'
    expect(preservePageAtRuleInBody(body, '<p>Old</p>')).toBe(body)
  })
})
