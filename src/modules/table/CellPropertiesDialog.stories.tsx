import type { Meta, StoryObj } from '@storybook/react'
import { defaultCellPropertiesApply } from '../../core/cellProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { CellPropertiesDialog } from './CellPropertiesDialog'

const meta = {
  title: 'Table/CellPropertiesDialog',
  component: CellPropertiesDialog,
  args: {
    open: true,
    value: defaultCellPropertiesApply({
      backgroundColor: '#f5f5f5',
      verticalAlign: 'middle',
      padding: {
        top: { value: 8, unit: 'px' },
        right: { value: 8, unit: 'px' },
        bottom: { value: 8, unit: 'px' },
        left: { value: 8, unit: 'px' },
      },
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
} satisfies Meta<typeof CellPropertiesDialog>

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
