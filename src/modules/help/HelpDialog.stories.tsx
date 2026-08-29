import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { HelpDialog } from './HelpDialog'

const meta = {
  title: 'Help/HelpDialog',
  component: HelpDialog,
  args: {
    open: true,
    topicId: 'getStarted' as const,
    onTopicChange: () => undefined,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof HelpDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const KeyboardShortcuts: Story = {
  args: {
    topicId: 'keyboardShortcuts',
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
