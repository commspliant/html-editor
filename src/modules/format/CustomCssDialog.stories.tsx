import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { CustomCssDialog } from './CustomCssDialog'

const meta = {
  title: 'Format/CustomCssDialog',
  component: CustomCssDialog,
  args: {
    open: true,
    value: 'color: red;\nfont-size: 12px;',
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
} satisfies Meta<typeof CustomCssDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    value: '',
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
