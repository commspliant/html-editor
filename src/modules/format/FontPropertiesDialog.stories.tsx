import type { Meta, StoryObj } from '@storybook/react'
import { emptyFontMarkState } from '../../core/marks'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { FontPropertiesDialog } from './FontPropertiesDialog'

const meta = {
  title: 'Format/FontPropertiesDialog',
  component: FontPropertiesDialog,
  args: {
    open: true,
    tab: 'general',
    size: 12,
    unit: 'pt',
    marks: emptyFontMarkState(),
    fontColor: '#cc0000',
    highlightColor: '#ffff00',
    onTabChange: () => undefined,
    onApply: () => undefined,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof FontPropertiesDialog>

export default meta
type Story = StoryObj<typeof meta>

export const General: Story = {}

export const Spanish: Story = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}

export const MarksActive: Story = {
  args: {
    marks: { bold: true, italic: true, underline: false, strikethrough: true },
    size: 18,
    unit: 'px',
  },
}
