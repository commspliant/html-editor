import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import type { EditorCommands } from '../../core/commandTypes'
import { runEditorCommand } from '../../core/commandTypes'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import styles from './ContextMenu.module.css'

export type ContextMenuKind = 'text' | 'image' | 'caret'

export type ContextMenuProps = {
  open: boolean
  x: number
  y: number
  kind: ContextMenuKind
  inTable?: boolean
  canMergeCells?: boolean
  canUnmergeCells?: boolean
  canDeletePage?: boolean
  canAddComment?: boolean
  commands: EditorCommands
  onClose: () => void
}

type ContextMenuFlags = {
  inTable: boolean
  canMergeCells: boolean
  canUnmergeCells: boolean
  canDeletePage: boolean
  canAddComment: boolean
}

type MenuCommand =
  | 'deleteSelection'
  | 'cut'
  | 'copy'
  | 'openLinkDialog'
  | 'addComment'
  | 'openFontProperties'
  | 'openParagraphProperties'
  | 'openPageProperties'
  | 'deletePage'
  | 'openImageProperties'
  | 'openTableProperties'
  | 'openCellProperties'
  | 'openRowProperties'
  | 'mergeCells'
  | 'unmergeCells'

type MenuEntry =
  | { type: 'separator' }
  | {
      type: 'item'
      command: MenuCommand
      labelKey: MessageKey
      ariaKey: MessageKey
      enabled: (kind: ContextMenuKind, flags: ContextMenuFlags) => boolean
    }

const MENU_PAD = 8

const ENTRIES: MenuEntry[] = [
  {
    type: 'item',
    command: 'deleteSelection',
    labelKey: 'commandDelete',
    ariaKey: 'commandDeleteAria',
    enabled: (kind) => kind === 'text' || kind === 'image',
  },
  {
    type: 'item',
    command: 'cut',
    labelKey: 'commandCut',
    ariaKey: 'commandCutAria',
    enabled: (kind) => kind === 'text' || kind === 'image',
  },
  {
    type: 'item',
    command: 'copy',
    labelKey: 'commandCopy',
    ariaKey: 'commandCopyAria',
    enabled: (kind) => kind === 'text' || kind === 'image',
  },
  { type: 'separator' },
  {
    type: 'item',
    command: 'openLinkDialog',
    labelKey: 'commandLink',
    ariaKey: 'commandLinkAria',
    enabled: (kind) => kind !== 'image',
  },
  {
    type: 'item',
    command: 'addComment',
    labelKey: 'commandInsertComment',
    ariaKey: 'commandInsertCommentAria',
    enabled: (kind, flags) => flags.canAddComment && (kind === 'text' || kind === 'image'),
  },
  { type: 'separator' },
  {
    type: 'item',
    command: 'openFontProperties',
    labelKey: 'commandFontProperties',
    ariaKey: 'commandFontPropertiesAria',
    enabled: (kind) => kind !== 'image',
  },
  {
    type: 'item',
    command: 'openParagraphProperties',
    labelKey: 'commandParagraphProperties',
    ariaKey: 'commandParagraphPropertiesAria',
    enabled: (kind) => kind !== 'image',
  },
  {
    type: 'item',
    command: 'openPageProperties',
    labelKey: 'commandPageProperties',
    ariaKey: 'commandPagePropertiesAria',
    enabled: (kind) => kind !== 'image',
  },
  {
    type: 'item',
    command: 'deletePage',
    labelKey: 'commandDeletePage',
    ariaKey: 'commandDeletePageAria',
    enabled: (_kind, flags) => flags.canDeletePage,
  },
  {
    type: 'item',
    command: 'openImageProperties',
    labelKey: 'commandImageProperties',
    ariaKey: 'commandImagePropertiesAria',
    enabled: (kind) => kind === 'image',
  },
  {
    type: 'item',
    command: 'openTableProperties',
    labelKey: 'commandTableProperties',
    ariaKey: 'commandTablePropertiesAria',
    enabled: (_kind, flags) => flags.inTable,
  },
  {
    type: 'item',
    command: 'openCellProperties',
    labelKey: 'commandCellProperties',
    ariaKey: 'commandCellPropertiesAria',
    enabled: (_kind, flags) => flags.inTable,
  },
  {
    type: 'item',
    command: 'openRowProperties',
    labelKey: 'commandRowProperties',
    ariaKey: 'commandRowPropertiesAria',
    enabled: (_kind, flags) => flags.inTable,
  },
  {
    type: 'item',
    command: 'mergeCells',
    labelKey: 'commandMergeCells',
    ariaKey: 'commandMergeCellsAria',
    enabled: (_kind, flags) => flags.canMergeCells,
  },
  {
    type: 'item',
    command: 'unmergeCells',
    labelKey: 'commandUnmergeCells',
    ariaKey: 'commandUnmergeCellsAria',
    enabled: (_kind, flags) => flags.canUnmergeCells,
  },
]

function getVisibleEntries(kind: ContextMenuKind, flags: ContextMenuFlags): MenuEntry[] {
  const result: MenuEntry[] = []
  let pendingSeparator = false

  for (const entry of ENTRIES) {
    if (entry.type === 'separator') {
      if (result.length > 0) {
        pendingSeparator = true
      }
      continue
    }
    if (!entry.enabled(kind, flags)) continue
    if (pendingSeparator) {
      result.push({ type: 'separator' })
      pendingSeparator = false
    }
    result.push(entry)
  }

  return result
}

function itemSelector(): string {
  return '[role="menuitem"]:not(:disabled)'
}

export function ContextMenu({
  open,
  x,
  y,
  kind,
  inTable = false,
  canMergeCells = false,
  canUnmergeCells = false,
  canDeletePage = false,
  canAddComment = false,
  commands,
  onClose,
}: ContextMenuProps) {
  const t = useT()
  const labelId = useId()
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const node = menuRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const left = Math.max(MENU_PAD, Math.min(x, window.innerWidth - rect.width - MENU_PAD))
    const top = Math.max(MENU_PAD, Math.min(y, window.innerHeight - rect.height - MENU_PAD))
    node.style.left = `${left}px`
    node.style.top = `${top}px`
    node.querySelector<HTMLButtonElement>(itemSelector())?.focus()
  }, [open, x, y, kind])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    const onScroll = () => {
      onClose()
    }
    const onContextMenu = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        event.preventDefault()
        return
      }
      if (event.defaultPrevented) return
      onClose()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [open, onClose])

  if (!open) return null

  const visibleEntries = getVisibleEntries(kind, {
    inTable,
    canMergeCells,
    canUnmergeCells,
    canDeletePage,
    canAddComment,
  })

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>(itemSelector()) ?? [])]
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const next = items[(index + delta + items.length) % items.length]
    event.preventDefault()
    next?.focus()
  }

  return (
      <ChromePortal>

    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      aria-labelledby={labelId}
      style={{ left: x, top: y }}
      onMouseDown={(event) => event.preventDefault()}
      onKeyDown={onMenuKeyDown}
    >
      <span id={labelId} hidden>
        {t('contextMenuAria')}
      </span>
      {visibleEntries.map((entry, index) => {
        if (entry.type === 'separator') {
          return <div key={`separator-${index}`} role="separator" className={styles.separator} />
        }
        return (
          <button
            key={entry.command}
            type="button"
            role="menuitem"
            className={styles.item}
            aria-label={t(entry.ariaKey)}
            onClick={() => {
              onClose()
              runEditorCommand(commands, entry.command)
            }}
          >
            {t(entry.labelKey)}
          </button>
        )
      })}
    </div>
      </ChromePortal>
    )
}
