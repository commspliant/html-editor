import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultImagePropertiesApply } from '../../core/imageProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ImagePropertiesDialog } from './ImagePropertiesDialog'

const populated = defaultImagePropertiesApply({
  sizeMode: 'lock',
  width: { value: 200, unit: 'px' },
  height: { value: 100, unit: 'px' },
  align: 'left',
  objectFit: 'cover',
  objectPosition: 'top left',
  rotateDeg: 15,
  hoverCss: 'opacity: 0.8',
  opacity: 0.9,
})

describe('ImagePropertiesDialog', () => {
  it('shows size fields on the general tab and applies on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <ImagePropertiesDialog
          open
          tab="general"
          value={populated}
          aspectRatio={2}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Image properties' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox', { name: 'Image width' })).toHaveValue('200')
    expect(screen.getByRole('combobox', { name: 'Image height' })).toHaveValue('100')

    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onApply).toHaveBeenCalledWith(populated)
  })

  it('switches to alignment, advanced, and hover tabs', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(
      <LocaleProvider>
        <ImagePropertiesDialog
          open
          tab="general"
          value={populated}
          onTabChange={onTabChange}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Alignment' }))
    expect(onTabChange).toHaveBeenCalledWith('alignment')
    await user.click(screen.getByRole('tab', { name: 'Advanced' }))
    expect(onTabChange).toHaveBeenCalledWith('advanced')
    await user.click(screen.getByRole('tab', { name: 'Hover' }))
    expect(onTabChange).toHaveBeenCalledWith('hover')
  })

  it('shows fit, position, rotation, and hover css for those tabs', () => {
    const { rerender } = render(
      <LocaleProvider>
        <ImagePropertiesDialog
          open
          tab="advanced"
          value={populated}
          onTabChange={() => undefined}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByLabelText('Fit')).toHaveValue('cover')
    expect(screen.getByLabelText('Position')).toHaveValue('top left')
    expect(screen.getByLabelText('Rotation')).toHaveValue('15')

    rerender(
      <LocaleProvider>
        <ImagePropertiesDialog
          open
          tab="hover"
          value={populated}
          onTabChange={() => undefined}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )
    expect(screen.getByLabelText('Custom hover CSS')).toHaveValue('opacity: 0.8')
  })

  it('closes from Cancel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <ImagePropertiesDialog
          open
          tab="general"
          value={defaultImagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={() => undefined}
          onClose={onClose}
        />
      </LocaleProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
