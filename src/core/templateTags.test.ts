import { describe, expect, it } from 'vitest'
import {
  TEMPLATE_TAG_ATTR,
  createTemplateTagSpan,
  isTemplateSyntaxText,
  templateMarkupPreserved,
} from './templateTags'

describe('templateTags', () => {
  it('detects template syntax in text', () => {
    expect(isTemplateSyntaxText('{{for items}}')).toBe(true)
    expect(isTemplateSyntaxText('plain')).toBe(false)
  })

  it('creates a span with the template tag attribute', () => {
    const span = createTemplateTagSpan(document, '{{customer.name}}')
    expect(span.getAttribute(TEMPLATE_TAG_ATTR)).toBe('')
    expect(span.textContent).toBe('{{customer.name}}')
  })

  it('detects when template markup was lost during visual sync', () => {
    const stored =
      '<p>Hello <span data-template-tag="">{{for items}}world{{endfor}}</span></p>'
    const root = document.createElement('div')
    root.innerHTML = '<p>Hello world</p>'
    expect(templateMarkupPreserved(stored, root)).toBe(false)

    root.innerHTML = stored
    expect(templateMarkupPreserved(stored, root)).toBe(true)
  })
})
