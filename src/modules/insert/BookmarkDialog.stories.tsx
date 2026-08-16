import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { BookmarkDialog } from './BookmarkDialog'

const meta = {
  title: 'Insert/BookmarkDialog',
  component: BookmarkDialog,
  args: {
    open: true,
    existingIds: ['intro'],
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
} satisfies Meta<typeof BookmarkDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Spanish: Story = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}
