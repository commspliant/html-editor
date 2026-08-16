import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  TABLE_GRID_MAX,
  TABLE_SIZE_MAX,
  TABLE_SIZE_MIN,
  validateTableSize,
  type TableApply,
} from '../../core/table'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import dialogStyles from '../format/FontPropertiesDialog.module.css'
import styles from './TableDialog.module.css'

const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([hidden]), select:not([disabled])'

const DEFAULT_SIZE = { rows: 3, cols: 3 }

export type TableDialogProps = {
  open: boolean
  disabled?: boolean
  onApply: (draft: TableApply) => void
  onClose: () => void
}

export function TableDialog({ open, disabled, onApply, onClose }: TableDialogProps) {
  const t = useT()
  const titleId = useId()
  const rowsId = useId()
  const colsId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState(DEFAULT_SIZE.rows)
  const [cols, setCols] = useState(DEFAULT_SIZE.cols)
  const [rowsDraft, setRowsDraft] = useState(String(DEFAULT_SIZE.rows))
  const [colsDraft, setColsDraft] = useState(String(DEFAULT_SIZE.cols))
  const [gridLocked, setGridLocked] = useState(false)

  useEffect(() => {
    if (!open) return
    setRows(DEFAULT_SIZE.rows)
    setCols(DEFAULT_SIZE.cols)
    setRowsDraft(String(DEFAULT_SIZE.rows))
    setColsDraft(String(DEFAULT_SIZE.cols))
    setGridLocked(false)
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

  const valid = validateTableSize(rows, cols)
  const canApply = valid && !disabled

  const setSize = (nextRows: number, nextCols: number) => {
    const clampedRows = Math.min(TABLE_SIZE_MAX, Math.max(TABLE_SIZE_MIN, nextRows))
    const clampedCols = Math.min(TABLE_SIZE_MAX, Math.max(TABLE_SIZE_MIN, nextCols))
    setRows(clampedRows)
    setCols(clampedCols)
    setRowsDraft(String(clampedRows))
    setColsDraft(String(clampedCols))
  }

  const commitNumber = (raw: string, kind: 'rows' | 'cols') => {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed)) {
      if (kind === 'rows') setRowsDraft(String(rows))
      else setColsDraft(String(cols))
      return
    }
    setGridLocked(true)
    if (kind === 'rows') setSize(parsed, cols)
    else setSize(rows, parsed)
  }

  const onNumberChange = (raw: string, kind: 'rows' | 'cols') => {
    const digits = raw.replace(/\D/g, '')
    if (kind === 'rows') setRowsDraft(digits)
    else setColsDraft(digits)
    if (digits === '') return
    const parsed = Number.parseInt(digits, 10)
    if (!Number.isFinite(parsed)) return
    setGridLocked(true)
    if (kind === 'rows') setSize(parsed, cols)
    else setSize(rows, parsed)
  }

  const onNumberKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-' || event.key === '.') {
      event.preventDefault()
    }
  }

  return createPortal(
    <div className={dialogStyles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={dialogStyles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={dialogStyles.headerRow}>
          <h2 className={dialogStyles.header} id={titleId}>
            {t('tableDialogTitle')}
          </h2>
          <button
            type="button"
            className={dialogStyles.close}
            aria-label={t('tableDialogCloseAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={dialogStyles.body}>
          <div
            className={styles.grid}
            role="grid"
            aria-label={t('tableDialogGridAria')}
            onMouseLeave={() => undefined}
          >
            {Array.from({ length: TABLE_GRID_MAX }, (_, rowIndex) =>
              Array.from({ length: TABLE_GRID_MAX }, (_, colIndex) => {
                const cellRows = rowIndex + 1
                const cellCols = colIndex + 1
                const active = cellRows <= rows && cellCols <= cols
                return (
                  <button
                    key={`${cellRows}-${cellCols}`}
                    type="button"
                    className={styles.cell}
                    role="gridcell"
                    data-active={active ? 'true' : undefined}
                    aria-label={`${cellRows} × ${cellCols}`}
                    aria-pressed={active && cellRows === rows && cellCols === cols}
                    disabled={disabled}
                    onMouseEnter={() => {
                      if (!gridLocked) setSize(cellRows, cellCols)
                    }}
                    onClick={() => {
                      setGridLocked(true)
                      setSize(cellRows, cellCols)
                    }}
                  />
                )
              }),
            )}
          </div>
          <p className={styles.sizeLabel}>
            {t('tableDialogSize')}: {rows} × {cols}
          </p>
          <div className={`${dialogStyles.sizeRow} ${styles.sizeFields}`}>
            <div className={dialogStyles.field}>
              <label className={dialogStyles.label} htmlFor={rowsId}>
                {t('tableDialogRows')}
              </label>
              <input
                id={rowsId}
                className={styles.numberInput}
                type="number"
                inputMode="numeric"
                min={TABLE_SIZE_MIN}
                max={TABLE_SIZE_MAX}
                step={1}
                value={rowsDraft}
                disabled={disabled}
                onKeyDown={onNumberKeyDown}
                onChange={(event) => onNumberChange(event.target.value, 'rows')}
                onBlur={() => commitNumber(rowsDraft, 'rows')}
              />
            </div>
            <div className={dialogStyles.field}>
              <label className={dialogStyles.label} htmlFor={colsId}>
                {t('tableDialogColumns')}
              </label>
              <input
                id={colsId}
                className={styles.numberInput}
                type="number"
                inputMode="numeric"
                min={TABLE_SIZE_MIN}
                max={TABLE_SIZE_MAX}
                step={1}
                value={colsDraft}
                disabled={disabled}
                onKeyDown={onNumberKeyDown}
                onChange={(event) => onNumberChange(event.target.value, 'cols')}
                onBlur={() => commitNumber(colsDraft, 'cols')}
              />
            </div>
          </div>
        </div>
        <div className={dialogStyles.actions}>
          <button type="button" className={dialogStyles.action} onClick={onClose}>
            {t('fontDialogCancel')}
          </button>
          <button
            type="button"
            className={`${dialogStyles.action} ${dialogStyles.actionPrimary}`}
            disabled={!canApply}
            onClick={() => {
              if (!canApply) return
              onApply({ rows, cols })
            }}
          >
            {t('tableDialogInsert')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
