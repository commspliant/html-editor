import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import type { ChromeLockOptions } from './commentsChrome'
import type { EditorToolbarProps } from './EditorToolbar'
import type { ToolbarCatalog, ToolbarLayout } from './types'
import type { ToolbarQueryRevisions } from './toolbarQueryRevisions'

export type ToolbarShellPropsInput = {
  catalog: ToolbarCatalog
  layout: ToolbarLayout
  commands: EditorCommands
  queries: EditorQueries
  queryRevisions: ToolbarQueryRevisions
  disabled: boolean
  chromeLock: ChromeLockOptions
}

export type ToolbarShellProps = Omit<
  EditorToolbarProps,
  'menuVisible' | 'toolbarVisible' | 'position' | 'compact'
>

export function buildToolbarShellProps(input: ToolbarShellPropsInput): ToolbarShellProps {
  return {
    catalog: input.catalog,
    layout: input.layout,
    commands: input.commands,
    queries: input.queries,
    queryRevisions: input.queryRevisions,
    disabled: input.disabled,
    chromeLock: input.chromeLock,
  }
}
