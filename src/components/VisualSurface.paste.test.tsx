import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { XSS_PAYLOADS } from '../core/__fixtures__/xss-payloads'
import { VisualSurface } from './VisualSurface'

function pasteHtml(target: HTMLElement, html: string) {
  fireEvent.paste(target, {
    clipboardData: {
      getData: (type: string) => (type === 'text/html' ? html : type === 'text/plain' ? '' : ''),
    },
  })
}

function placeCaretAtEnd(el: HTMLElement) {
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

describe('VisualSurface paste sanitization', () => {
  it('inserts sanitized clipboard HTML and strips event handlers (WE-006)', () => {
    const onChange = vi.fn()
    render(
      <LocaleProvider>
        <VisualSurface html="<p>Hello</p>" onChange={onChange} pageLayoutEnabled={false} />
      </LocaleProvider>,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    placeCaretAtEnd(visual)
    pasteHtml(visual, `<p>Pasted</p>${XSS_PAYLOADS.onerror}`)

    expect(visual.innerHTML).toContain('Pasted')
    expect(visual.innerHTML).not.toMatch(/\bonerror\b/i)
    expect(visual.innerHTML).not.toMatch(/<script\b/i)
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.at(-1)?.[0] as string
    expect(last).toContain('Pasted')
    expect(last).not.toMatch(/\bonerror\b/i)
  })

  it('strips iframe and script from pasted HTML before DOM insert', () => {
    const onChange = vi.fn()
    render(
      <LocaleProvider>
        <VisualSurface html="<p>Hello</p>" onChange={onChange} pageLayoutEnabled={false} />
      </LocaleProvider>,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    placeCaretAtEnd(visual)
    pasteHtml(visual, `${XSS_PAYLOADS.iframeSrcdoc}${XSS_PAYLOADS.scriptTag}`)

    expect(visual.innerHTML).toContain('Keep')
    expect(visual.innerHTML).not.toMatch(/<iframe\b/i)
    expect(visual.innerHTML).not.toMatch(/<script\b/i)
  })
})
