import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

const storage = new Map<string, string>()

beforeEach(() => {
  const mockStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    },
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: mockStorage,
  })
})

afterEach(() => {
  cleanup()
  storage.clear()
})
