export const TEMPLATE_TAG_ATTR = 'data-template-tag'

const TEMPLATE_SYNTAX = /\{\{/

export function isTemplateTagSpan(el: Element): el is HTMLSpanElement {
  return el instanceof HTMLSpanElement && el.hasAttribute(TEMPLATE_TAG_ATTR)
}

export function bodyContainsTemplateSyntax(html: string): boolean {
  return TEMPLATE_SYNTAX.test(html)
}

export function isTemplateSyntaxText(text: string): boolean {
  return TEMPLATE_SYNTAX.test(text)
}

export function createTemplateTagSpan(doc: Document, token: string): HTMLSpanElement {
  const span = doc.createElement('span')
  span.setAttribute(TEMPLATE_TAG_ATTR, '')
  span.textContent = token
  return span
}

/** True when live DOM still carries the template tokens and tag spans from stored HTML. */
export function templateMarkupPreserved(storedHtml: string, liveRoot: HTMLElement): boolean {
  if (!bodyContainsTemplateSyntax(storedHtml)) return true

  const storedTagCount = (storedHtml.match(/data-template-tag/g) ?? []).length
  const liveTagCount = liveRoot.querySelectorAll(`[${TEMPLATE_TAG_ATTR}]`).length
  if (storedTagCount > 0 && liveTagCount < storedTagCount) return false

  const storedTokens = storedHtml.match(/\{\{[^}]*\}\}/g) ?? []
  const liveText = liveRoot.textContent ?? ''
  return storedTokens.every((token) => liveText.includes(token))
}
