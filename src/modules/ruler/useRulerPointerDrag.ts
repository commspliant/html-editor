import { useCallback, useState } from 'react'

export type RulerDragPreview = {
  measurementPx: number
  clientX: number
  clientY: number
}

type StartPointerDragOptions<TPreview extends RulerDragPreview> = {
  updateDragState: (clientX: number, clientY: number, altKey: boolean) => TPreview
  onCommit: (preview: TPreview) => void
  onPreview?: (preview: TPreview) => void
}

export function useRulerPointerDrag<TPreview extends RulerDragPreview>() {
  const [activeTarget, setActiveTarget] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<TPreview | null>(null)

  const startPointerDrag = useCallback(
    (targetType: string, startEvent: React.PointerEvent, options: StartPointerDragOptions<TPreview>) => {
      startEvent.preventDefault()
      startEvent.stopPropagation()

      setActiveTarget(targetType)

      const startX = Number.isFinite(startEvent.clientX) ? startEvent.clientX : 0
      const startY = Number.isFinite(startEvent.clientY) ? startEvent.clientY : 0
      const isAlt = startEvent.altKey

      const handlePointerMove = (event: PointerEvent) => {
        const clientX = Number.isFinite(event.clientX) ? event.clientX : startX
        const clientY = Number.isFinite(event.clientY) ? event.clientY : startY
        const preview = options.updateDragState(clientX, clientY, event.altKey)
        setDragPreview(preview)
        options.onPreview?.(preview)
      }

      const handlePointerUp = (event: PointerEvent) => {
        const clientX = Number.isFinite(event.clientX) ? event.clientX : startX
        const clientY = Number.isFinite(event.clientY) ? event.clientY : startY
        const finalPreview = options.updateDragState(clientX, clientY, event.altKey)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
        setActiveTarget(null)
        setDragPreview(null)
        options.onCommit(finalPreview)
      }

      setDragPreview(options.updateDragState(startX, startY, isAlt))
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [],
  )

  return { activeTarget, dragPreview, startPointerDrag }
}
