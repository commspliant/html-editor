import { useEffect, type RefObject } from 'react'

export const DEFAULT_DIALOG_FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled])'

export const DEFAULT_ESCAPE_IGNORE_SELECTORS = '[role="listbox"], [data-color-picker]'

export type UseDialogFocusTrapOptions = {
  open: boolean
  onClose: () => void
  focusableSelector?: string
  escapeIgnoreSelectors?: string | false
}

export function useDialogFocusTrap(
  dialogRef: RefObject<HTMLElement | null>,
  {
    open,
    onClose,
    focusableSelector = DEFAULT_DIALOG_FOCUSABLE,
    escapeIgnoreSelectors = DEFAULT_ESCAPE_IGNORE_SELECTORS,
  }: UseDialogFocusTrapOptions,
): void {
  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    const focusable = node?.querySelector<HTMLElement>(focusableSelector)
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (escapeIgnoreSelectors && document.querySelector(escapeIgnoreSelectors)) return
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll<HTMLElement>(focusableSelector)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [dialogRef, escapeIgnoreSelectors, focusableSelector, onClose, open])
}
