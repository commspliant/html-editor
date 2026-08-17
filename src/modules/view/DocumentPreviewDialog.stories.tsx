import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { DocumentPreviewDialog } from './DocumentPreviewDialog'

const SAMPLE = `
<h1>Quarterly update</h1>
<p>Preview renders the current document HTML in a large, scrollable dialog.</p>
<ul>
  <li>Close from the header X</li>
  <li>Close from the footer button</li>
  <li>Escape also dismisses</li>
</ul>
<p>${'Long paragraph. '.repeat(40)}</p>
`.trim()

const meta = {
  title: 'View/DocumentPreviewDialog',
  component: DocumentPreviewDialog,
  args: {
    open: true,
    html: SAMPLE,
    onClose: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof DocumentPreviewDialog>

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
