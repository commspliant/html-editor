import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ChromePortal } from '../chrome/ChromeTheme'
import { useT } from '../i18n/LocaleProvider'
import { CloseIcon, CommspliantShieldIcon, MenuIcon } from '../icons'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import { runEditorCommand } from '../core/commandTypes'
import { resolveChromeAria, resolveChromeLabel } from './resolveChrome'
import { Tooltip } from './Tooltip'
import {
  isMenuSeparator,
  isMenuSubmenu,
  type ToolbarCatalog,
  type ToolbarItem,
  type ToolbarMenuDef,
  type ToolbarMenuEntry,
  type ToolbarSubmenuEntry,
} from './types'
import styles from './Toolbar.module.css'

type MenuVariant = 'dropdown' | 'overlay'

const MENU_CUSTOM_VARS = [
  '--wysiwyg-menu-color',
  '--wysiwyg-menu-background',
  '--wysiwyg-menu-font-size',
  '--wysiwyg-menu-font-family',
] as const

function readMenuCustomVars(from: HTMLElement): CSSProperties {
  const style: Record<string, string> = {}
  for (const name of MENU_CUSTOM_VARS) {
    const computed = getComputedStyle(from).getPropertyValue(name).trim()
    if (computed) {
      style[name] = computed
      continue
    }
    let node: HTMLElement | null = from
    while (node) {
      const inline = node.style.getPropertyValue(name).trim()
      if (inline) {
        style[name] = inline
        break
      }
      node = node.parentElement
    }
  }
  return style
}

type MenuBarProps = {
  menus: { id: string; items: ToolbarMenuEntry[] }[]
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  compact?: boolean
  openMenuId: string | null
  onOpenMenuIdChange: (id: string | null) => void
}

