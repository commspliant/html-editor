import type { FeatureFootprint } from './featureFootprint'
import type { NormalizedContract } from './types'

function isTagAllowed(tag: string, rules: NormalizedContract): boolean {
  const normalized = tag.toLowerCase()
  if (rules.disallowedTagSet.has(normalized)) return false
  if (rules.globalRules.stripUnknownTags && rules.allowedTagSet && !rules.allowedTagSet.has(normalized)) {
    return false
  }
  return true
}

function areAttributesAllowed(
  tag: string,
  names: string[],
  rules: NormalizedContract,
): boolean {
  if (!rules.globalRules.stripUnknownAttributes) return true
  const tagRule = rules.tagRules.get(tag.toLowerCase())
  if (!tagRule?.allowedAttributes) return true
  const allowed = new Set(tagRule.allowedAttributes)
  return names.every((name) => allowed.has(name.toLowerCase()))
}

function isCssPropertyAllowedForFeature(
  property: string,
  rules: NormalizedContract,
  tagContext?: string,
): boolean {
  const normalized = property.toLowerCase()
  const cssRule = rules.cssPropertyRules.get(normalized)
  if (!cssRule) return true

  if (cssRule.status === 'disallowed') return false

  if (cssRule.allowedOnTags && tagContext) {
    if (!cssRule.allowedOnTags.includes(tagContext.toLowerCase())) return false
  }

  if (cssRule.status === 'restricted') return false

  return true
}

function isWildcardCssAllowed(rules: NormalizedContract): boolean {
  for (const cssRule of rules.cssPropertyRules.values()) {
    if (cssRule.status === 'disallowed') return false
  }
  return true
}

export function isFeatureAllowed(
  footprint: FeatureFootprint | undefined,
  rules: NormalizedContract,
): boolean {
  if (!footprint) return true

  if (footprint.tags) {
    for (const tag of footprint.tags) {
      if (!isTagAllowed(tag, rules)) return false
    }
  }

  if (footprint.attributes) {
    for (const entry of footprint.attributes) {
      if (!isTagAllowed(entry.tag, rules)) return false
      if (!areAttributesAllowed(entry.tag, entry.names, rules)) return false
    }
  }

  if (footprint.cssProperties) {
    if (footprint.cssProperties.includes('*')) {
      if (!isWildcardCssAllowed(rules)) return false
    } else {
      for (const property of footprint.cssProperties) {
        if (!isCssPropertyAllowedForFeature(property, rules)) return false
      }
    }
  }

  return true
}

export function isDialogTabAllowed(
  dialog: 'paragraph' | 'page',
  tab: string,
  rules: NormalizedContract,
  tabFootprints: Record<string, FeatureFootprint>,
): boolean {
  const footprint = tabFootprints[tab]
  if (!footprint) return true
  return isFeatureAllowed(footprint, rules)
}
