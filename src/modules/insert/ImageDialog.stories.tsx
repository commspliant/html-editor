import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ImageDialog } from './ImageDialog'

const meta = {
  title: 'Insert/ImageDialog',
  component: ImageDialog,
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
} satisfies Meta<typeof ImageDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithCustomPicker: Story = {
  args: {
    customImagePicker: {
      text: 'Gallery',
      description: 'Choose from the media library.',
      buttonCaption: 'Open gallery',
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
