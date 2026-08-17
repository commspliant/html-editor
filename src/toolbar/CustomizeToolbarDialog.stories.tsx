import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { defaultToolbarCatalog } from './defaultCatalog'
import { defaultToolbarLayout } from './defaultLayout'
import { CustomizeToolbarDialog } from './CustomizeToolbarDialog'

const meta = {
  title: 'Toolbar/CustomizeToolbarDialog',
  component: CustomizeToolbarDialog,
  args: {
    open: true,
    catalog: defaultToolbarCatalog,
    groups: defaultToolbarLayout.iconGroups,
    settings: null,
    onChange: () => undefined,
    onReset: () => undefined,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof CustomizeToolbarDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const HiddenPrint: Story = {
  args: {
    settings: {
      groupOrder: defaultToolbarLayout.iconGroups.map((group) => group.id),
      hiddenItemIds: ['print'],
    },
  },
}

export const Loading: Story = {
  args: {
    loading: true,
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
