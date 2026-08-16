import type { Meta, StoryObj } from '@storybook/react'
import { defaultImagePropertiesApply } from '../../core/imageProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ImagePropertiesDialog } from './ImagePropertiesDialog'

const meta = {
  title: 'Insert/ImagePropertiesDialog',
  component: ImagePropertiesDialog,
  args: {
    open: true,
    tab: 'general',
    value: defaultImagePropertiesApply({
      sizeMode: 'lock',
      width: { value: 200, unit: 'px' },
      height: { value: 100, unit: 'px' },
    }),
    aspectRatio: 2,
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
} satisfies Meta<typeof ImagePropertiesDialog>

export default meta
type Story = StoryObj<typeof meta>

export const General: Story = {}

export const Alignment: Story = {
  args: {
    tab: 'alignment',
    value: defaultImagePropertiesApply({ align: 'center' }),
  },
}

export const Border: Story = {
  args: {
    tab: 'border',
    value: defaultImagePropertiesApply({
      border: { style: 'solid', width: { value: 2, unit: 'px' }, color: '#cc0000' },
      borderRadius: { value: 8, unit: 'px' },
      boxShadow: {
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' },
        spread: { value: 0, unit: 'px' },
        color: '#000000',
        inset: false,
      },
    }),
  },
}

export const Advanced: Story = {
  args: {
    tab: 'advanced',
    value: defaultImagePropertiesApply({
      sizeMode: 'lock',
      width: { value: 240, unit: 'px' },
      height: { value: 120, unit: 'px' },
      objectFit: 'cover',
      objectPosition: 'top',
      rotateDeg: 15,
      opacity: 0.85,
    }),
  },
}

export const Hover: Story = {
  args: {
    tab: 'hover',
    value: defaultImagePropertiesApply({
      hoverCss: 'opacity: 0.8; transform: scale(1.02)',
    }),
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
