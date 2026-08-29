import { memo, useMemo } from 'react'
import { useT } from '../i18n/LocaleProvider'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import { runEditorCommand } from '../core/commandTypes'
import { resolveChromeAria, resolveChromeLabel } from './resolveChrome'
import { isChromeItemLocked, type ChromeLockOptions } from './commentsChrome'
import { Tooltip } from './Tooltip'
import type { ToolbarCatalog, ToolbarIconGroup, ToolbarItem, ToolbarItemId } from './types'
import { querySlicesForItem } from './toolbarQueryRevisions'
import { useToolbarQuerySlices } from './ToolbarQuerySubscription'
import styles from './Toolbar.module.css'

const FULLSCREEN_ITEM_ID: ToolbarItemId = 'fullscreen'

type IconNavProps = {
  groups: ToolbarIconGroup[]
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  chromeLock?: ChromeLockOptions
}

function splitFullscreenGroups(groups: ToolbarIconGroup[]): {
  main: ToolbarIconGroup[]
  trailing: ToolbarIconGroup | null
} {
  const main: ToolbarIconGroup[] = []
  let trailing: ToolbarIconGroup | null = null

  for (const group of groups) {
    const mainItems = group.items.filter((id) => id !== FULLSCREEN_ITEM_ID)
    if (mainItems.length > 0) {
      main.push({ id: group.id, items: mainItems })
    }
    if (group.items.includes(FULLSCREEN_ITEM_ID)) {
      trailing = { id: FULLSCREEN_ITEM_ID, items: [FULLSCREEN_ITEM_ID] }
    }
  }

  return { main, trailing }
}

type ToolbarIconButtonProps = {
  item: ToolbarItem
  itemId: ToolbarItemId
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  chromeLock?: ChromeLockOptions
}

const ToolbarIconButton = memo(function ToolbarIconButton({
  item,
  itemId,
  commands,
  queries,
  disabled,
  chromeLock,
}: ToolbarIconButtonProps) {
  const t = useT()
  const slices = useMemo(() => querySlicesForItem(item), [item])
  useToolbarQuerySlices(slices)

  if (!item.icon || !item.command) return null
  const Icon = item.icon
  const command = item.command
  const unavailable = item.enabled ? !queries[item.enabled]() : false
  const pressed = item.active ? queries[item.active]() : undefined

  return (
    <Tooltip label={item.tooltip ?? resolveChromeLabel(t, item)}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={resolveChromeAria(t, item)}
        aria-pressed={pressed}
        disabled={
          disabled ||
          (chromeLock ? isChromeItemLocked(itemId, chromeLock) : false) ||
          unavailable
        }
        onPointerDown={(event) => event.preventDefault()}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          runEditorCommand(commands, command)
        }}
      >
        <Icon className={styles.icon} />
      </button>
    </Tooltip>
  )
})

export function IconNav({ groups, catalog, commands, queries, disabled, chromeLock }: IconNavProps) {
  const t = useT()
  const { main, trailing } = splitFullscreenGroups(groups)

  const renderGroup = (group: ToolbarIconGroup) => {
    const def = catalog.groups[group.id]
    return (
      <div
        key={group.id}
        className={styles.iconGroup}
        role="group"
        aria-label={def ? resolveChromeLabel(t, def) : undefined}
        data-toolbar-group={group.id}
      >
        {group.items.map((id) => {
          const item = catalog.items[id]
          if (!item) return null
          const unavailable = item.enabled ? !queries[item.enabled]() : false
          if (item.widget) {
            const Widget = item.widget
            return (
              <Widget
                key={id}
                commands={commands}
                queries={queries}
                disabled={disabled || unavailable}
              />
            )
          }
          if (!item.icon || !item.command) return null
          return (
            <ToolbarIconButton
              key={id}
              itemId={id}
              item={item}
              commands={commands}
              queries={queries}
              disabled={disabled}
              chromeLock={chromeLock}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.iconNav} role="toolbar" aria-label={t('toolbarAria')}>
      {main.length > 0 ? <div className={styles.iconNavMain}>{main.map(renderGroup)}</div> : null}
      {trailing ? <div className={styles.iconNavEnd}>{renderGroup(trailing)}</div> : null}
    </div>
  )
}
