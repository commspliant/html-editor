import { describe, expect, it } from 'vitest'
import { dataTransferHasFiles, findDroppedHtmlFile, isHtmlFile, readFileText } from './htmlFile'

function mockDataTransfer({
  files = [],
  types,
  items = [],
}: {
  files?: File[]
  types?: string[]
  items?: Array<{ kind: string; type: string; getAsFile: () => File | null }>
}): DataTransfer {
  const fileList = Object.assign(files.slice(), {
    item: (index: number) => files[index] ?? null,
  }) as unknown as FileList
  const itemList = Object.assign(items.slice(), {
    length: items.length,
  }) as unknown as DataTransferItemList
  return {
    files: fileList,
    types: types ?? (files.length > 0 ? ['Files'] : []),
    items: itemList,
  } as unknown as DataTransfer
}

describe('isHtmlFile', () => {
  it('accepts text/html regardless of name', () => {
    expect(new File(['<p>Hi</p>'], 'notes.txt', { type: 'text/html' })).toSatisfy(isHtmlFile)
  })

  it('accepts .html and .htm by extension when type is empty', () => {
    expect(new File(['<p>Hi</p>'], 'doc.html', { type: '' })).toSatisfy(isHtmlFile)
    expect(new File(['<p>Hi</p>'], 'doc.HTM', { type: '' })).toSatisfy(isHtmlFile)
  })

  it('rejects non-html files', () => {
    expect(new File(['png'], 'photo.png', { type: 'image/png' })).not.toSatisfy(isHtmlFile)
    expect(new File(['hi'], 'notes.txt', { type: 'text/plain' })).not.toSatisfy(isHtmlFile)
  })
})

describe('dataTransferHasFiles', () => {
  it('is true when types include Files', () => {
    expect(dataTransferHasFiles(mockDataTransfer({ types: ['Files'] }))).toBe(true)
  })

  it('is true when a file list or file item is present', () => {
    const file = new File(['<p>Hi</p>'], 'doc.html', { type: 'text/html' })
    expect(dataTransferHasFiles(mockDataTransfer({ files: [file], types: [] }))).toBe(true)
    expect(
      dataTransferHasFiles(
        mockDataTransfer({
          types: [],
          items: [{ kind: 'file', type: 'text/html', getAsFile: () => file }],
        }),
      ),
    ).toBe(true)
  })

  it('is false for null or text-only drags', () => {
    expect(dataTransferHasFiles(null)).toBe(false)
    expect(dataTransferHasFiles(mockDataTransfer({ types: ['text/plain'] }))).toBe(false)
  })
})

describe('findDroppedHtmlFile', () => {
  it('returns the first html file', () => {
    const image = new File(['png'], 'photo.png', { type: 'image/png' })
    const html = new File(['<p>From file</p>'], 'doc.html', { type: 'text/html' })
    const extra = new File(['<p>Second</p>'], 'other.htm', { type: '' })
    expect(findDroppedHtmlFile(mockDataTransfer({ files: [image, html, extra] }))).toBe(html)
  })

  it('reads a file from dataTransfer items when the file list is empty', () => {
    const html = new File(['<p>Item</p>'], 'doc.html', { type: 'text/html' })
    expect(
      findDroppedHtmlFile(
        mockDataTransfer({
          files: [],
          types: ['Files'],
          items: [{ kind: 'file', type: 'text/html', getAsFile: () => html }],
        }),
      ),
    ).toBe(html)
  })

  it('returns null when there is no html file', () => {
    const image = new File(['png'], 'photo.png', { type: 'image/png' })
    expect(findDroppedHtmlFile(null)).toBeNull()
    expect(findDroppedHtmlFile(mockDataTransfer({ files: [image] }))).toBeNull()
  })
})

describe('readFileText', () => {
  it('reads file contents as text', async () => {
    const file = new File(['<p>Hello</p>'], 'doc.html', { type: 'text/html' })
    await expect(readFileText(file)).resolves.toBe('<p>Hello</p>')
  })
})
