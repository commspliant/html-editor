import { describe, expect, it } from 'vitest'
import { isPageLayoutAllowed } from './isPageLayoutAllowed'
import { COMMSPLIANT_EMAIL_CONTRACT, PERMISSIVE_WEB_CONTRACT } from './testContracts'

describe('isPageLayoutAllowed', () => {
  it('returns false for the email contract', () => {
    expect(isPageLayoutAllowed(COMMSPLIANT_EMAIL_CONTRACT)).toBe(false)
  })

  it('returns true for the permissive web contract', () => {
    expect(isPageLayoutAllowed(PERMISSIVE_WEB_CONTRACT)).toBe(true)
  })

  it('returns false when style is unknown and strip_unknown_tags is true', () => {
    expect(
      isPageLayoutAllowed({
        global_rules: { strip_unknown_tags: true },
        html_elements: { allowed_tags: [{ tag: 'p', allowed_attributes: ['style'] }] },
      }),
    ).toBe(false)
  })
})
