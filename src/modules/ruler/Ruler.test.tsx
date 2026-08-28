import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { HorizontalRuler } from './HorizontalRuler'
import { VerticalRuler } from './VerticalRuler'
import type { PageGeometry } from './rulerTypes'
import { emptyParagraphIndentState } from '../../core/paragraphIndent'

const mockGeometry: PageGeometry = {
  pageWidthPx: 816,
  pageHeightPx: 1056,
  marginsPx: {
    top: 96,
    right: 96,
    bottom: 96,
    left: 96,
  },
}

function renderWithLocale(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

describe('HorizontalRuler', () => {
  it('renders ruler tracks, margin splitters, and indent markers', () => {
    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
      />,
    )

    expect(screen.getByTestId('horizontal-ruler')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-printable-area')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-margin-splitter-left')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-margin-splitter-right')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-first-line-indent')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-left-indent')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-right-indent')).toBeInTheDocument()
    expect(screen.queryByTestId('ruler-hanging-indent')).not.toBeInTheDocument()
  })

  it('hides indent markers when selection has mixed indents', () => {
    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={{ ...emptyParagraphIndentState(), mixed: true }}
      />,
    )

    expect(screen.queryByTestId('ruler-first-line-indent')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ruler-left-indent')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ruler-right-indent')).not.toBeInTheDocument()
  })

  it('triggers onMarginPreview when dragging left margin splitter', () => {
    const onMarginPreview = vi.fn()

    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
        onMarginPreview={onMarginPreview}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-left')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 96, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 120 }))

    expect(onMarginPreview).toHaveBeenCalled()
    expect(onMarginPreview).toHaveBeenCalledWith({ left: 120 })
  })

  it('triggers onMarginChange when dragging right margin splitter', () => {
    const onMarginChange = vi.fn()

    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
        onMarginChange={onMarginChange}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-right')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 720, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 696 }))
    fireEvent(window, new MouseEvent('pointerup', { clientX: 696 }))

    expect(onMarginChange).toHaveBeenCalledWith({ right: 120 })
  })

  it('triggers onMarginPreview when dragging right margin splitter', () => {
    const onMarginPreview = vi.fn()

    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
        onMarginPreview={onMarginPreview}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-right')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 720, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 696 }))

    expect(onMarginPreview).toHaveBeenCalledWith({ right: 120 })
  })

  it('triggers onMarginChange when dragging left margin splitter', () => {
    const onMarginChange = vi.fn()

    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
        onMarginChange={onMarginChange}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-left')
    fireEvent.pointerDown(splitter, { clientX: 96, pointerId: 1 })

    fireEvent.pointerMove(window, { clientX: 120 })
    fireEvent.pointerUp(window, { clientX: 120 })

    expect(onMarginChange).toHaveBeenCalled()
  })

  it('updates printable area position during margin drag preview', () => {
    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-left')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 96, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 120 }))

    expect(screen.getByTestId('ruler-printable-area')).toHaveStyle({ left: '120px' })
    expect(screen.getByTestId('ruler-drag-tooltip')).toBeInTheDocument()
  })

  it('scales ruler layout width with zoomScale while keeping document width for drag math', () => {
    const { rerender } = renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
        zoomScale={0.5}
      />,
    )
    expect(screen.getByTestId('horizontal-ruler')).toHaveStyle({ width: '408px' })
    rerender(
      <LocaleProvider>
        <HorizontalRuler
          geometry={mockGeometry}
          indentState={emptyParagraphIndentState()}
          zoomScale={2}
        />
      </LocaleProvider>,
    )
    expect(screen.getByTestId('horizontal-ruler')).toHaveStyle({ width: '1632px' })
  })

  it('converts screen pointer delta to document px when zoomScale is not 1', () => {
    const onMarginChange = vi.fn()

    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={emptyParagraphIndentState()}
        zoomScale={0.5}
        onMarginChange={onMarginChange}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-left')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 96, bubbles: true }))

    fireEvent(window, new MouseEvent('pointermove', { clientX: 120 }))
    fireEvent(window, new MouseEvent('pointerup', { clientX: 120 }))

    expect(onMarginChange).toHaveBeenCalledWith({ left: 144 })
  })

  it('emits only leftIndentPx when dragging the left indent marker', () => {
    const onIndentChange = vi.fn()

    renderWithLocale(
      <HorizontalRuler
        geometry={mockGeometry}
        indentState={{ ...emptyParagraphIndentState(), leftIndentPx: 48, firstLineIndentPx: 24 }}
        onIndentChange={onIndentChange}
      />,
    )

    const marker = screen.getByTestId('ruler-left-indent')
    fireEvent(marker, new MouseEvent('pointerdown', { clientX: 144, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 168 }))
    fireEvent(window, new MouseEvent('pointerup', { clientX: 168 }))

    expect(onIndentChange).toHaveBeenCalledWith({ leftIndentPx: 72 })
    expect(onIndentChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ firstLineIndentPx: expect.any(Number) }),
    )
  })
})

