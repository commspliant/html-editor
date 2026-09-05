export function parseInlineStyle(style: string): Map<string, string> {
  const result = new Map<string, string>()
  for (const chunk of style.split(';')) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    const colon = trimmed.indexOf(':')
    if (colon <= 0) continue
    const property = trimmed.slice(0, colon).trim().toLowerCase()
    const value = trimmed.slice(colon + 1).trim()
    if (property) result.set(property, value)
  }
  return result
}

export function serializeInlineStyle(styles: Map<string, string>): string {
  return [...styles.entries()].map(([property, value]) => `${property}: ${value}`).join('; ')
}

export function normalizeCssPropertyName(property: string): string {
  return property.trim().toLowerCase()
}

export function cssValueUsesFormat(value: string, format: string): boolean {
  const lower = value.toLowerCase()
  switch (format) {
    case 'hex':
      return /#([0-9a-f]{3}|[0-9a-f]{6})\b/i.test(lower)
    case 'rgb':
      return /\brgb\s*\(/i.test(lower)
    case 'rgba':
      return /\brgba\s*\(/i.test(lower)
    case 'hsl':
      return /\bhsl\s*\(/i.test(lower) && !/\bhsla\s*\(/i.test(lower)
    case 'hsla':
      return /\bhsla\s*\(/i.test(lower)
    case 'flex':
      return /\bflex\b/i.test(lower)
    case 'inline-flex':
      return /\binline-flex\b/i.test(lower)
    case 'grid':
      return /\bgrid\b/i.test(lower) && !/\binline-grid\b/i.test(lower)
    case 'inline-grid':
      return /\binline-grid\b/i.test(lower)
    case 'contents':
      return /\bcontents\b/i.test(lower)
    case 'block':
      return /\bblock\b/i.test(lower)
    case 'inline-block':
      return /\binline-block\b/i.test(lower)
    case 'none':
      return /\bnone\b/i.test(lower)
    default:
      return lower.includes(format.toLowerCase())
  }
}

export function parseAllowedOnTagsFromRestrictions(restrictions?: string): string[] | null {
  if (!restrictions) return null
  const matches = [...restrictions.matchAll(/<([a-z][a-z0-9]*)\s*>/gi)]
  if (matches.length === 0) return null
  return matches.map((match) => match[1].toLowerCase())
}
