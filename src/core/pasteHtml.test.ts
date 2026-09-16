import { describe, expect, it, vi } from 'vitest'
import { XSS_PAYLOADS } from './__fixtures__/xss-payloads'
import { handleContentEditableDrop } from './pasteHtml'

describe('handleContentEditableDrop', () => {
  it('inserts sanitized HTML and strips event handlers', () => {
    const root = document.createElement('div')
    root.contentEditable = 'true'
    document.body.appendChild(root)
    const preventDefault = vi.fn()
    const ok = handleContentEditableDrop(
      {
        dataTransfer: {
          files: [] as unknown as FileList,
          getData: (type: string) =>
            type === 'text/html' ? `<p>Dropped</p>${XSS_PAYLOADS.onclick}` : '',
        } as DataTransfer,
        preventDefault,
      },
      root,
    )
    expect(ok).toBe(true)
    expect(preventDefault).toHaveBeenCalled()
    expect(root.innerHTML).toContain('Dropped')
    expect(root.innerHTML).not.toMatch(/\bonclick\b/i)
    root.remove()
  })

  it('does not intercept file drops', () => {
    const root = document.createElement('div')
    const preventDefault = vi.fn()
    const file = new File(['<p>x</p>'], 'doc.html', { type: 'text/html' })
    const ok = handleContentEditableDrop(
      {
        dataTransfer: {
          files: [file] as unknown as FileList,
          getData: () => '<p onclick="alert(1)">x</p>',
        } as DataTransfer,
        preventDefault,
      },
      root,
    )
    expect(ok).toBe(false)
    expect(preventDefault).not.toHaveBeenCalled()
  })
})
