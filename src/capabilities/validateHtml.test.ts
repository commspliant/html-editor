import { describe, expect, it } from 'vitest'
import { validateHtmlAgainstCapabilities } from './validateHtml'
import { COMMSPLIANT_EMAIL_CONTRACT, PERMISSIVE_WEB_CONTRACT } from './testContracts'

describe('validateHtmlAgainstCapabilities', () => {
  it('flags disallowed tags', () => {
    const result = validateHtmlAgainstCapabilities('<video src="x"></video>', COMMSPLIANT_EMAIL_CONTRACT)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.code === 'disallowed-tag' && v.tag === 'video')).toBe(true)
  })

  it('flags unknown tags when strip_unknown_tags is true', () => {
    const result = validateHtmlAgainstCapabilities('<section>Hi</section>', COMMSPLIANT_EMAIL_CONTRACT)
    expect(result.violations.some((v) => v.code === 'unknown-tag')).toBe(true)
  })

  it('flags disallowed css properties', () => {
    const result = validateHtmlAgainstCapabilities(
      '<span style="position: absolute">Hi</span>',
      COMMSPLIANT_EMAIL_CONTRACT,
    )
    expect(result.violations.some((v) => v.code === 'css-disallowed')).toBe(true)
  })

  it('flags padding on non-td elements', () => {
    const result = validateHtmlAgainstCapabilities(
      '<p style="padding: 10px">Hi</p>',
      COMMSPLIANT_EMAIL_CONTRACT,
    )
    expect(result.violations.some((v) => v.code === 'css-wrong-tag')).toBe(true)
  })

  it('passes permissive contract for video and headings', () => {
    const html = '<h1>Title</h1><video src="x"></video>'
    const email = validateHtmlAgainstCapabilities(html, COMMSPLIANT_EMAIL_CONTRACT)
    const web = validateHtmlAgainstCapabilities(html, PERMISSIVE_WEB_CONTRACT)
    expect(email.valid).toBe(false)
    expect(web.errorCount).toBe(0)
  })

  it('does not flag the synthetic body wrapper', () => {
    const result = validateHtmlAgainstCapabilities('<p>Hi</p>', COMMSPLIANT_EMAIL_CONTRACT)
    expect(result.violations.some((v) => v.tag === 'body')).toBe(false)
  })
})
