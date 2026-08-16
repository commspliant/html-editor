import type { Meta, StoryObj } from '@storybook/react'
import { emptyParagraphPropertiesApply } from '../../core/paragraphProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ParagraphPropertiesDialog } from './ParagraphPropertiesDialog'

const value = emptyParagraphPropertiesApply()

const meta = {
  title: 'Format/ParagraphPropertiesDialog',
  component: ParagraphPropertiesDialog,
  args: {
    open: true,
    tab: 'general',
    value,
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
} satisfies Meta<typeof ParagraphPropertiesDialog>

export default meta
type Story = StoryObj<typeof meta>

export const General: Story = {}

export const Spacing: Story = {
  args: {
    tab: 'spacing',
    value: {
      ...value,
      margin: {
        top: { value: 8, unit: 'pt' },
        right: { value: 8, unit: 'pt' },
        bottom: { value: 8, unit: 'pt' },
        left: { value: 8, unit: 'pt' },
      },
      lineHeight: { kind: 'number', value: 1.5 },
    },
  },
}

export const Border: Story = {
  args: {
    tab: 'border',
    value: {
      ...value,
      border: { style: 'dotted', width: { value: 1, unit: 'px' }, color: '#cc0000' },
      borderRadius: { value: 6, unit: 'px' },
      boxShadow: {
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' },
        spread: { value: 0, unit: 'px' },
        color: '#000000',
        inset: false,
      },
    },
  },
}

export const Background: Story = {
  args: {
    tab: 'background',
    value: {
      ...value,
      backgroundColor: '#ccffff',
      opacity: 0.8,
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
