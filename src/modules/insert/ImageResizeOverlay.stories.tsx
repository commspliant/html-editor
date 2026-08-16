import type { Meta, StoryObj } from '@storybook/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { writeImagePixelSize } from '../../core/imageResize'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ImageResizeOverlay } from './ImageResizeOverlay'

function OverlayDemo() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useLayoutEffect(() => {
    setImg(imgRef.current)
  }, [])

  return (
    <div style={{ padding: 48 }}>
      <img
        ref={imgRef}
        src="https://placehold.co/240x120/png"
        alt="Demo"
        style={{ width: 240, height: 120, display: 'block' }}
      />
      {img ? (
        <ImageResizeOverlay
          img={img}
          onResize={(width, height) => {
            writeImagePixelSize(img, width, height)
          }}
          onResizeEnd={() => undefined}
        />
      ) : null}
    </div>
  )
}

const meta = {
  title: 'Insert/ImageResizeOverlay',
  component: OverlayDemo,
  decorators: [
    (Story) => (
      <LocaleProvider>
        <Story />
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof OverlayDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Selected: Story = {}

export const Spanish: Story = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}
