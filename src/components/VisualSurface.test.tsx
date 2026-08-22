import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { VisualSurface } from './VisualSurface'

const pageHtml =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'

describe('VisualSurface', () => {
  it('sizes the canvas from pageHtml without putting the style tag in the DOM', () => {
    render(
      <LocaleProvider>
        <VisualSurface html={pageHtml} onChange={() => undefined} />
      </LocaleProvider>,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.style.minHeight).toBe('297mm')
    expect(visual.style.paddingTop).toBe('20pt')
    expect(visual.innerHTML).not.toContain('data-page-at-rule')
    expect(visual.querySelector('style[data-page-at-rule]')).toBeNull()
  })

  it('sizes the canvas when innerHTML read strips style tags like real browsers', () => {
    const { rerender } = render(
      <LocaleProvider>
        <VisualSurface html={pageHtml} onChange={() => undefined} />
      </LocaleProvider>,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' }) as HTMLDivElement
    let stored = visual.innerHTML

    Object.defineProperty(visual, 'innerHTML', {
      configurable: true,
      get() {
        return stored.replace(/<style[\s\S]*?<\/style>/gi, '')
      },
      set(value: string) {
        stored = value.replace(/<style[\s\S]*?<\/style>/gi, '')
      },
    })

    rerender(
      <LocaleProvider>
        <VisualSurface html={pageHtml} onChange={() => undefined} />
      </LocaleProvider>,
    )

    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.innerHTML).not.toContain('data-page-at-rule')
  })
})
