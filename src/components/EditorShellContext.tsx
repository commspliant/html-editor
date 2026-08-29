import { createContext, useContext, type MutableRefObject } from 'react'
import type { EditorDocumentBridgeRef } from './editorDocumentBridgeTypes'

/** Latest shell API; updated each Editor render without re-rendering the document bridge. */
export type EditorShellApi = Record<string, unknown>

export type EditorShellContextValue = {
  shellRef: MutableRefObject<EditorShellApi>
  documentBridgeRef: EditorDocumentBridgeRef
  htmlRef: MutableRefObject<string>
  pagesRef: MutableRefObject<readonly string[]>
}

const EditorShellContext = createContext<EditorShellContextValue | null>(null)

export function EditorShellProvider({
  value,
  children,
}: {
  value: EditorShellContextValue
  children: React.ReactNode
}) {
  return <EditorShellContext.Provider value={value}>{children}</EditorShellContext.Provider>
}

export function useEditorShellContext(): EditorShellContextValue {
  const ctx = useContext(EditorShellContext)
  if (!ctx) {
    throw new Error('useEditorShellContext must be used within EditorShellProvider')
  }
  return ctx
}
