import type { Meta, StoryObj } from '@storybook/react-vite'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { CommentPanel } from './CommentPanel'

const meta: Meta<typeof CommentPanel> = {
  title: 'Comments/CommentPanel',
  component: CommentPanel,
  decorators: [
    (Story) => (
      <LocaleProvider locale="en">
        <Story />
      </LocaleProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof CommentPanel>

export const WithMessages: Story = {
  args: {
    locale: 'en',
    commentAuthor: { userId: 'u1', userName: 'Alice' },
    thread: {
      id: 'cmt_1',
      anchor: { type: 'text', text: 'Hello' },
      createdAt: '2026-01-15T10:30:00.000Z',
      messages: [
        {
          id: 'm1',
          userId: 'u1',
          userName: 'Alice',
          message: 'Please review this section.',
          createdAt: '2026-01-15T10:31:00.000Z',
        },
        {
          id: 'm2',
          userId: 'u2',
          userName: 'Bob',
          message: 'Looks good to me.',
          createdAt: '2026-01-15T11:00:00.000Z',
        },
      ],
    },
    onPost: () => undefined,
    onClose: () => undefined,
  },
}

export const EmptyThread: Story = {
  args: {
    locale: 'en',
    commentAuthor: { userId: 'u1', userName: 'Alice' },
    thread: {
      id: 'cmt_2',
      anchor: { type: 'text', text: 'World' },
      createdAt: '2026-01-15T10:30:00.000Z',
      messages: [],
    },
    onPost: () => undefined,
    onClose: () => undefined,
  },
}
