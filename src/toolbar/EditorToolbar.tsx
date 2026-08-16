import { useState } from 'react'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import { IconNav } from './IconNav'
import { MenuBar } from './MenuBar'
import type { ToolbarCatalog, ToolbarLayout } from './types'
import styles from './Toolbar.module.css'

export type EditorToolbarProps = {
  catalog: ToolbarCatalog
  layout: ToolbarLayout
  commands: EditorCommands
  queries: EditorQueries
  disabled?: boolean
  menuVisible?: boolean
  toolbarVisible?: boolean
  compact?: boolean
}

export function EditorToolbar({
  catalog,
  layout,
  commands,
  queries,
  disabled,
  menuVisible = true,
  toolbarVisible = true,
  compact,
}: EditorToolbarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (!menuVisible && !toolbarVisible) {
    return null
  }

  return (
    <div className={styles.toolbar} data-compact={compact ? '' : undefined}>
      {menuVisible ? (
        <MenuBar
          menus={layout.menus}
          catalog={catalog}
          commands={commands}
          queries={queries}
          disabled={disabled}
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
        />
      ) : null}
    </div>
  )
}
