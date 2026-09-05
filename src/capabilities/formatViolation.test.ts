import { describe, expect, it } from 'vitest'
import { formatCapabilityViolationMessage } from './formatViolation'
import type { CapabilityViolation } from './types'

const disallowedTagViolation: CapabilityViolation = {
  code: 'disallowed-tag',
  severity: 'error',
  messageKey: 'capabilitiesViolationDisallowedTag',
  messageParams: { tag: 'video' },
}

describe('formatCapabilityViolationMessage', () => {
  it('interpolates violation params in English', () => {
    expect(formatCapabilityViolationMessage(disallowedTagViolation, 'en')).toBe(
      'Disallowed element: <video>',
    )
  })

  it('interpolates violation params in Spanish', () => {
    expect(formatCapabilityViolationMessage(disallowedTagViolation, 'es')).toBe(
      'Elemento no permitido: <video>',
    )
  })
})
