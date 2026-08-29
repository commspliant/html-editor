import type { ReactNode } from 'react'
import { EditorToolbar } from '../toolbar'
import type { EditorToolbarProps } from '../toolbar/EditorToolbar'
import type { ToolbarPosition } from '../types'
import styles from './Editor.module.css'

type EditorWorkspaceFrameProps = {
  toolbarVisible: boolean
  toolbarPos: ToolbarPosition
  captureChromeSelection: () => void
  toolbarShellProps: Omit<EditorToolbarProps, 'menuVisible' | 'toolbarVisible' | 'position'>
  children: ReactNode
}

export function EditorWorkspaceFrame({
  toolbarVisible,
  toolbarPos,
  captureChromeSelection,
  toolbarShellProps,
  children,
}: EditorWorkspaceFrameProps) {
  return (
    <div
      className={styles.body}
      data-icon-dock={toolbarVisible ? toolbarPos : undefined}
    >
      {toolbarVisible && (toolbarPos === 'top' || toolbarPos === 'left') ? (
        <div className={styles.iconChrome} onPointerDownCapture={captureChromeSelection}>
          <EditorToolbar
            {...toolbarShellProps}
            menuVisible={false}
            toolbarVisible
            position={toolbarPos}
          />
        </div>
      ) : null}
      {children}
      {toolbarVisible && (toolbarPos === 'bottom' || toolbarPos === 'right') ? (
        <div className={styles.iconChrome} onPointerDownCapture={captureChromeSelection}>
          <EditorToolbar
            {...toolbarShellProps}
            menuVisible={false}
            toolbarVisible
            position={toolbarPos}
          />
        </div>
      ) : null}
    </div>
  )
}
