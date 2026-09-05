import { parseAllowedOnTagsFromRestrictions } from './inlineStyle'
import type {
  AllowedTagRule,
  CssPropertyRuleSource,
  NormalizedContract,
  NormalizedCssPropertyRule,
  RenderingCapabilities,
  TagRule,
} from './types'

function normalizeTagRule(entry: AllowedTagRule): TagRule {
  return {
    tag: entry.tag.toLowerCase(),
    requiredAttributes: { ...(entry.required_attributes ?? {}) },
    allowedAttributes: entry.allowed_attributes
      ? entry.allowed_attributes.map((name) => name.toLowerCase())
      : null,
    disallowedCss: (entry.disallowed_css ?? []).map((name) => name.toLowerCase()),
    forcedCss: Object.fromEntries(
      Object.entries(entry.forced_css ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
    ),
    defaultAttributes: { ...(entry.default_attributes ?? {}) },
    status: entry.status,
    notes: entry.notes,
  }
}

function normalizeCssPropertyRule(entry: CssPropertyRuleSource): NormalizedCssPropertyRule {
  const allowedOnTags =
    entry.allowed_on_tags?.map((tag) => tag.toLowerCase()) ??
    parseAllowedOnTagsFromRestrictions(entry.restrictions)

  return {
    property: entry.property.toLowerCase(),
    status: entry.status,
    allowedValues: entry.allowed_values ?? null,
    disallowedValues: entry.disallowed_values ?? null,
    allowedOnTags,
    restrictions: entry.restrictions,
    fallback: entry.fallback ?? null,
  }
}

export function normalizeContract(contract: RenderingCapabilities): NormalizedContract {
  const allowedEntries = contract.html_elements?.allowed_tags ?? []
  const allowedTagSet =
    allowedEntries.length > 0
      ? new Set(allowedEntries.map((entry) => entry.tag.toLowerCase()))
      : null

  const disallowedTagSet = new Set(
    (contract.html_elements?.disallowed_tags ?? []).map((tag) => tag.toLowerCase()),
  )

  const tagRules = new Map<string, TagRule>()
  for (const entry of allowedEntries) {
    tagRules.set(entry.tag.toLowerCase(), normalizeTagRule(entry))
  }

  const cssPropertyRules = new Map<string, NormalizedCssPropertyRule>()
  for (const entry of contract.css_properties ?? []) {
    cssPropertyRules.set(entry.property.toLowerCase(), normalizeCssPropertyRule(entry))
  }

  const global = contract.global_rules ?? {}

  return {
    allowedTagSet,
    disallowedTagSet,
    tagRules,
    cssPropertyRules,
    globalRules: {
      layoutMode: global.layout_mode,
      requireInlining: global.require_inlining,
      maxContainerWidthPx: global.max_container_width_px,
      stripUnknownTags: global.strip_unknown_tags ?? false,
      stripUnknownAttributes: global.strip_unknown_attributes ?? false,
    },
  }
}
