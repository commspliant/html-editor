import { describe, expect, it } from 'vitest'
import {
  applyPageAtRule,
  emptyPageAtRuleApply,
  extractPageAtRuleCss,
  parsePageAtRuleCss,
  preservePageAtRuleInBody,
  queryPageAtRule,
  resetPageAtRule,
  serializePageAtRuleCss,
  stripPageAtRuleFromHtml,
} from './pageAtRule'

describe('pageAtRule', () => {
  it('round-trips A4 with portrait orientation', () => {
    const draft = {
      ...emptyPageAtRuleApply(),
      sizePreset: 'A4' as const,
      orientation: 'portrait' as const,
    }
    const css = serializePageAtRuleCss(draft)
    expect(css).toContain('size: A4 portrait')
    expect(parsePageAtRuleCss(css)).toMatchObject({
      sizePreset: 'A4',
      orientation: 'portrait',
    })
  })

  it('round-trips A4 with landscape orientation', () => {
    const draft = {
      ...emptyPageAtRuleApply(),
      sizePreset: 'A4' as const,
      orientation: 'landscape' as const,
    }
    const css = serializePageAtRuleCss(draft)
    expect(css).toContain('size: A4 landscape')
    expect(parsePageAtRuleCss(css)).toMatchObject({
      sizePreset: 'A4',
      orientation: 'landscape',
    })
  })

  it('preservePageAtRuleInBody keeps A4 portrait when re-applying from previous html', () => {
    const previous =
      '<style data-page-at-rule>@page { size: A4 portrait; }</style><div data-page><p>Hello</p></div>'
    const body = '<div data-page><p>Hello</p></div>'
    const preserved = preservePageAtRuleInBody(body, previous)
    expect(preserved).toContain('size: A4 portrait')
    expect(queryPageAtRule(preserved)).toMatchObject({
      sizePreset: 'A4',
      orientation: 'portrait',
    })
  })

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

  it('stripPageAtRuleFromHtml removes the style tag but keeps page body', () => {
    const html =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Hello</p></div>'
    const stripped = stripPageAtRuleFromHtml(html)
    expect(stripped).not.toContain('data-page-at-rule')
    expect(stripped).toContain('<div data-page>')
    expect(stripped).toContain('<p>Hello</p>')
    expect(extractPageAtRuleCss(html)).toContain('size: A4')
  })

  it('preservePageAtRuleInBody re-applies when body lost the style tag on input', () => {
    const previous =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Hello</p></div>'
    const body = '<div data-page><p>Hello</p></div>'
    const preserved = preservePageAtRuleInBody(body, previous)
    expect(preserved).toContain('data-page-at-rule')
    expect(queryPageAtRule(preserved).sizePreset).toBe('A4')
  })
})
