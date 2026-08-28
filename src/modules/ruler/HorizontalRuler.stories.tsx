import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { HorizontalRuler } from './HorizontalRuler'

const meta = {
  title: 'Ruler/HorizontalRuler',
  component: HorizontalRuler,
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
    indentState: {
      firstLineIndentPx: 0,
      leftIndentPx: 0,
      rightIndentPx: 0,
      mixed: false,
    },
    unit: 'in',
    zoomScale: 1,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <div style={{ padding: '2rem', background: '#f0f0f0', display: 'flex', justifyContent: 'center' }}>
          <Story />
        </div>
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof HorizontalRuler>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultLetter: Story = {}

export const WithParagraphIndents: Story = {
  args: {
    indentState: {
      firstLineIndentPx: 48,
      leftIndentPx: 48,
      rightIndentPx: 48,
      mixed: false,
    },
  },
}

export const HangingIndent: Story = {
  args: {
    indentState: {
      firstLineIndentPx: -48,
      leftIndentPx: 96,
      rightIndentPx: 0,
      mixed: false,
    },
  },
}

export const MixedIndents: Story = {
  args: {
    indentState: {
      firstLineIndentPx: 0,
      leftIndentPx: 0,
      rightIndentPx: 0,
      mixed: true,
    },
  },
}

export const CustomMargins: Story = {
  args: {
    geometry: {
      pageWidthPx: 816,
      pageHeightPx: 1056,
      marginsPx: {
        top: 144,
        right: 144,
        bottom: 144,
        left: 144,
      },
    },
  },
}
