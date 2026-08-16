import type { MessageKey } from '../i18n/types'

type Translate = (key: MessageKey) => string

type ChromeCopy = {
  label?: string
  labelKey?: MessageKey
  ariaLabel?: string
  ariaKey?: MessageKey
}

export function resolveChromeLabel(t: Translate, def: ChromeCopy | undefined): string {
  if (!def) return ''
  if (def.label) return def.label
  if (def.labelKey) return t(def.labelKey)
  return ''
}

export function resolveChromeAria(t: Translate, def: ChromeCopy | undefined): string {
  if (!def) return ''
  if (def.ariaLabel) return def.ariaLabel
  if (def.ariaKey) return t(def.ariaKey)
  return resolveChromeLabel(t, def)
}
