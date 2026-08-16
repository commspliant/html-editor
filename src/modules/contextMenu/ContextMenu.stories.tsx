import type { Meta, StoryObj } from '@storybook/react'
import type { EditorCommands } from '../../core/commandTypes'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ContextMenu } from './ContextMenu'

const noop = () => undefined
const asyncNoop = async () => undefined

const commands: EditorCommands = {
  save: asyncNoop,
  open: asyncNoop,
  print: noop,
  undo: noop,
  redo: noop,
  setVisualMode: noop,
  setHtmlMode: noop,
  toggleFullscreen: noop,
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
}

const meta = {
  title: 'ContextMenu/ContextMenu',
  component: ContextMenu,
  args: {
    open: true,
    x: 24,
    y: 24,
    kind: 'text',
    commands,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const SelectedText: Story = {}

export const Image: Story = {
  args: {
    kind: 'image',
  },
}

export const Caret: Story = {
  args: {
    kind: 'caret',
  },
}

export const InTable: Story = {
  args: {
    kind: 'caret',
    inTable: true,
  },
}

export const Spanish: Story = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}