describe('VerticalRuler', () => {
  it('renders vertical ruler tracks and margin splitters', () => {
    renderWithLocale(<VerticalRuler geometry={mockGeometry} />)

    expect(screen.getByTestId('vertical-ruler')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-printable-area-vertical')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-margin-splitter-top')).toBeInTheDocument()
    expect(screen.getByTestId('ruler-margin-splitter-bottom')).toBeInTheDocument()
  })

  it('triggers onMarginPreview when dragging top margin splitter', () => {
    const onMarginPreview = vi.fn()

    renderWithLocale(
      <VerticalRuler
        geometry={mockGeometry}
        onMarginPreview={onMarginPreview}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-top')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientY: 96, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientY: 120 }))

    expect(onMarginPreview).toHaveBeenCalledWith({ top: 120 })
  })

  it('triggers onMarginChange when dragging bottom margin splitter', () => {
    const onMarginChange = vi.fn()

    renderWithLocale(
      <VerticalRuler
        geometry={mockGeometry}
        onMarginChange={onMarginChange}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-bottom')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientY: 960, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientY: 936 }))
    fireEvent(window, new MouseEvent('pointerup', { clientY: 936 }))

    expect(onMarginChange).toHaveBeenCalledWith({ bottom: 120 })
  })

  it('triggers onMarginPreview when dragging bottom margin splitter', () => {
    const onMarginPreview = vi.fn()

    renderWithLocale(
      <VerticalRuler
        geometry={mockGeometry}
        onMarginPreview={onMarginPreview}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-bottom')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientY: 960, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientY: 936 }))

    expect(onMarginPreview).toHaveBeenCalledWith({ bottom: 120 })
  })

  it('triggers onMarginChange when dragging top margin splitter', () => {
    const onMarginChange = vi.fn()

    renderWithLocale(
      <VerticalRuler
        geometry={mockGeometry}
        onMarginChange={onMarginChange}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-top')
    fireEvent.pointerDown(splitter, { clientY: 96, pointerId: 1 })

    fireEvent.pointerMove(window, { clientY: 120 })
    fireEvent.pointerUp(window, { clientY: 120 })

    expect(onMarginChange).toHaveBeenCalled()
  })

  it('converts screen pointer delta to document px when zoomScale is not 1', () => {
    const onMarginChange = vi.fn()

    renderWithLocale(
      <VerticalRuler
        geometry={mockGeometry}
        zoomScale={2}
        onMarginChange={onMarginChange}
      />,
    )

    const splitter = screen.getByTestId('ruler-margin-splitter-top')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientY: 96, bubbles: true }))

    fireEvent(window, new MouseEvent('pointermove', { clientY: 120 }))
    fireEvent(window, new MouseEvent('pointerup', { clientY: 120 }))

    expect(onMarginChange).toHaveBeenCalledWith({ top: 108 })
  })
})
