import { afterEach, describe, expect, it } from 'vitest'
import {
  DARK_MODE_STORAGE_KEY,
  parseDarkMode,
  readDarkModeFromStorage,
  writeDarkModeToStorage,
} from './darkModePersistence'

describe('parseDarkMode', () => {
  it('accepts booleans only', () => {
    expect(parseDarkMode(true)).toBe(true)
    expect(parseDarkMode(false)).toBe(false)
    expect(parseDarkMode(null)).toBeNull()
    expect(parseDarkMode('true')).toBeNull()
    expect(parseDarkMode(1)).toBeNull()
  })

  it('does not proto-merge JSON objects (WE-026)', () => {
    const value = JSON.parse('{"__proto__":{"polluted":true}}') as unknown
    expect(parseDarkMode(value)).toBeNull()
    expect(Object.prototype).not.toHaveProperty('polluted')
  })
})

describe('dark mode localStorage', () => {
  afterEach(() => {
    localStorage.removeItem(DARK_MODE_STORAGE_KEY)
  })

  it('reads and writes a boolean', () => {
    expect(readDarkModeFromStorage()).toBeNull()
    writeDarkModeToStorage(true)
    expect(readDarkModeFromStorage()).toBe(true)
    writeDarkModeToStorage(false)
    expect(readDarkModeFromStorage()).toBe(false)
  })

  it('returns null for invalid JSON', () => {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, '{')
    expect(readDarkModeFromStorage()).toBeNull()
  })
})
