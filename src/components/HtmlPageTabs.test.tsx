import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { HtmlPageTabs } from './HtmlPageTabs'

describe('HtmlPageTabs', () => {
  it('renders a tab per page and marks the active tab', () => {
    render(
      <LocaleProvider>
        <HtmlPageTabs pageCount={3} activeIndex={1} onSelect={vi.fn()} />
      </LocaleProvider>,
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveTextContent('Page 2')
  })

  it('calls onSelect when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <LocaleProvider>
        <HtmlPageTabs pageCount={2} activeIndex={0} onSelect={onSelect} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Page 2' }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('shows scroll arrows when there are five or more pages', () => {
    render(
      <LocaleProvider>
        <HtmlPageTabs pageCount={6} activeIndex={0} onSelect={vi.fn()} />
      </LocaleProvider>,
    )

    expect(
      screen.getByRole('button', { name: 'Scroll page tabs left' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Scroll page tabs right' }),
    ).toBeInTheDocument()
  })

  it('does not show scroll arrows for fewer than five pages', () => {
    render(
      <LocaleProvider>
        <HtmlPageTabs pageCount={4} activeIndex={0} onSelect={vi.fn()} />
      </LocaleProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Scroll page tabs left' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Scroll page tabs right' })).not.toBeInTheDocument()
  })
})
