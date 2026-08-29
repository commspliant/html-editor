import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
  const objectUrls = new Map<string, string>()
  let nextObjectUrlId = 0
  URL.createObjectURL = (blob: Blob) => {
    const url = `blob:test/${nextObjectUrlId++}`
    objectUrls.set(url, blob.type)
    return url
  }
  URL.revokeObjectURL = (url: string) => {
    objectUrls.delete(url)
  }
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.toDataURL = function (type?: string) {
    if (type === 'image/webp') return 'data:,'
    return 'data:image/png;base64,'
  }
}

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
