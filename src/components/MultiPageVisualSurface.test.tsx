import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { MultiPageVisualSurface } from './MultiPageVisualSurface'

const pageA4 =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>One</p></div>'
const pageLetter =
  '<style data-page-at-rule>@page { size: letter; margin: 1in; }</style><div data-page><p>Two</p></div>'
const pagePlain = '<div data-page><p>Plain</p></div>'

function renderMultiPage(
  props: Partial<ComponentProps<typeof MultiPageVisualSurface>> = {},
) {
  const pages = props.pages ?? [pageA4, pageLetter]
  return render(
    <LocaleProvider>
      <MultiPageVisualSurface
        pages={pages}
        activePageIndex={props.activePageIndex ?? 0}
        hasSelectedPage={props.hasSelectedPage ?? true}
        onActivePageIndexChange={props.onActivePageIndexChange ?? (() => undefined)}
        onPageChange={props.onPageChange ?? (() => undefined)}
        rulerVisible={props.rulerVisible ?? true}
        {...props}
      />
    </LocaleProvider>,
  )
}

describe('MultiPageVisualSurface rulers', () => {
  it('shows horizontal ruler for the active sized page and vertical rulers only on sized rows', async () => {
    renderMultiPage({ pages: [pageA4, pagePlain, pageLetter], activePageIndex: 0 })

    expect(screen.getByTestId('horizontal-ruler')).toBeInTheDocument()
    expect(screen.getAllByTestId('vertical-ruler')).toHaveLength(2)
  })

  it('follows the selected page for horizontal ruler context', async () => {
    const user = userEvent.setup()
    let activePageIndex = 0
    const onActivePageIndexChange = vi.fn((index: number) => {
      activePageIndex = index
    })

    const { rerender } = render(
      <LocaleProvider>
        <MultiPageVisualSurface
          pages={[pageA4, pagePlain]}
          activePageIndex={activePageIndex}
          hasSelectedPage
          onActivePageIndexChange={onActivePageIndexChange}
          onPageChange={() => undefined}
          rulerVisible
        />
      </LocaleProvider>,
    )

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])

    expect(onActivePageIndexChange).toHaveBeenCalledWith(1)

    rerender(
      <LocaleProvider>
        <MultiPageVisualSurface
          pages={[pageA4, pagePlain]}
          activePageIndex={activePageIndex}
          hasSelectedPage
          onActivePageIndexChange={onActivePageIndexChange}
          onPageChange={() => undefined}
          rulerVisible
        />
      </LocaleProvider>,
    )

    expect(screen.queryByTestId('horizontal-ruler')).not.toBeInTheDocument()
    expect(screen.queryByTestId('vertical-ruler')).not.toBeInTheDocument()
  })

  it('routes margin drag on a non-active page by page index', async () => {
    const onMarginPreview = vi.fn()
    const onMarginChange = vi.fn()

    renderMultiPage({
      pages: [pageA4, pageLetter],
      activePageIndex: 0,
      onMarginPreview,
      onMarginChange,
    })

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    const secondSurface = surfaces[1] as HTMLDivElement
    Object.defineProperty(secondSurface, 'offsetWidth', { configurable: true, value: 816 })
    Object.defineProperty(secondSurface, 'offsetHeight', { configurable: true, value: 1056 })
    fireEvent.input(secondSurface)

    await waitFor(() => {
      expect(screen.getAllByTestId('vertical-ruler')).toHaveLength(2)
    })

    const verticalRulers = screen.getAllByTestId('vertical-ruler')
    const secondVerticalRuler = verticalRulers[1]
    const splitter = secondVerticalRuler.querySelector('[data-testid="ruler-margin-splitter-top"]')
    expect(splitter).not.toBeNull()

    fireEvent(splitter!, new MouseEvent('pointerdown', { clientY: 96, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientY: 120 }))

    expect(onMarginPreview).toHaveBeenCalledWith(1, { top: 120 })

    fireEvent(window, new MouseEvent('pointerup', { clientY: 120 }))
    expect(onMarginChange).toHaveBeenCalledWith(1, { top: 120 })
  })
})
