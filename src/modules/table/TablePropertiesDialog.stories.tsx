import type { Meta, StoryObj } from '@storybook/react'
import { defaultTablePropertiesApply } from '../../core/tableProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { TablePropertiesDialog } from './TablePropertiesDialog'

const meta = {
  title: 'Table/TablePropertiesDialog',
  component: TablePropertiesDialog,
  args: {
    open: true,
    value: defaultTablePropertiesApply({
      border: { style: 'solid', width: { value: 1, unit: 'px' }, color: '#000000' },
      borderRadius: { value: 4, unit: 'px' },
    }),
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
} satisfies Meta<typeof TablePropertiesDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SeparateBorders: Story = {
  args: {
    value: defaultTablePropertiesApply({
      borderCollapse: 'separate',
      borderSpacing: { value: 4, unit: 'px' },
    }),
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
