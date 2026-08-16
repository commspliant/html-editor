import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { validateBookmarkName, type BookmarkNameError } from '../../core/bookmark'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { Tooltip } from '../../toolbar/Tooltip'
import styles from '../format/FontPropertiesDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])'

const ERROR_KEYS: Record<BookmarkNameError, MessageKey> = {
  empty: 'bookmarkDialogErrorEmpty',
  invalid: 'bookmarkDialogErrorInvalid',
  duplicate: 'bookmarkDialogErrorDuplicate',
}

export type BookmarkDialogProps = {
  open: boolean
  existingIds: readonly string[]
  disabled?: boolean
  onApply: (name: string) => void
  onClose: () => void
}

export function BookmarkDialog({
  open,
  existingIds,
  disabled,
  onApply,
  onClose,
}: BookmarkDialogProps) {
  const t = useT()
  const titleId = useId()
  const nameId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const existing = useMemo(() => new Set(existingIds), [existingIds])
  const error = validateBookmarkName(name, existing)

  useEffect(() => {
    if (!open) return
    setName('')
    setSubmitted(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    const focusable = node?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
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
  }, [open, onClose])

  if (!open) return null

  const showError = submitted || name.trim().length > 0 ? error : null
  const canApply = error === null && !disabled

  const submit = () => {
    setSubmitted(true)
    if (error || disabled) return
    onApply(name.trim())
  }

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <h2 className={styles.header} id={titleId}>
            {t('bookmarkDialogTitle')}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('bookmarkDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor={nameId}>
                {t('bookmarkDialogName')}
              </label>
              <Tooltip label={t('bookmarkDialogHelp')} elevated>
                <button
                  type="button"
                  className={styles.help}
                  aria-label={t('bookmarkDialogHelpAria')}
                >
                  ?
                </button>
              </Tooltip>
            </div>
            <input
              id={nameId}
              className={styles.textInput}
              value={name}
              disabled={disabled}
              aria-invalid={showError !== null}
              aria-describedby={showError ? errorId : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {showError ? (
              <p id={errorId} className={styles.error}>
                {t(ERROR_KEYS[showError])}
              </p>
            ) : null}
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={onClose}>
            {t('fontDialogCancel')}
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.actionPrimary}`}
            disabled={!canApply}
            onClick={submit}
          >
            {t('fontDialogOk')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
