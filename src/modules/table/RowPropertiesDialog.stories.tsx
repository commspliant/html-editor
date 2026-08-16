import type { Meta, StoryObj } from '@storybook/react'
import { defaultRowPropertiesApply } from '../../core/rowProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { RowPropertiesDialog } from './RowPropertiesDialog'

const meta = {
  title: 'Table/RowPropertiesDialog',
  component: RowPropertiesDialog,
  args: {
    open: true,
    value: defaultRowPropertiesApply({
      backgroundColor: '#eef6ff',
      height: { value: 36, unit: 'px' },
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
} satisfies Meta<typeof RowPropertiesDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Spanish: Story = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}
