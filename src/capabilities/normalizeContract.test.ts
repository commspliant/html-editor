import { describe, expect, it } from 'vitest'
import { normalizeContract } from './normalizeContract'
import { COMMSPLIANT_EMAIL_CONTRACT } from './testContracts'

describe('normalizeContract', () => {
  it('indexes allowed and disallowed tags', () => {
    const rules = normalizeContract(COMMSPLIANT_EMAIL_CONTRACT)
    expect(rules.allowedTagSet?.has('table')).toBe(true)
    expect(rules.allowedTagSet?.has('video')).toBe(false)
    expect(rules.disallowedTagSet.has('video')).toBe(true)
    expect(rules.globalRules.stripUnknownTags).toBe(true)
    expect(rules.globalRules.maxContainerWidthPx).toBe(600)
  })

  it('indexes css property rules', () => {
    const rules = normalizeContract(COMMSPLIANT_EMAIL_CONTRACT)
    expect(rules.cssPropertyRules.get('position')?.status).toBe('disallowed')
    expect(rules.cssPropertyRules.get('padding')?.allowedOnTags).toEqual(['td'])
  })
})
