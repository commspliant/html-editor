import { describe, expect, it } from 'vitest'
import { parsePageZoom, readPageZoomFromStorage, writePageZoomToStorage } from './pageZoomPersistence'

describe('pageZoomPersistence', () => {
  it('parses zoom presets', () => {
    expect(parsePageZoom('fitWidth')).toBe('fitWidth')
    expect(parsePageZoom(100)).toBe(100)
    expect(parsePageZoom('invalid')).toBeNull()
  })

  it('does not proto-merge JSON objects (WE-026)', () => {
    const value = JSON.parse('{"__proto__":{"polluted":true}}') as unknown
    expect(parsePageZoom(value)).toBeNull()
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('writes and reads from localStorage', () => {
    writePageZoomToStorage(125)
    expect(readPageZoomFromStorage()).toBe(125)
    writePageZoomToStorage('fitPage')
    expect(readPageZoomFromStorage()).toBe('fitPage')
  })
})
