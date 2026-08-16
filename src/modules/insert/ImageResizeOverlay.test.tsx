import { fireEvent, render, screen } from '@testing-library/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ImageResizeOverlay } from './ImageResizeOverlay'

function stubBox(el: HTMLElement, box: { left: number; top: number; width: number; height: number }) {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => box.height })
  el.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: box.left, y: box.top, width: box.width, height: box.height })
}

function Harness({
  onResize,
  onResizeEnd,
}: {
  onResize: (width: number, height: number) => void
  onResizeEnd: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useLayoutEffect(() => {
    const node = imgRef.current
    if (!node) return
    stubBox(node, { left: 40, top: 20, width: 200, height: 100 })
    setImg(node)
  }, [])

  return (
    <LocaleProvider>
      <img ref={imgRef} src="https://example.com/a.png" alt="" />
      {img ? <ImageResizeOverlay img={img} onResize={onResize} onResizeEnd={onResizeEnd} /> : null}
    </LocaleProvider>
  )
}

describe('ImageResizeOverlay', () => {
  it('shows three resize handles with the expected cursors and labels', () => {
    render(<Harness onResize={() => undefined} onResizeEnd={() => undefined} />)

    const east = screen.getByRole('button', { name: 'Resize image width, keep aspect ratio' })
    const south = screen.getByRole('button', { name: 'Resize image height, keep aspect ratio' })
    const corner = screen.getByRole('button', { name: 'Resize image freely' })

    expect(east).toHaveAttribute('data-resize-handle', 'e')
    expect(south).toHaveAttribute('data-resize-handle', 's')
    expect(corner).toHaveAttribute('data-resize-handle', 'se')
    expect(getComputedStyle(east).cursor).toBe('e-resize')
    expect(getComputedStyle(south).cursor).toBe('s-resize')
    expect(getComputedStyle(corner).cursor).toBe('se-resize')
  })

  it('reports locked sizes while dragging the right handle and commits on pointer up', () => {
    const onResize = vi.fn()
    const onResizeEnd = vi.fn()
    render(<Harness onResize={onResize} onResizeEnd={onResizeEnd} />)

    const east = screen.getByRole('button', { name: 'Resize image width, keep aspect ratio' })
    fireEvent.mouseDown(east, { clientX: 240, clientY: 70 })
    fireEvent.mouseMove(document.body, { clientX: 290, clientY: 120 })
    fireEvent.mouseUp(document.body)

    expect(onResize).toHaveBeenCalledWith(250, 125)
    expect(onResizeEnd).toHaveBeenCalledTimes(1)
  })

  it('reports locked sizes while dragging the bottom handle', () => {
    const onResize = vi.fn()
    render(<Harness onResize={onResize} onResizeEnd={() => undefined} />)

    const south = screen.getByRole('button', { name: 'Resize image height, keep aspect ratio' })
    fireEvent.mouseDown(south, { clientX: 140, clientY: 120 })
    fireEvent.mouseMove(document.body, { clientX: 200, clientY: 170 })

    expect(onResize).toHaveBeenCalledWith(300, 150)
  })

  it('reports independent sizes while dragging the corner', () => {
    const onResize = vi.fn()
    render(<Harness onResize={onResize} onResizeEnd={() => undefined} />)

    const corner = screen.getByRole('button', { name: 'Resize image freely' })
    fireEvent.mouseDown(corner, { clientX: 240, clientY: 120 })
    fireEvent.mouseMove(document.body, { clientX: 280, clientY: 130 })

    expect(onResize).toHaveBeenCalledWith(240, 110)
  })
})
