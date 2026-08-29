import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { AboutDialog } from './AboutDialog'

const meta = {
  title: 'Help/AboutDialog',
  component: AboutDialog,
  args: {
    open: true,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof AboutDialog>

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
