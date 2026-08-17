import { afterEach, describe, expect, it } from 'vitest'
import {
  TOOLBAR_POSITION_STORAGE_KEY,
  parseToolbarPosition,
  readToolbarPositionFromStorage,
  writeToolbarPositionToStorage,
} from './toolbarPositionPersistence'

describe('parseToolbarPosition', () => {
  it('accepts dock positions only', () => {
    expect(parseToolbarPosition('top')).toBe('top')
    expect(parseToolbarPosition('left')).toBe('left')
    expect(parseToolbarPosition('right')).toBe('right')
    expect(parseToolbarPosition('bottom')).toBe('bottom')
    expect(parseToolbarPosition(null)).toBeNull()
    expect(parseToolbarPosition('side')).toBeNull()
    expect(parseToolbarPosition(1)).toBeNull()
  })
})

describe('toolbar position localStorage', () => {
  afterEach(() => {
    localStorage.removeItem(TOOLBAR_POSITION_STORAGE_KEY)
  })

  it('reads and writes a position', () => {
    expect(readToolbarPositionFromStorage()).toBeNull()
    writeToolbarPositionToStorage('left')
    expect(readToolbarPositionFromStorage()).toBe('left')
    writeToolbarPositionToStorage('bottom')
    expect(readToolbarPositionFromStorage()).toBe('bottom')
  })

  it('returns null for invalid JSON', () => {
    localStorage.setItem(TOOLBAR_POSITION_STORAGE_KEY, '{')
    expect(readToolbarPositionFromStorage()).toBeNull()
  })
})
