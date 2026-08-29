import { describe, expect, it } from 'vitest'
import { filterHelpTopics, scoreHelpTopic } from './search'

const entries = [
  {
    id: 'insertTable',
    title: 'How do I insert a table?',
    body: 'Open Insert → Table.',
    keywords: 'table grid insert',
  },
  {
    id: 'printDocument',
    title: 'How do I print my document?',
    body: 'Open File → Print.',
    keywords: 'print hard copy',
  },
]

describe('scoreHelpTopic', () => {
  it('returns a positive score for matching tokens', () => {
    expect(scoreHelpTopic(entries[0], 'table')).toBeGreaterThan(0)
  })

  it('returns zero when nothing matches', () => {
    expect(scoreHelpTopic(entries[0], 'audio')).toBe(0)
  })

  it('returns a baseline score for an empty query', () => {
    expect(scoreHelpTopic(entries[0], '')).toBe(1)
  })
})

describe('filterHelpTopics', () => {
  it('returns all topics for an empty query', () => {
    expect(filterHelpTopics(entries, '')).toHaveLength(2)
  })

  it('filters and ranks by relevance', () => {
    const results = filterHelpTopics(entries, 'print')
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('printDocument')
  })

  it('matches Spanish keywords when provided in entries', () => {
    const spanish = [
      {
        id: 'insertTable',
        title: '¿Cómo inserto una tabla?',
        body: 'Abra Insertar → Tabla.',
        keywords: 'tabla cuadrícula insertar',
      },
    ]
    const results = filterHelpTopics(spanish, 'tabla')
    expect(results).toHaveLength(1)
  })
})