export function MenuBar({
  menus,
  catalog,
  commands,
  queries,
  disabled,
  compact,
  openMenuId,
  onOpenMenuIdChange,
}: MenuBarProps) {
  const t = useT()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayMenuStyle, setOverlayMenuStyle] = useState<CSSProperties>({})
  const menuBarRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false)
    onOpenMenuIdChange(null)
  }, [onOpenMenuIdChange])

  useLayoutEffect(() => {
    if (!overlayOpen || !menuBarRef.current) return
    setOverlayMenuStyle(readMenuCustomVars(menuBarRef.current))
  }, [overlayOpen])

  useEffect(() => {
    if (!overlayOpen) return
    closeButtonRef.current?.focus()
  }, [overlayOpen])

  useEffect(() => {
    if (!overlayOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [overlayOpen])

  useEffect(() => {
    if (!overlayOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      if (openMenuId) {
        onOpenMenuIdChange(null)
        return
      }
      closeOverlay()
      hamburgerRef.current?.focus()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        closeOverlay()
        hamburgerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [overlayOpen, openMenuId, onOpenMenuIdChange, closeOverlay])

  const renderMenus = (variant: MenuVariant) =>
    menus.map((menu) => {
      const def = catalog.menus[menu.id]
      if (!def) return null
      return (
        <ToolbarMenu
          key={`${variant}-${menu.id}`}
          def={def}
          itemIds={menu.items}
          catalog={catalog}
          commands={commands}
          queries={queries}
          disabled={disabled}
          variant={variant}
          open={
            variant === 'overlay'
              ? openMenuId === menu.id
              : !overlayOpen && openMenuId === menu.id
          }
          onOpenChange={(open) => onOpenMenuIdChange(open ? menu.id : null)}
          onItemRun={variant === 'overlay' ? () => {
            closeOverlay()
            hamburgerRef.current?.focus()
          } : undefined}
        />
      )
    })

  return (
    <div className={styles.menuBar} ref={menuBarRef}>
      <Tooltip label={t('brandMarkAria')}>
        <span className={styles.brandMark} role="img" aria-label={t('brandMarkAria')}>
          <CommspliantShieldIcon className={styles.brandMarkIcon} />
        </span>
      </Tooltip>
      <div
        className={styles.menuBarCompact}
        hidden={compact === undefined ? undefined : !compact}
      >
        <Tooltip label={t('menuHamburgerAria')}>
          <button
            ref={hamburgerRef}
            type="button"
            className={`${styles.menuButton} ${styles.hamburgerButton}`}
            aria-haspopup="dialog"
            aria-expanded={overlayOpen}
            aria-label={t('menuHamburgerAria')}
            disabled={disabled}
            onClick={() => {
              if (overlayOpen) {
                closeOverlay()
                return
              }
              onOpenMenuIdChange(null)
              setOverlayOpen(true)
            }}
          >
            <MenuIcon className={styles.icon} />
          </button>
        </Tooltip>
      </div>
      <div
        className={styles.menuBarDesktop}
        hidden={compact === undefined ? undefined : compact}
      >
        {renderMenus('dropdown')}
      </div>
      {overlayOpen ? (
        <ChromePortal>
          <div className={styles.toolbar} data-menu-overlay-portal="" style={overlayMenuStyle}>
            <div
              ref={overlayRef}
              className={styles.menuOverlay}
              role="dialog"
              aria-modal="true"
              aria-label={t('menuOverlayAria')}
            >
              <div className={styles.menuOverlayHeader}>
                <span className={styles.menuOverlayTitle}>{t('menuOverlayAria')}</span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className={styles.iconButton}
                  aria-label={t('menuCloseAria')}
                  onClick={() => {
                    closeOverlay()
                    hamburgerRef.current?.focus()
                  }}
                >
                  <CloseIcon className={styles.icon} />
                </button>
              </div>
              <div className={styles.menuOverlayBody}>{renderMenus('overlay')}</div>
            </div>
          </div>
        </ChromePortal>
      ) : null}
    </div>
  )
}

function isRenderableMenuEntry(entry: ToolbarMenuEntry, catalog: ToolbarCatalog): boolean {
  if (isMenuSeparator(entry)) return false
  if (isMenuSubmenu(entry)) {
    const def = catalog.submenus?.[entry.submenu]
    if (!def) return false
    if (def.panel) return true
    return entry.items.some((child) => isRenderableMenuEntry(child, catalog))
  }
  return Boolean(catalog.items[entry]?.command)
}

function shouldRenderMenuSeparator(
  entries: ToolbarMenuEntry[],
  index: number,
  catalog: ToolbarCatalog,
): boolean {
  if (!isMenuSeparator(entries[index])) return false

  const hasItemAfter = entries
    .slice(index + 1)
    .some((entry) => isRenderableMenuEntry(entry, catalog))
  if (!hasItemAfter) return false

  let sawSeparator = false
  for (let i = index - 1; i >= 0; i--) {
    const entry = entries[i]
    if (isMenuSeparator(entry)) {
      sawSeparator = true
      continue
    }
    if (isRenderableMenuEntry(entry, catalog)) {
      return !sawSeparator
    }
  }
  return false
}

type ToolbarMenuProps = {
  def: ToolbarMenuDef
  itemIds: ToolbarMenuEntry[]
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  variant: MenuVariant
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemRun?: () => void
}

function ToolbarMenu({
  def,
  itemIds,
  catalog,
  commands,
  queries,
  disabled,
  variant,
  open,
  onOpenChange,
  onItemRun,
}: ToolbarMenuProps) {
  const t = useT()
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = variant === 'overlay' ? `overlay-${def.id}-menu` : `${def.id}-menu`
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setOpenSubmenuId(null)
  }, [open])

  useEffect(() => {
    if (!open || variant === 'overlay') return

    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      if (openSubmenuId) {
        setOpenSubmenuId(null)
        return
      }
      onOpenChange(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open, openSubmenuId, onOpenChange, variant])

  const closeMenu = () => {
    onOpenChange(false)
    onItemRun?.()
  }

  return (
    <div className={styles.menuWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.menuButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={resolveChromeAria(t, def)}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        {resolveChromeLabel(t, def)}
      </button>
      {open ? (
        <div className={styles.menu} role="menu" id={menuId}>
          <MenuEntries
            entries={itemIds}
            catalog={catalog}
            commands={commands}
            queries={queries}
            disabled={disabled}
            variant={variant}
            onClose={closeMenu}
            openSubmenuId={openSubmenuId}
            onOpenSubmenuIdChange={setOpenSubmenuId}
          />
        </div>
      ) : null}
    </div>
  )
}

type MenuEntriesProps = {
  entries: ToolbarMenuEntry[]
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  variant: MenuVariant
  onClose: () => void
  openSubmenuId?: string | null
  onOpenSubmenuIdChange?: (id: string | null) => void
}

function MenuEntries({
  entries,
  catalog,
  commands,
  queries,
  disabled,
  variant,
  onClose,
  openSubmenuId,
  onOpenSubmenuIdChange,
}: MenuEntriesProps) {
  return (
    <>
      {entries.map((entry, index) => {
        if (isMenuSeparator(entry)) {
          if (!shouldRenderMenuSeparator(entries, index, catalog)) return null
          return <div key={`separator-${index}`} role="separator" className={styles.menuSeparator} />
        }
        if (isMenuSubmenu(entry)) {
          return (
            <SubmenuItem
              key={`submenu-${entry.submenu}-${index}`}
              entry={entry}
              catalog={catalog}
              commands={commands}
              queries={queries}
              disabled={disabled}
              variant={variant}
              onClose={onClose}
              open={openSubmenuId === entry.submenu}
              onOpenChange={(next) => onOpenSubmenuIdChange?.(next ? entry.submenu : null)}
            />
          )
        }
        const item = catalog.items[entry]
        if (!item || !item.command) return null
        return (
          <MenuItemButton
            key={entry}
            item={item}
            commands={commands}
            queries={queries}
            disabled={disabled}
            onClose={onClose}
          />
        )
      })}
    </>
  )
}

type MenuItemButtonProps = {
  item: ToolbarItem
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  onClose: () => void
}

function MenuItemButton({ item, commands, queries, disabled, onClose }: MenuItemButtonProps) {
  const t = useT()
  if (!item.command) return null
  const Icon = item.icon
  const command = item.command
  const checked = item.active ? queries[item.active]() : undefined
  const unavailable = item.enabled ? !queries[item.enabled]() : false
  const role = item.toggle ? 'menuitemcheckbox' : item.active ? 'menuitemradio' : 'menuitem'
  return (
    <button
      type="button"
      role={role}
      className={styles.menuItem}
      aria-checked={checked}
      disabled={disabled || unavailable}
      onClick={() => {
        onClose()
        runEditorCommand(commands, command)
      }}
    >
      {Icon ? <Icon className={styles.icon} /> : null}
      {resolveChromeLabel(t, item)}
    </button>
  )
}

type SubmenuItemProps = {
  entry: ToolbarSubmenuEntry
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  variant: MenuVariant
  onClose: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SubmenuItem({
  entry,
  catalog,
  commands,
  queries,
  disabled,
  variant,
  onClose,
  open,
  onOpenChange,
}: SubmenuItemProps) {
  const t = useT()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [openChildId, setOpenChildId] = useState<string | null>(null)
  const def = catalog.submenus?.[entry.submenu]
  const menuId = variant === 'overlay' ? `overlay-${entry.submenu}-submenu` : `${entry.submenu}-submenu`
  const Panel = def?.panel
  const unavailable = def?.enabled ? !queries[def.enabled]() : false
  const overlay = variant === 'overlay'

  useEffect(() => {
    if (!open) setOpenChildId(null)
  }, [open])

  if (!def || (!Panel && !entry.items.some((child) => isRenderableMenuEntry(child, catalog)))) {
    return null
  }

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      onOpenChange(true)
      requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLButtonElement>(
          '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]',
        )
        first?.focus()
      })
    }
  }

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      onOpenChange(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div
      className={styles.submenuWrap}
      onMouseEnter={overlay ? undefined : () => onOpenChange(true)}
      onMouseLeave={overlay ? undefined : () => onOpenChange(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        role="menuitem"
        className={`${styles.menuItem} ${styles.submenuTrigger}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={resolveChromeAria(t, def)}
        disabled={disabled || unavailable}
        onClick={() => onOpenChange(overlay ? !open : true)}
        onKeyDown={onTriggerKeyDown}
      >
        {resolveChromeLabel(t, def)}
      </button>
      {open ? (
        <div
          ref={panelRef}
          className={`${styles.menu} ${styles.submenu}`}
          role="menu"
          id={menuId}
          aria-label={resolveChromeAria(t, def)}
          onKeyDown={onPanelKeyDown}
        >
          {Panel ? (
            <Panel
              commands={commands}
              queries={queries}
              disabled={disabled || unavailable}
              onMenuClose={onClose}
            />
          ) : (
            <MenuEntries
              entries={entry.items}
              catalog={catalog}
              commands={commands}
              queries={queries}
              disabled={disabled}
              variant={variant}
              onClose={onClose}
              openSubmenuId={openChildId}
              onOpenSubmenuIdChange={setOpenChildId}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
