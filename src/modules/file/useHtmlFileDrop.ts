import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { dataTransferHasFiles, findDroppedHtmlFile, readFileText } from './htmlFile'

type UseHtmlFileDropOptions = {
  enabled: boolean
  onHtml: (html: string) => void
}

export function useHtmlFileDrop({ enabled, onHtml }: UseHtmlFileDropOptions) {
  const [dragging, setDragging] = useState(false)
  const dragDepthRef = useRef(0)
  const enabledRef = useRef(enabled)
  const onHtmlRef = useRef(onHtml)
  enabledRef.current = enabled
  onHtmlRef.current = onHtml

  const resetDragging = useCallback(() => {
    dragDepthRef.current = 0
    setDragging(false)
  }, [])

  useEffect(() => {
    if (!enabled) resetDragging()
  }, [enabled, resetDragging])

  const onDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!enabledRef.current || !dataTransferHasFiles(event.dataTransfer)) return
    event.preventDefault()
    dragDepthRef.current += 1
    setDragging(true)
  }, [])

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!enabledRef.current || !dataTransferHasFiles(event.dataTransfer)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!enabledRef.current || !dataTransferHasFiles(event.dataTransfer)) return
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragging(false)
  }, [])

  const onDrop = useCallback((event: DragEvent<HTMLElement>) => {
    if (!enabledRef.current || !dataTransferHasFiles(event.dataTransfer)) return
    event.preventDefault()
    resetDragging()
    const file = findDroppedHtmlFile(event.dataTransfer)
    if (!file) return
    void readFileText(file).then(
      (html) => {
        if (!enabledRef.current) return
        onHtmlRef.current(html)
      },
      () => undefined,
    )
  }, [resetDragging])

  return { dragging, onDragEnter, onDragOver, onDragLeave, onDrop }
}
