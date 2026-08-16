import type { Meta, StoryObj } from '@storybook/react'
import { emptyPagePropertiesApply } from '../../core/pageProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { PagePropertiesDialog } from './PagePropertiesDialog'

const value = emptyPagePropertiesApply()

const meta = {
  title: 'Format/PagePropertiesDialog',
  component: PagePropertiesDialog,
  args: {
    open: true,
    tab: 'font',
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
} satisfies Meta<typeof PagePropertiesDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Font: Story = {
  args: {
    tab: 'font',
    value: {
      ...value,
      font: {
        ...value.font,
        size: 14,
        unit: 'pt',
        fontColor: '#cc0000',
        marks: { ...value.font.marks, italic: true },
      },
    },
  },
}

export const Spacing: Story = {
  args: {
    tab: 'paragraph',
    value: {
      ...value,
      box: {
        ...value.box,
        padding: {
          top: { value: 24, unit: 'pt' },
          right: { value: 24, unit: 'pt' },
          bottom: { value: 24, unit: 'pt' },
          left: { value: 24, unit: 'pt' },
        },
        lineHeight: { kind: 'number', value: 1.5 },
      },
    },
  },
}

export const Border: Story = {
  args: {
    tab: 'paragraph',
    value: {
      ...value,
      box: {
        ...value.box,
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
  },
}

export const Background: Story = {
  args: {
    tab: 'paragraph',
    value: {
      ...value,
      box: {
        ...value.box,
        backgroundColor: '#ccffff',
        opacity: 0.8,
      },
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
