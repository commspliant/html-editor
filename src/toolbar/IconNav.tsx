import { useT } from '../i18n/LocaleProvider'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import { runEditorCommand } from '../core/commandTypes'
import { resolveChromeAria, resolveChromeLabel } from './resolveChrome'
import { Tooltip } from './Tooltip'
import type { ToolbarCatalog, ToolbarIconGroup, ToolbarItemId } from './types'
import styles from './Toolbar.module.css'

const FULLSCREEN_ITEM_ID: ToolbarItemId = 'fullscreen'

type IconNavProps = {
  groups: ToolbarIconGroup[]
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
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

export function IconNav({ groups, catalog, commands, queries, disabled }: IconNavProps) {
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
          const Icon = item.icon
          const command = item.command
          const pressed = item.active ? queries[item.active]() : undefined
          return (
            <Tooltip key={id} label={item.tooltip ?? resolveChromeLabel(t, item)}>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={resolveChromeAria(t, item)}
                aria-pressed={pressed}
                disabled={disabled || unavailable}
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
