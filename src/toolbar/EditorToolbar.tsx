import { memo, useState } from 'react'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import type { ToolbarPosition } from '../types'
import type { ChromeLockOptions } from './commentsChrome'
import { IconNav } from './IconNav'
import { MenuBar } from './MenuBar'
import type { ToolbarCatalog, ToolbarLayout } from './types'
import type { ToolbarQueryRevisions } from './toolbarQueryRevisions'
import { ToolbarQueryRevisionsProvider } from './ToolbarQuerySubscription'
import styles from './Toolbar.module.css'

export type EditorToolbarProps = {
  catalog: ToolbarCatalog
  layout: ToolbarLayout
  commands: EditorCommands
  queries: EditorQueries
  queryRevisions?: ToolbarQueryRevisions
  disabled?: boolean
  chromeLock?: ChromeLockOptions
  menuVisible?: boolean
  toolbarVisible?: boolean
  compact?: boolean
  position?: ToolbarPosition
}

export const EditorToolbar = memo(function EditorToolbar({
  catalog,
  layout,
  commands,
  queries,
  queryRevisions,
  disabled,
  chromeLock,
  menuVisible = true,
  toolbarVisible = true,
  compact,
  position = 'top',
}: EditorToolbarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (!menuVisible && !toolbarVisible) {
    return null
  }

  const toolbar = (
    <div
      className={styles.toolbar}
      data-compact={compact ? '' : undefined}
      data-toolbar-position={position}
    >
      {menuVisible ? (
        <MenuBar
          menus={layout.menus}
          catalog={catalog}
          commands={commands}
          queries={queries}
          disabled={disabled}
          chromeLock={chromeLock}
          compact={compact}
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
        />
      ) : null}
      {toolbarVisible ? (
        <IconNav
          groups={layout.iconGroups}
          catalog={catalog}
          commands={commands}
          queries={queries}
          disabled={disabled}
          chromeLock={chromeLock}
        />
      ) : null}
    </div>
  )

  if (!queryRevisions) {
    return toolbar
  }

  return (
    <ToolbarQueryRevisionsProvider value={queryRevisions}>{toolbar}</ToolbarQueryRevisionsProvider>
  )
})
