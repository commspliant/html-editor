import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { previewPageCanvasMargins } from '../core/pageCanvasLayout'
import { VisualSurface } from './VisualSurface'
import styles from './Editor.module.css'

const editorModuleCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'Editor.module.css'),
  'utf8',
)

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

  it('renders rulers when print layout is active and rulerVisible is true', () => {
    render(
      <LocaleProvider>
        <VisualSurface
          html={pageHtml}
          pageHtml={pageHtml}
          rulerVisible
          onChange={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByTestId('horizontal-ruler')).toBeInTheDocument()
    expect(screen.getByTestId('vertical-ruler')).toBeInTheDocument()
    expect(screen.getByTestId('horizontal-ruler').closest('[class*="pageZoomContent"]')).toBeNull()
    expect(screen.getByTestId('vertical-ruler').closest('[class*="pageZoomContent"]')).not.toBeNull()
  })

  it('pins the horizontal ruler in a sticky layer at the top of the scrollport', () => {
    render(
      <LocaleProvider>
        <VisualSurface
          html={pageHtml}
          pageHtml={pageHtml}
          rulerVisible
          onChange={() => undefined}
        />
      </LocaleProvider>,
    )

    const horizontalRuler = screen.getByTestId('horizontal-ruler')
    const rulerLayer = horizontalRuler.closest(`.${styles.multiPageRulerLayer}`) as HTMLElement | null
    expect(rulerLayer).not.toBeNull()
    expect(editorModuleCss).toMatch(/\.multiPageRulerLayer\s*\{[^}]*position:\s*sticky/s)
    expect(editorModuleCss).toMatch(/\.multiPageRulerLayer\s*\{[^}]*border-top:/s)
    expect(editorModuleCss).toMatch(/\.workspaceWithRuler\s*\{[^}]*padding-top:\s*0/s)
  })

  it('previews page canvas padding during ruler margin drag', async () => {
    let surfaceEl: HTMLDivElement | null = null

    render(
      <LocaleProvider>
        <VisualSurface
          html={pageHtml}
          pageHtml={pageHtml}
          rulerVisible
          onChange={() => undefined}
          onMarginPreview={(sides) => {
            if (surfaceEl) previewPageCanvasMargins(surfaceEl, pageHtml, sides)
          }}
        />
      </LocaleProvider>,
    )

    surfaceEl = screen.getByRole('textbox', { name: 'Visual editor' }) as HTMLDivElement
    Object.defineProperty(surfaceEl, 'offsetWidth', { configurable: true, value: 816 })
    Object.defineProperty(surfaceEl, 'offsetHeight', { configurable: true, value: 1056 })
    fireEvent.input(surfaceEl)
    expect(surfaceEl.style.paddingLeft).toBe('20pt')

    await waitFor(() => {
      const left = Number.parseFloat(screen.getByTestId('ruler-printable-area').style.left)
      expect(left).toBeGreaterThan(20)
      expect(left).toBeLessThan(35)
    })

    const splitter = screen.getByTestId('ruler-margin-splitter-left')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 96, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 120 }))

    expect(surfaceEl.style.paddingLeft).toBe('36pt')
  })

  it('does not render rulers without print layout', () => {
    render(
      <LocaleProvider>
        <VisualSurface html="<p>Hello</p>" rulerVisible onChange={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.queryByTestId('horizontal-ruler')).not.toBeInTheDocument()
    expect(screen.queryByTestId('vertical-ruler')).not.toBeInTheDocument()
  })

  it('uses full-width full-height fluid page row when there is no page size', () => {
    render(
      <LocaleProvider>
        <VisualSurface html="<p>Hello</p>" onChange={() => undefined} />
      </LocaleProvider>,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).not.toHaveAttribute('data-page-sized')
    const pageBlock = visual.closest('[class*="pageBlockFluid"]') as HTMLElement | null
    expect(pageBlock).not.toBeNull()
    const blockStyle = getComputedStyle(pageBlock!)
    expect(blockStyle.paddingLeft).not.toBe('24px')
    expect(blockStyle.paddingRight).not.toBe('24px')
  })
})
