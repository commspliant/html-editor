import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { YoutubeDialog } from './YoutubeDialog'

const meta = {
  title: 'Insert/YoutubeDialog',
  component: YoutubeDialog,
  args: {
    open: true,
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
} satisfies Meta<typeof YoutubeDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithCustomPicker: Story = {
  args: {
    customVideoPicker: {
      text: 'Library',
      description: 'Choose from your video library.',
      buttonCaption: 'Open library',
      onPick: () => undefined,
    },
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
