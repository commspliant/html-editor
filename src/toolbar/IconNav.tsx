import { useT } from '../i18n/LocaleProvider'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import { runEditorCommand } from '../core/commandTypes'
import { resolveChromeAria, resolveChromeLabel } from './resolveChrome'
import { ScrollLeftIcon, ScrollRightIcon } from './ScrollChevronIcons'
import { Tooltip } from './Tooltip'
import type { ToolbarCatalog, ToolbarIconGroup } from './types'
import { useIconNavOverflow } from './useIconNavOverflow'
import styles from './Toolbar.module.css'

type IconNavProps = {
  groups: ToolbarIconGroup[]
  catalog: ToolbarCatalog
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
}

export function IconNav({ groups, catalog, commands, queries, disabled }: IconNavProps) {
  const t = useT()
  const { trackRef, innerRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useIconNavOverflow(groups)

  return (
    <div className={styles.iconNav} role="toolbar" aria-label={t('toolbarAria')}>
      {canScrollLeft ? (
        <Tooltip
          label={t('toolbarScrollLeftAria')}
          className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
        >
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('toolbarScrollLeftAria')}
            onClick={scrollLeft}
          >
            <ScrollLeftIcon className={styles.icon} />
          </button>
        </Tooltip>
      ) : null}
      <div ref={trackRef} className={styles.iconTrack} data-icon-track="">
        <div ref={innerRef} className={styles.iconTrackInner}>
          {groups.map((group) => {
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
          })}
        </div>
      </div>
      {canScrollRight ? (
        <Tooltip
          label={t('toolbarScrollRightAria')}
          className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
        >
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('toolbarScrollRightAria')}
            onClick={scrollRight}
          >
            <ScrollRightIcon className={styles.icon} />
          </button>
        </Tooltip>
      ) : null}
    </div>
  )
}
