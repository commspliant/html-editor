import { normalizeContract } from './normalizeContract'
import type { NormalizedContract, RenderingCapabilities } from './types'

function isStyleTagAllowed(rules: NormalizedContract): boolean {
  const tag = 'style'
  if (rules.disallowedTagSet.has(tag)) return false
  if (
    rules.globalRules.stripUnknownTags &&
    rules.allowedTagSet &&
    !rules.allowedTagSet.has(tag)
  ) {
    return false
  }
  return true
}

export function isPageLayoutAllowed(contract: RenderingCapabilities): boolean {
  const rules = normalizeContract(contract)
  if (rules.globalRules.layoutMode === 'table-based') return false
  return isStyleTagAllowed(rules)
}
