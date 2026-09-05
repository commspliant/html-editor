import {
  cssValueUsesFormat,
  parseInlineStyle,
} from './inlineStyle'
import { normalizeContract } from './normalizeContract'
import type {
  CapabilityValidationResult,
  CapabilityViolation,
  NormalizedContract,
  RenderingCapabilities,
} from './types'

function buildSelector(element: Element): string {
  const parts: string[] = []
  let current: Element | null = element
  while (current && current.tagName.toLowerCase() !== 'body') {
    const tag = current.tagName.toLowerCase()
    const parent: Element | null = current.parentElement
    if (!parent) {
      parts.unshift(tag)
      break
    }
    const siblings = [...parent.children].filter((child) => child.tagName === current!.tagName)
    const index = siblings.indexOf(current)
    parts.unshift(`${tag}:nth-of-type(${index + 1})`)
    current = parent
  }
  return parts.join(' > ')
}

function pushViolation(
  violations: CapabilityViolation[],
  violation: CapabilityViolation,
): void {
  violations.push(violation)
}

function validateTagName(
  element: Element,
  rules: NormalizedContract,
  violations: CapabilityViolation[],
  pageIndex?: number,
): void {
  const tag = element.tagName.toLowerCase()
  const selector = buildSelector(element)

  if (rules.disallowedTagSet.has(tag)) {
    pushViolation(violations, {
      code: 'disallowed-tag',
      severity: 'error',
      messageKey: 'capabilitiesViolationDisallowedTag',
      messageParams: { tag },
      selector,
      tag,
      pageIndex,
    })
    return
  }

  if (rules.globalRules.stripUnknownTags && rules.allowedTagSet && !rules.allowedTagSet.has(tag)) {
    pushViolation(violations, {
      code: 'unknown-tag',
      severity: 'error',
      messageKey: 'capabilitiesViolationUnknownTag',
      messageParams: { tag },
      selector,
      tag,
      pageIndex,
    })
  }

  const tagRule = rules.tagRules.get(tag)
  if (tagRule?.status === 'restricted') {
    pushViolation(violations, {
      code: 'restricted-tag',
      severity: 'warning',
      messageKey: 'capabilitiesViolationRestrictedTag',
      messageParams: { tag },
      selector,
      tag,
      pageIndex,
    })
  }
}

function validateAttributes(
  element: Element,
  rules: NormalizedContract,
  violations: CapabilityViolation[],
  pageIndex?: number,
): void {
  const tag = element.tagName.toLowerCase()
  const tagRule = rules.tagRules.get(tag)
  const selector = buildSelector(element)

  if (tagRule?.requiredAttributes) {
    for (const [name, expected] of Object.entries(tagRule.requiredAttributes)) {
      const actual = element.getAttribute(name)
      if (actual === null || actual !== expected) {
        pushViolation(violations, {
          code: 'missing-required-attribute',
          severity: 'error',
          messageKey: 'capabilitiesViolationMissingRequiredAttribute',
          messageParams: { tag, attribute: name, expected },
          selector,
          tag,
          attribute: name,
          pageIndex,
        })
      }
    }
  }

  if (!rules.globalRules.stripUnknownAttributes || !tagRule?.allowedAttributes) return

  const allowed = new Set(tagRule.allowedAttributes)
  for (const attr of [...element.attributes]) {
    const name = attr.name.toLowerCase()
    if (name === 'style') continue
    if (!allowed.has(name)) {
      pushViolation(violations, {
        code: 'unknown-attribute',
        severity: 'error',
        messageKey: 'capabilitiesViolationUnknownAttribute',
        messageParams: { tag, attribute: name },
        selector,
        tag,
        attribute: name,
        pageIndex,
      })
    }
  }
}

function validateCssValue(
  _property: string,
  value: string,
  cssRule: NonNullable<ReturnType<NormalizedContract['cssPropertyRules']['get']>>,
): boolean {
  if (cssRule.disallowedValues) {
    for (const format of cssRule.disallowedValues) {
      if (cssValueUsesFormat(value, format)) return false
    }
  }
  if (cssRule.allowedValues && cssRule.allowedValues.length > 0) {
    const matchesAllowed = cssRule.allowedValues.some((format) => cssValueUsesFormat(value, format))
    if (!matchesAllowed && !cssRule.allowedValues.includes(value)) {
      const literalMatch = cssRule.allowedValues.some(
        (allowed) => value.toLowerCase().includes(allowed.toLowerCase()),
      )
      if (!literalMatch) return false
    }
  }
  return true
}

