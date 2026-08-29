import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PAGE_MARGIN_VAR } from '../core/pageCanvasLayout'
import { estimatePageRowHeight } from '../core/pageRowHeight'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { MultiPageVisualSurface } from './MultiPageVisualSurface'

const pageA4 =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>One</p></div>'
const pageLetter =
  '<style data-page-at-rule>@page { size: letter; margin: 1in; }</style><div data-page><p>Two</p></div>'
const pagePlain = '<div data-page><p>Plain</p></div>'
const pageWithBg =
  '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style>' +
  '<div data-page><div data-page-bg style="background-image:url(&quot;https://example.com/bg.png&quot;)"></div><p>Bg</p></div>'
const pageWithBgLetter =
  '<style data-page-at-rule>@page { size: letter; margin: 1in; }</style>' +
  '<div data-page><div data-page-bg style="background-image:url(&quot;https://example.com/bg2.png&quot;)"></div><p>Bg2</p></div>'

function renderMultiPage(
  props: Partial<ComponentProps<typeof MultiPageVisualSurface>> = {},
) {
  const pages = props.pages ?? [pageA4, pageLetter]

  function Harness() {
    const scrollRef = useRef<HTMLDivElement>(null)
    return (
      <div ref={scrollRef} style={{ height: 300, overflow: 'auto' }}>
        <MultiPageVisualSurface
          pages={pages}
          activePageIndex={props.activePageIndex ?? 0}
          hasSelectedPage={props.hasSelectedPage ?? true}
          scrollRootRef={scrollRef}
          onActivePageIndexChange={props.onActivePageIndexChange ?? (() => undefined)}
          onPageChange={props.onPageChange ?? (() => undefined)}
          onPageFlush={props.onPageFlush}
          rulerVisible={props.rulerVisible ?? true}
          {...props}
        />
      </div>
    )
  }

  return render(
    <LocaleProvider>
      <Harness />
    </LocaleProvider>,
  )
}

describe('MultiPageVisualSurface virtualization', () => {
  it('mounts only a window of page surfaces for large documents', () => {
    const pages = Array.from({ length: 30 }, (_, index) => `<div data-page><p>Page ${index + 1}</p></div>`)
    renderMultiPage({ pages, rulerVisible: false })

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    expect(surfaces.length).toBeGreaterThan(0)
    expect(surfaces.length).toBeLessThan(15)
  })

  it('flushes page html on unmount', async () => {
    const onPageFlush = vi.fn()
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    const pages = Array.from(
      { length: 12 },
      (_, index) =>
        `<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Page ${index + 1}</p></div>`,
    )
    const { container } = renderMultiPage({
      pages,
      rulerVisible: false,
      onPageFlush,
      onPageChange,
      hasSelectedPage: false,
    })

    const scrollHost = container.querySelector('div[style*="overflow: auto"]') as HTMLDivElement
    Object.defineProperty(scrollHost, 'clientHeight', { configurable: true, value: 300 })
    Object.defineProperty(scrollHost, 'scrollHeight', { configurable: true, value: 50_000 })

    const firstSurface = screen.getByText('Page 1').closest('[role="textbox"]') as HTMLDivElement
    await user.click(firstSurface)
    const paragraph = firstSurface.querySelector('[data-page] p') as HTMLParagraphElement
    await act(async () => {
      paragraph.textContent = 'Edited page 1'
      fireEvent.input(firstSurface)
    })

    expect(onPageChange).toHaveBeenCalledWith(0, expect.stringContaining('Edited page 1'))

    let scrollTop = 0
    for (let pageIndex = 0; pageIndex < 11; pageIndex += 1) {
      scrollTop += estimatePageRowHeight(pages[pageIndex] ?? '', pageIndex)
    }
    scrollHost.scrollTop = scrollTop
    await act(async () => {
      fireEvent.scroll(scrollHost)
    })

    await waitFor(() => {
      expect(screen.queryByText(/^Page 1$/)).not.toBeInTheDocument()
      expect(document.querySelector('[data-page-index="0"]')).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(onPageFlush).toHaveBeenCalledWith(0, expect.stringContaining('Edited page 1'))
    })
  })
})

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

  it('sets per-page bleed margin vars when pages have background images', async () => {
    renderMultiPage({ pages: [pageWithBg, pageWithBgLetter] })

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    expect(surfaces[0].style.getPropertyValue(PAGE_MARGIN_VAR.top)).toBe('20pt')
    expect(surfaces[1].style.getPropertyValue(PAGE_MARGIN_VAR.top)).toBe('72pt')
  })
})
