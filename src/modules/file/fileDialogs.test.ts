import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadHtml, saveHtml } from './fileDialogs'

type SaveHandle = {
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>
    close: () => Promise<void>
  }>
}

type OpenHandle = {
  getFile: () => Promise<File>
}

type PickerWindow = Window & {
  showSaveFilePicker?: (options?: unknown) => Promise<SaveHandle>
  showOpenFilePicker?: (options?: unknown) => Promise<OpenHandle[]>
}

function pickerWindow(): PickerWindow {
  return window
}

beforeEach(() => {
  delete pickerWindow().showSaveFilePicker
  delete pickerWindow().showOpenFilePicker
})

afterEach(() => {
  delete pickerWindow().showSaveFilePicker
  delete pickerWindow().showOpenFilePicker
  vi.restoreAllMocks()
})

describe('saveHtml', () => {
  it('writes through the save file picker when available', async () => {
    const write = vi.fn(async () => undefined)
    const close = vi.fn(async () => undefined)
    const showSaveFilePicker = vi.fn(async () => ({
      createWritable: async () => ({ write, close }),
    }))
    pickerWindow().showSaveFilePicker = showSaveFilePicker

    await saveHtml('<p>Hello</p>')

    expect(showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: 'document.html' }),
    )
    expect(write).toHaveBeenCalledWith('<p>Hello</p>')
    expect(close).toHaveBeenCalled()
  })

  it('ignores an aborted save picker', async () => {
    pickerWindow().showSaveFilePicker = vi.fn(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError')
    })

    await expect(saveHtml('<p>Hello</p>')).resolves.toBeUndefined()
  })

  it('downloads an html file when the save picker is unavailable', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: () => 'blob:mock',
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: () => undefined,
    })
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL')

    const createElement = document.createElement.bind(document)
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = createElement(tagName, options)
      if (tagName === 'a') {
        element.click = click
      }
      return element
    })

    await saveHtml('<p>Hello</p>', 'notes.html')

    expect(click).toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })
})

describe('loadHtml', () => {
  it('reads through the open file picker when available', async () => {
    const file = new File(['<p>From disk</p>'], 'doc.html', { type: 'text/html' })
    const showOpenFilePicker = vi.fn(async () => [
      { getFile: async () => file },
    ])
    pickerWindow().showOpenFilePicker = showOpenFilePicker

    await expect(loadHtml()).resolves.toBe('<p>From disk</p>')
    expect(showOpenFilePicker).toHaveBeenCalled()
  })

  it('unwraps standalone saved documents to the editable fragment', async () => {
    const standalone =
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Document</title></head>' +
      '<body><style data-page-at-rule></style><div data-page><p>From disk</p></div></body></html>'
    const file = new File([standalone], 'doc.html', { type: 'text/html' })
    pickerWindow().showOpenFilePicker = vi.fn(async () => [{ getFile: async () => file }])

    const opened = await loadHtml()
    expect(opened).toContain('<p>From disk</p>')
    expect(opened).not.toContain('<!DOCTYPE html>')
  })

  it('returns null when the open picker is aborted', async () => {
    pickerWindow().showOpenFilePicker = vi.fn(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError')
    })

    await expect(loadHtml()).resolves.toBeNull()
  })

  it('reads from a file input when the open picker is unavailable', async () => {
    const file = new File(['<p>Fallback</p>'], 'doc.html', { type: 'text/html' })
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = createElement(tagName, options)
      if (tagName === 'input') {
        queueMicrotask(() => {
          Object.defineProperty(element, 'files', { value: [file] })
          element.dispatchEvent(new Event('change'))
        })
      }
      return element
    })

    await expect(loadHtml()).resolves.toBe('<p>Fallback</p>')
  })
})
