import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { VerticalRuler } from './VerticalRuler'

const meta = {
  title: 'Ruler/VerticalRuler',
  component: VerticalRuler,
  args: {
    geometry: {
      pageWidthPx: 816,
      pageHeightPx: 1056,
      marginsPx: {
        top: 96,
        right: 96,
        bottom: 96,
        left: 96,
      },
    },
    unit: 'in',
    zoomScale: 1,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <div style={{ padding: '2rem', background: '#f0f0f0', display: 'flex', justifyContent: 'center', height: '1200px' }}>
          <Story />
        </div>
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof VerticalRuler>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultLetter: Story = {}

export const CustomMargins: Story = {
  args: {
    geometry: {
      pageWidthPx: 816,
      pageHeightPx: 1056,
      marginsPx: {
        top: 144,
        right: 96,
        bottom: 144,
        left: 96,
      },
    },
  },
}
