export type HelpSearchEntry = {
  id: string
  title: string
  body: string
  keywords: string
}

export function tokenizeHelpQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

export function scoreHelpTopic(entry: HelpSearchEntry, query: string): number {
  const tokens = tokenizeHelpQuery(query)
  if (tokens.length === 0) return 1

  const title = entry.title.toLowerCase()
  const body = entry.body.toLowerCase()
  const keywords = entry.keywords.toLowerCase()
  const haystack = `${title} ${body} ${keywords}`

  let score = 0
  for (const token of tokens) {
    if (title.includes(token)) score += 30
    if (keywords.includes(token)) score += 20
    if (body.includes(token)) score += 10
    if (haystack.includes(token)) score += 5
  }
  return score
}

export function filterHelpTopics<T extends HelpSearchEntry>(
  entries: T[],
  query: string,
): T[] {
  const tokens = tokenizeHelpQuery(query)
  if (tokens.length === 0) return entries

  return entries
    .map((entry) => ({ entry, score: scoreHelpTopic(entry, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => entry)
}
