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
    openImageProperties: noop,
    applyImageProperties: noop,
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
    cut: asyncNoop,
    copy: asyncNoop,
    deleteSelection: noop,
    clearFormatting: noop,
    ...overrides,
  }
}

function renderMenu(
  kind: ContextMenuKind,
  commands: EditorCommands = stubCommands(),
  onClose = vi.fn(),
  inTable = false,
) {
  render(
    <LocaleProvider>
      <ContextMenu open x={16} y={16} kind={kind} inTable={inTable} commands={commands} onClose={onClose} />
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
    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeDisabled()
  })

  it('enables clipboard and image properties for an image', () => {
    renderMenu('image')

    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Link' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Font properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Paragraph properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeDisabled()
  })

  it('enables table properties when the caret is in a table', () => {
    renderMenu('caret', stubCommands(), vi.fn(), true)

    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeDisabled()
  })

  it('enables image and table properties for an image inside a table', () => {
    renderMenu('image', stubCommands(), vi.fn(), true)

    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeEnabled()
  })

  it('disables clipboard and image properties at the caret', () => {
    renderMenu('caret')

    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Link' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Font properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Paragraph properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeDisabled()
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
