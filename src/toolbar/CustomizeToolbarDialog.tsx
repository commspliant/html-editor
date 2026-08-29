import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { ChromePortal } from '../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap'
import { useT } from '../i18n/LocaleProvider'
import type { ToolbarCustomization } from '../types'
import { resolveChromeLabel } from './resolveChrome'
import {
  FULLSCREEN_GROUP_ID,
  mergeGroupOrder,
  moveToolbarGroup,
  moveToolbarGroupByOffset,
  toggleToolbarItemHidden,
} from './toolbarCustomization'
import type { ToolbarCatalog, ToolbarIconGroup } from './types'
import styles from './CustomizeToolbarDialog.module.css'

export type CustomizeToolbarDialogProps = {
  open: boolean
  catalog: ToolbarCatalog
  groups: ToolbarIconGroup[]
  settings: ToolbarCustomization | null
  loading?: boolean
  busy?: boolean
  disabled?: boolean
  onChange: (settings: ToolbarCustomization) => void
  onReset: () => void
  onClose: () => void
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  )
}

export function CustomizeToolbarDialog({
  open,
  catalog,
  groups,
  settings,
  loading = false,
  busy = false,
  disabled,
  onChange,
  onReset,
  onClose,
}: CustomizeToolbarDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const groupOrder = mergeGroupOrder(
    groups.map((group) => group.id),
    settings?.groupOrder,
  )
  const hidden = new Set(settings?.hiddenItemIds ?? [])
  const byId = new Map(groups.map((group) => [group.id, group]))
  const orderedGroups = groupOrder
    .map((id) => byId.get(id))
    .filter((group): group is ToolbarIconGroup => Boolean(group))
  const locked = disabled || busy || loading

  useEffect(() => {
    if (!open) {
      setDraggingId(null)
      setDropTargetId(null)
    }
  }, [open])

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    escapeIgnoreSelectors: false,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])',
  })

  if (!open) return null

  const movableIds = orderedGroups
    .map((group) => group.id)
    .filter((id) => id !== FULLSCREEN_GROUP_ID)

  const onDragStart = (event: DragEvent<HTMLButtonElement>, groupId: string) => {
    if (locked || groupId === FULLSCREEN_GROUP_ID) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', groupId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(groupId)
  }

  const onDragOver = (event: DragEvent<HTMLElement>, groupId: string) => {
    if (locked || groupId === FULLSCREEN_GROUP_ID || !draggingId || draggingId === groupId) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    setDropTargetId(groupId)
  }

  const onDrop = (event: DragEvent<HTMLElement>, groupId: string) => {
    event.preventDefault()
    const sourceId = event.dataTransfer?.getData('text/plain') || draggingId
    setDraggingId(null)
    setDropTargetId(null)
    if (!sourceId || sourceId === groupId || locked) return
    onChange(moveToolbarGroup(settings, groups, sourceId, groupId))
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setDropTargetId(null)
  }

  return (
      <ChromePortal>

    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={loading || busy ? true : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={styles.header} id={titleId}>
          {t('customizeToolbarDialogTitle')}
        </h2>
        <div className={styles.body}>
          {loading ? (
            <div
              className={styles.spinnerWrap}
              role="status"
              aria-live="polite"
              aria-label={t('customizeToolbarDialogLoading')}
            >
              <span className={styles.spinner} aria-hidden="true" />
            </div>
          ) : (
            orderedGroups.map((group) => {
              const def = catalog.groups[group.id]
              const title = def ? resolveChromeLabel(t, def) : group.id
              const pinned = group.id === FULLSCREEN_GROUP_ID
              const movableIndex = movableIds.indexOf(group.id)
              return (
                <section
                  key={group.id}
                  className={[
                    styles.group,
                    draggingId === group.id ? styles.groupDragging : '',
                    dropTargetId === group.id ? styles.groupDropTarget : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-toolbar-customize-group={group.id}
                  aria-label={title}
                  onDragOver={(event) => onDragOver(event, group.id)}
                  onDrop={(event) => onDrop(event, group.id)}
                  onDragLeave={() => {
                    if (dropTargetId === group.id) setDropTargetId(null)
                  }}
                >
                  <div className={styles.groupHeader}>
                    <button
                      type="button"
                      className={styles.dragHandle}
                      draggable={!locked && !pinned}
                      disabled={locked || pinned}
                      aria-label={t('customizeToolbarDragHandle')}
                      onDragStart={(event) => onDragStart(event, group.id)}
                      onDragEnd={onDragEnd}
                    >
                      <DragHandleIcon />
                    </button>
                    <span className={styles.groupTitle}>{title}</span>
                    <button
                      type="button"
                      className={styles.moveButton}
                      disabled={locked || pinned || movableIndex <= 0}
                      aria-label={t('customizeToolbarMoveUp')}
                      onClick={() => onChange(moveToolbarGroupByOffset(settings, groups, group.id, -1))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.moveButton}
                      disabled={locked || pinned || movableIndex < 0 || movableIndex >= movableIds.length - 1}
                      aria-label={t('customizeToolbarMoveDown')}
                      onClick={() => onChange(moveToolbarGroupByOffset(settings, groups, group.id, 1))}
                    >
                      ↓
                    </button>
                  </div>
                  <div className={styles.items}>
                    {group.items.map((itemId) => {
                      const item = catalog.items[itemId]
                      if (!item) return null
                      const Icon = item.icon
                      const itemTitle = resolveChromeLabel(t, item)
                      const checkboxId = `${titleId}-${group.id}-${itemId}`
                      const checked = !hidden.has(itemId)
                      return (
                        <label key={itemId} className={styles.item} htmlFor={checkboxId}>
                          <span className={styles.itemIcon} aria-hidden="true">
                            {Icon ? <Icon /> : itemTitle.slice(0, 2)}
                          </span>
                          <span className={styles.itemTitle}>{itemTitle}</span>
                          <input
                            id={checkboxId}
                            className={styles.itemCheckbox}
                            type="checkbox"
                            checked={checked}
                            disabled={locked}
                            aria-label={`${itemTitle}: ${t('customizeToolbarItemVisible')}`}
                            onChange={(event) =>
                              onChange(
                                toggleToolbarItemHidden(settings, groups, itemId, event.target.checked),
                              )
                            }
                          />
                        </label>
                      )
                    })}
                  </div>
                </section>
              )
            })
          )}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.action} disabled={locked} onClick={onReset}>
            {t('customizeToolbarDialogReset')}
          </button>
          <button
            type="button"
            className={styles.action}
            aria-label={t('customizeToolbarDialogCloseAria')}
            onClick={onClose}
          >
            {t('customizeToolbarDialogClose')}
          </button>
        </div>
      </div>
    </div>
      </ChromePortal>
    )
}