function validateInlineStyles(
  element: Element,
  rules: NormalizedContract,
  violations: CapabilityViolation[],
  pageIndex?: number,
): void {
  const tag = element.tagName.toLowerCase()
  const tagRule = rules.tagRules.get(tag)
  const selector = buildSelector(element)
  const styleAttr = element.getAttribute('style')
  if (!styleAttr) {
    if (tagRule?.forcedCss) {
      for (const property of Object.keys(tagRule.forcedCss)) {
        pushViolation(violations, {
          code: 'missing-forced-css',
          severity: 'warning',
          messageKey: 'capabilitiesViolationMissingForcedCss',
          messageParams: { tag, property, expected: tagRule.forcedCss[property] },
          selector,
          tag,
          cssProperty: property,
          pageIndex,
        })
      }
    }
    return
  }

  const styles = parseInlineStyle(styleAttr)

  if (tagRule?.disallowedCss) {
    for (const property of tagRule.disallowedCss) {
      if (styles.has(property)) {
        pushViolation(violations, {
          code: 'tag-disallowed-css',
          severity: 'error',
          messageKey: 'capabilitiesViolationTagDisallowedCss',
          messageParams: { tag, property },
          selector,
          tag,
          cssProperty: property,
          pageIndex,
        })
      }
    }
  }

  if (tagRule?.forcedCss) {
    for (const [property, expected] of Object.entries(tagRule.forcedCss)) {
      const actual = styles.get(property)
      if (!actual || actual.replace(/\s+/g, '').toLowerCase() !== expected.replace(/\s+/g, '').toLowerCase()) {
        pushViolation(violations, {
          code: 'missing-forced-css',
          severity: 'warning',
          messageKey: 'capabilitiesViolationMissingForcedCss',
          messageParams: { tag, property, expected },
          selector,
          tag,
          cssProperty: property,
          pageIndex,
        })
      }
    }
  }

  for (const [property, value] of styles.entries()) {
    const cssRule = rules.cssPropertyRules.get(property)
    if (!cssRule) continue

    if (cssRule.allowedOnTags && !cssRule.allowedOnTags.includes(tag)) {
      pushViolation(violations, {
        code: 'css-wrong-tag',
        severity: cssRule.status === 'disallowed' ? 'error' : 'warning',
        messageKey: 'capabilitiesViolationCssWrongTag',
        messageParams: { property, tag, allowedTags: cssRule.allowedOnTags.join(', ') },
        selector,
        tag,
        cssProperty: property,
        pageIndex,
      })
      continue
    }

    if (cssRule.status === 'disallowed') {
      pushViolation(violations, {
        code: 'css-disallowed',
        severity: 'error',
        messageKey: 'capabilitiesViolationCssDisallowed',
        messageParams: { property },
        selector,
        tag,
        cssProperty: property,
        pageIndex,
      })
      continue
    }

    if (!validateCssValue(property, value, cssRule)) {
      pushViolation(violations, {
        code: 'css-value-not-allowed',
        severity: 'error',
        messageKey: 'capabilitiesViolationCssValueNotAllowed',
        messageParams: { property, value },
        selector,
        tag,
        cssProperty: property,
        pageIndex,
      })
      continue
    }

    if (cssRule.status === 'restricted' || cssRule.status === 'allowed_with_degradation') {
      pushViolation(violations, {
        code: 'css-restricted',
        severity: 'warning',
        messageKey: 'capabilitiesViolationCssRestricted',
        messageParams: { property },
        selector,
        tag,
        cssProperty: property,
        pageIndex,
      })
    }
  }
}

function validateContainerWidth(
  doc: Document,
  rules: NormalizedContract,
  violations: CapabilityViolation[],
  pageIndex?: number,
): void {
  const maxWidth = rules.globalRules.maxContainerWidthPx
  if (!maxWidth) return

  const candidates = [
    ...doc.body.querySelectorAll('table[width], table[style*="width"]'),
    ...doc.body.querySelectorAll('div[style*="max-width"], div[style*="width"]'),
  ]

  for (const element of candidates) {
    const widthAttr = element.getAttribute('width')
    const style = parseInlineStyle(element.getAttribute('style') ?? '')
    const widthValue = widthAttr ?? style.get('width') ?? style.get('max-width')
    if (!widthValue) continue
    const numeric = Number.parseInt(widthValue, 10)
    if (Number.isFinite(numeric) && numeric > maxWidth) {
      pushViolation(violations, {
        code: 'container-width-exceeded',
        severity: 'warning',
        messageKey: 'capabilitiesViolationContainerWidthExceeded',
        messageParams: { width: String(numeric), max: String(maxWidth) },
        selector: buildSelector(element),
        tag: element.tagName.toLowerCase(),
        pageIndex,
      })
    }
  }
}

function validateDocumentTree(
  root: ParentNode,
  rules: NormalizedContract,
  violations: CapabilityViolation[],
  pageIndex?: number,
): void {
  const elements =
    root instanceof Element
      ? root.tagName.toLowerCase() === 'body'
        ? [...root.children]
        : [root, ...root.querySelectorAll('*')]
      : [...root.querySelectorAll('*')]
  for (const element of elements) {
    if (!(element instanceof Element)) continue
    validateTagName(element, rules, violations, pageIndex)
    validateAttributes(element, rules, violations, pageIndex)
    validateInlineStyles(element, rules, violations, pageIndex)
  }
}

function summarize(violations: CapabilityViolation[]): CapabilityValidationResult {
  const errorCount = violations.filter((v) => v.severity === 'error').length
  const warningCount = violations.filter((v) => v.severity === 'warning').length
  return {
    valid: errorCount === 0,
    errorCount,
    warningCount,
    violations,
  }
}

export function validateHtmlAgainstCapabilities(
  html: string,
  contract: RenderingCapabilities,
  options?: { pageIndex?: number },
): CapabilityValidationResult {
  const rules = normalizeContract(contract)
  const trimmed = html.trim()
  if (!trimmed) {
    return { valid: true, errorCount: 0, warningCount: 0, violations: [] }
  }

  const doc = new DOMParser().parseFromString(`<body>${trimmed}</body>`, 'text/html')
  const violations: CapabilityViolation[] = []
  validateDocumentTree(doc.body, rules, violations, options?.pageIndex)
  validateContainerWidth(doc, rules, violations, options?.pageIndex)
  return summarize(violations)
}

export function validatePagesAgainstCapabilities(
  pages: string[],
  contract: RenderingCapabilities,
): CapabilityValidationResult {
  const allViolations: CapabilityViolation[] = []
  pages.forEach((page, pageIndex) => {
    const result = validateHtmlAgainstCapabilities(page, contract, { pageIndex })
    allViolations.push(...result.violations)
  })
  return summarize(allViolations)
}
