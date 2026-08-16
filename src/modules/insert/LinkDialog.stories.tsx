import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { LinkDialog } from './LinkDialog'

const meta = {
  title: 'Insert/LinkDialog',
  component: LinkDialog,
  args: {
    open: true,
    tab: 'link',
    href: 'https://example.com',
    title: 'Example',
    targetBlank: false,
    textDecorationNone: false,
    hoverMode: 'color',
    hoverColor: null,
    hoverHtml: '',
    bookmarks: [{ id: 'intro' }, { id: 'end' }],
    selectedBookmarkId: '',
    onTabChange: () => undefined,
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
} satisfies Meta<typeof LinkDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Link: Story = {}

export const Bookmark: Story = {
  args: {
    tab: 'bookmark',
    selectedBookmarkId: 'intro',
  },
}

export const EmptyBookmarks: Story = {
  args: {
    tab: 'bookmark',
    bookmarks: [],
  },
}

export const HoverHtml: Story = {
  args: {
    hoverMode: 'html',
    hoverHtml: '<em>Tip</em>',
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
