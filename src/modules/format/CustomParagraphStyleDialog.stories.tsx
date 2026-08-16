import type { Meta, StoryObj } from '@storybook/react'
import { emptyFontMarkState } from '../../core/marks'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { CustomParagraphStyleDialog } from './CustomParagraphStyleDialog'

const font = {
  size: 14,
  unit: 'pt' as const,
  marks: emptyFontMarkState(),
  fontFamily: null,
  fontColor: '#cc0000',
  highlightColor: null,
}

const meta = {
  title: 'Format/CustomParagraphStyleDialog',
  component: CustomParagraphStyleDialog,
  args: {
    open: true,
    mode: 'create',
    font,
    onSave: () => undefined,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof CustomParagraphStyleDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {}

export const Edit: Story = {
  args: {
    mode: 'edit',
    styleId: 'quote',
    name: 'Quote',
    font: {
      ...font,
      marks: { ...emptyFontMarkState(), italic: true },
    },
    canDelete: true,
    onDelete: () => undefined,
  },
}

export const Spanish: Story = {
  args: {
    mode: 'edit',
    styleId: 'quote',
    name: 'Cita',
    canDelete: true,
    onDelete: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}

export const ParagraphTab: Story = {
  args: {
    defaultOuterTab: 'paragraph',
  },
}
