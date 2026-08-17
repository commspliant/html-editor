import { useEffect, useRef } from 'react'

export const AUTO_SAVE_INTERVAL_MS = 1000

export type AutoSaveCallback = (html: string) => void | Promise<void>

type UseAutoSaveOptions = {
  onAutoSave?: AutoSaveCallback
  getHtml: () => string
}

function invokeAutoSave(callback: AutoSaveCallback, html: string) {
  try {
    void Promise.resolve(callback(html)).catch(() => undefined)
  } catch {
    // Host callback must not break the interval or editing.
  }
}

export function useAutoSave({ onAutoSave, getHtml }: UseAutoSaveOptions) {
  const onAutoSaveRef = useRef(onAutoSave)
  onAutoSaveRef.current = onAutoSave
  const getHtmlRef = useRef(getHtml)
  getHtmlRef.current = getHtml
  const lastSavedRef = useRef<string | null>(null)
  const enabled = onAutoSave != null

  useEffect(() => {
    if (!enabled) {
      lastSavedRef.current = null
      return
    }

    lastSavedRef.current = getHtmlRef.current()
    const id = window.setInterval(() => {
      const callback = onAutoSaveRef.current
      if (!callback) return
      const html = getHtmlRef.current()
      if (html === lastSavedRef.current) return
      lastSavedRef.current = html
      queueMicrotask(() => invokeAutoSave(callback, html))
    }, AUTO_SAVE_INTERVAL_MS)

    return () => {
      window.clearInterval(id)
    }
  }, [enabled])
}
