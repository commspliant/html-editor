import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  imageResizeStartSize,
  nextImageResizeSize,
  type ImageResizeHandle,
} from '../../core/imageResize'
import { useT } from '../../i18n/LocaleProvider'
import styles from './ImageResizeOverlay.module.css'

export type ImageResizeOverlayProps = {
  img: HTMLImageElement
  onResize: (width: number, height: number) => void
  onResizeEnd: () => void
}

type Box = {
  left: number
  top: number
  width: number
  height: number
}

function readBox(img: HTMLImageElement): Box {
  const rect = img.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

const HANDLES: {
  handle: ImageResizeHandle
  className: string
  cursor: 'e-resize' | 's-resize' | 'se-resize'
  ariaKey: 'imageResizeHandleEastAria' | 'imageResizeHandleSouthAria' | 'imageResizeHandleSouthEastAria'
}[] = [
  { handle: 'e', className: styles.handleEast, cursor: 'e-resize', ariaKey: 'imageResizeHandleEastAria' },
  { handle: 's', className: styles.handleSouth, cursor: 's-resize', ariaKey: 'imageResizeHandleSouthAria' },
  { handle: 'se', className: styles.handleSouthEast, cursor: 'se-resize', ariaKey: 'imageResizeHandleSouthEastAria' },
]

type DragState = {
  handle: ImageResizeHandle
  start: { width: number; height: number }
  originX: number
  originY: number
}

function pointerCoords(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
  if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null
  return { x: event.clientX, y: event.clientY }
}

export function ImageResizeOverlay({ img, onResize, onResizeEnd }: ImageResizeOverlayProps) {
  const t = useT()
  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef(img)
  const onResizeRef = useRef(onResize)
  const onResizeEndRef = useRef(onResizeEnd)
  const dragRef = useRef<DragState | null>(null)
  imgRef.current = img
  onResizeRef.current = onResize
  onResizeEndRef.current = onResizeEnd

  const applyBox = (next: Box) => {
    const node = frameRef.current
    if (!node) return
    node.style.left = `${next.left}px`
    node.style.top = `${next.top}px`
    node.style.width = `${next.width}px`
    node.style.height = `${next.height}px`
  }

  useLayoutEffect(() => {
    applyBox(readBox(img))

    const sync = () => {
      if (!img.isConnected) return
      applyBox(readBox(img))
    }
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [img])

  const applyDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    const target = imgRef.current
    if (!drag || !target) return
    const next = nextImageResizeSize(drag.handle, drag.start, {
      x: clientX - drag.originX,
      y: clientY - drag.originY,
    })
    onResizeRef.current(next.width, next.height)
    if (target.isConnected) applyBox(readBox(target))
  }

  const endDrag = () => {
    if (!dragRef.current) return
    dragRef.current = null
    const target = imgRef.current
    onResizeEndRef.current()
    if (target?.isConnected) applyBox(readBox(target))
  }

  useLayoutEffect(() => {
    const onMove = (event: PointerEvent | MouseEvent) => {
      if (!dragRef.current) return
      const coords = pointerCoords(event)
      if (!coords) return
      applyDrag(coords.x, coords.y)
    }
    const onUp = () => {
      endDrag()
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startDrag = (handle: ImageResizeHandle, event: { clientX: number; clientY: number }) => {
    const coords = pointerCoords(event)
    if (!coords) return
    dragRef.current = {
      handle,
      start: imageResizeStartSize(imgRef.current),
      originX: coords.x,
      originY: coords.y,
    }
  }

  const onHandlePointerDown = (handle: ImageResizeHandle) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    startDrag(handle, event)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* jsdom may not implement pointer capture */
    }
  }

  const onHandleMouseDown = (handle: ImageResizeHandle) => (event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number }) => {
    event.preventDefault()
    event.stopPropagation()
    startDrag(handle, event)
  }

  const onHandleMove = (event: { clientX: number; clientY: number }) => {
    const coords = pointerCoords(event)
    if (!coords) return
    applyDrag(coords.x, coords.y)
  }

  if (!img.isConnected) return null

  const box = readBox(img)

  return createPortal(
    <div
      ref={frameRef}
      className={styles.frame}
      data-image-resize-overlay=""
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }}
    >
      {HANDLES.map((entry) => (
        <button
          key={entry.handle}
          type="button"
          className={`${styles.handle} ${entry.className}`}
          style={{ cursor: entry.cursor }}
          aria-label={t(entry.ariaKey)}
          data-resize-handle={entry.handle}
          onPointerDown={onHandlePointerDown(entry.handle)}
          onPointerMove={onHandleMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseDown={onHandleMouseDown(entry.handle)}
          onMouseMove={onHandleMove}
          onMouseUp={endDrag}
        />
      ))}
    </div>,
    document.body,
  )
}
