import { en } from '../i18n/en'
import { es } from '../i18n/es'
import type { Locale, MessageKey } from '../i18n/types'
import type { CapabilityViolation } from './types'

const dictionaries = { en, es } as const

export function interpolateMessageParams(
  template: string,
  params: Record<string, string>,
): string {
  return Object.entries(params).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  )
}

export function formatCapabilityViolationMessage(
  violation: CapabilityViolation,
  locale: Locale = 'en',
): string {
  const messages = dictionaries[locale] ?? en
  const template = messages[violation.messageKey as MessageKey] ?? violation.messageKey
  return interpolateMessageParams(template, violation.messageParams)
}

export function formatCapabilityViolationLocation(
  violation: CapabilityViolation,
  locale: Locale = 'en',
): string {
  const messages = dictionaries[locale] ?? en
  const pageLabel = messages.capabilitiesViolationPage
  if (violation.selector) {
    return violation.pageIndex !== undefined
      ? `${violation.selector} (${pageLabel} ${violation.pageIndex + 1})`
      : violation.selector
  }
  if (violation.pageIndex !== undefined) {
    return `${pageLabel} ${violation.pageIndex + 1}`
  }
  return ''
}
