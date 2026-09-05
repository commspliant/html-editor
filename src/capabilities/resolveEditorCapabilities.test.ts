import { describe, expect, it } from 'vitest'
import { resolveEditorCapabilities } from './resolveEditorCapabilities'
import { COMMSPLIANT_EMAIL_CONTRACT, PERMISSIVE_WEB_CONTRACT } from './testContracts'

describe('resolveEditorCapabilities', () => {
  it('hides email-incompatible toolbar items from email contract', () => {
    const profile = resolveEditorCapabilities(COMMSPLIANT_EMAIL_CONTRACT)
    expect(profile.pageLayoutAllowed).toBe(false)
    expect(profile.hiddenToolbarItemIds.has('audio')).toBe(true)
    expect(profile.hiddenToolbarItemIds.has('youtube')).toBe(true)
    expect(profile.hiddenToolbarItemIds.has('bulletList')).toBe(true)
    expect(profile.hiddenToolbarItemIds.has('customCss')).toBe(true)
    expect(profile.allowedParagraphTags).toEqual(['p'])
    expect(profile.allowedFontFamilies).toContain('Arial')
  })

  it('shows more features for permissive web contract', () => {
    const profile = resolveEditorCapabilities(PERMISSIVE_WEB_CONTRACT)
    expect(profile.pageLayoutAllowed).toBe(true)
    expect(profile.hiddenToolbarItemIds.has('audio')).toBe(false)
    expect(profile.hiddenToolbarItemIds.has('youtube')).toBe(false)
    expect(profile.hiddenToolbarItemIds.has('bulletList')).toBe(false)
    expect(profile.allowedParagraphTags).toContain('h1')
  })
})
