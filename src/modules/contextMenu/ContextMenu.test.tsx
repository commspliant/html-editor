import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { EditorCommands } from '../../core/commandTypes'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ContextMenu, type ContextMenuKind } from './ContextMenu'

const noop = () => undefined
const asyncNoop = async () => undefined

function stubCommands(overrides: Partial<EditorCommands> = {}): EditorCommands {
  return {
    save: asyncNoop,
    open: asyncNoop,
    print: noop,
    undo: noop,
    redo: noop,
    setVisualMode: noop,
    setHtmlMode: noop,
    toggleFullscreen: noop,
    openCustomizeToolbar: noop,
    openDocumentPreview: noop,
    toggleReadAloud: noop,
    setLightMode: noop,
    setDarkMode: noop,
    setToolbarPositionTop: noop,
    setToolbarPositionLeft: noop,
    setToolbarPositionRight: noop,
    setToolbarPositionBottom: noop,
    toggleBold: noop,
    toggleItalic: noop,
    toggleUnderline: noop,
    toggleStrikethrough: noop,
    setFontSize: noop,
    setFontSizeUnit: noop,
    setFontFamily: noop,
    setFontColor: noop,
    setHighlightColor: noop,
    setParagraphStyle: noop,
    alignLeft: noop,
    alignCenter: noop,
    alignRight: noop,
    alignJustify: noop,
    indent: noop,
    outdent: noop,
    toggleBulletList: noop,
    toggleNumberedList: noop,
    openFontProperties: noop,
    applyFontProperties: noop,
    openCustomCss: noop,
    applyCustomCss: noop,
    openParagraphProperties: noop,
    applyParagraphProperties: noop,
    openPageProperties: noop,
    applyPageProperties: noop,
    openCustomParagraphStyleDialog: noop,
    applyCustomParagraphStyle: noop,
    openLinkDialog: noop,
    applyLink: noop,
    openBookmarkDialog: noop,
    applyBookmark: noop,
    openImageDialog: noop,
    applyImage: noop,
    openAudioDialog: noop,
    applyAudio: noop,
    openYoutubeDialog: noop,
    applyYoutube: noop,
    openImageProperties: noop,
    applyImageProperties: noop,
    insertHorizontalRule: noop,
    insertPageBreak: noop,
    openTableDialog: noop,
    applyTable: noop,
    openTableProperties: noop,
    applyTableProperties: noop,
    openCellProperties: noop,
    applyCellProperties: noop,
    openRowProperties: noop,
    applyRowProperties: noop,
    insertRowBelow: noop,
    insertRowBefore: noop,
    deleteRow: noop,
    insertColumnAfter: noop,
    insertColumnBefore: noop,
    deleteColumn: noop,
    mergeCells: noop,
    unmergeCells: noop,
    cut: asyncNoop,
    copy: asyncNoop,
    deleteSelection: noop,
    clearFormatting: noop,
    toggleFormatBrush: noop,
    ...overrides,
  }
}

function renderMenu(
  kind: ContextMenuKind,
  commands: EditorCommands = stubCommands(),
  onClose = vi.fn(),
  flags: { inTable?: boolean; canMergeCells?: boolean; canUnmergeCells?: boolean } = {},
) {
  render(
    <LocaleProvider>
      <ContextMenu
        open
        x={16}
        y={16}
        kind={kind}
        inTable={flags.inTable}
        canMergeCells={flags.canMergeCells}
        canUnmergeCells={flags.canUnmergeCells}
        commands={commands}
        onClose={onClose}
      />
    </LocaleProvider>,
  )
  return onClose
}

describe('ContextMenu', () => {
  it('enables clipboard and text commands for a text selection', () => {
    renderMenu('text')

    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Link' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Font properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Paragraph properties' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Image properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Table properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Cell properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Row properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Merge selected cells' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Split merged cells' })).not.toBeInTheDocument()
  })

  it('enables clipboard and image properties for an image', () => {
    renderMenu('image')

    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Link' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Font properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Paragraph properties' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Table properties' })).not.toBeInTheDocument()
  })

  it('enables table properties when the caret is in a table', () => {
    renderMenu('caret', stubCommands(), vi.fn(), { inTable: true })

    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Merge selected cells' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Split merged cells' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Image properties' })).not.toBeInTheDocument()
  })

  it('enables image and table properties for an image inside a table', () => {
    renderMenu('image', stubCommands(), vi.fn(), { inTable: true })

    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeEnabled()
  })

  it('enables merge and unmerge when those operations are available', () => {
    renderMenu('caret', stubCommands(), vi.fn(), {
      inTable: true,
      canMergeCells: true,
      canUnmergeCells: true,
    })

    expect(screen.getByRole('menuitem', { name: 'Merge selected cells' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Split merged cells' })).toBeEnabled()
  })

  it('hides clipboard and image properties at the caret', () => {
    renderMenu('caret')

    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Cut' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Copy' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Link' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Font properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Paragraph properties' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Image properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Table properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Cell properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Row properties' })).not.toBeInTheDocument()
  })

  it('renders separators only between visible groups in caret mode', () => {
    renderMenu('caret')

    expect(screen.getAllByRole('separator')).toHaveLength(1)
  })

  it('renders separators between clipboard, link, and properties groups in text mode', () => {
    renderMenu('text')

    expect(screen.getAllByRole('separator')).toHaveLength(2)
  })

  it('runs the command and closes on click', async () => {
    const user = userEvent.setup()
    const openFontProperties = vi.fn()
    const onClose = renderMenu('text', stubCommands({ openFontProperties }))

    await user.click(screen.getByRole('menuitem', { name: 'Font properties' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(openFontProperties).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = renderMenu('text')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
