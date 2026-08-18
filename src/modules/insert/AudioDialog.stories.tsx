import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { AudioDialog } from './AudioDialog'

const meta = {
  title: 'Insert/AudioDialog',
  component: AudioDialog,
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
} satisfies Meta<typeof AudioDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithCustomPicker: Story = {
  args: {
    customAudioPicker: {
      text: 'Library',
      description: 'Choose from your audio library.',
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
