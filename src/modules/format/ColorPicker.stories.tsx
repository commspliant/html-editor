import type { Meta, StoryObj } from '@storybook/react'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ColorPicker } from './ColorPicker'

const meta = {
  title: 'Format/ColorPicker',
  component: ColorPicker,
  args: {
    value: '#ff0000',
    mixed: false,
    noneLabel: 'Automatic',
    ariaLabel: 'Font color',
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <div style={{ padding: '0.5rem', background: '#fff', width: '16rem' }}>
          <Story />
        </div>
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof ColorPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Defaults: Story = {}

export const CustomOpen: Story = {
  args: {
    value: '#4a86e8',
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button[aria-expanded="false"]')
    if (button instanceof HTMLButtonElement) button.click()
  },
}

export const Highlight: Story = {
  args: {
    noneLabel: 'No color',
    ariaLabel: 'Highlight color',
    value: '#ffff00',
    fallbackCustom: '#ffff00',
  },
}

export const Automatic: Story = {
  args: {
    value: null,
  },
}

export const Spanish: Story = {
  args: {
    noneLabel: 'Automático',
    ariaLabel: 'Color de fuente',
  },
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}
