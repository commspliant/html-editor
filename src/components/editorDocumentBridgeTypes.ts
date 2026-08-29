import type { MutableRefObject } from 'react'
import type { PageStore, PagesCommitResult } from '../hooks/usePageStore'

export type EditorDocumentBridgeHandle = {
  pageStore: PageStore
  setHtml: (html: string) => void
  setStorageHtml: (html: string) => void
  getEditorHtml: () => string
  replacePagesFromHistory: (pages: readonly string[]) => PagesCommitResult
}

export type EditorDocumentBridgeRef = MutableRefObject<EditorDocumentBridgeHandle | null>
