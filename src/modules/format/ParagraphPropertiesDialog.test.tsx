import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyParagraphPropertiesApply } from '../../core/paragraphProperties'
import { emptyPageBackgroundImageApply } from '../../core/pageBackgroundImage'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ParagraphPropertiesDialog, type ParagraphPropertiesDialogProps } from './ParagraphPropertiesDialog'

const emptyBackgroundImage = emptyPageBackgroundImageApply()

function renderDialog(props: Partial<ParagraphPropertiesDialogProps> = {}) {
  const onTabChange = vi.fn()
  const onApply = vi.fn()
  const onClose = vi.fn()
  render(
    <LocaleProvider>
      <ParagraphPropertiesDialog
        open
        tab="general"
        value={emptyParagraphPropertiesApply()}
        backgroundImage={emptyBackgroundImage}
        onTabChange={onTabChange}
        onApply={onApply}
        onClose={onClose}
        {...props}
      />
    </LocaleProvider>,
  )
  return { onTabChange, onApply, onClose }
}

describe('ParagraphPropertiesDialog', () => {
  it('applies alignment and list on OK', async () => {
    const user = userEvent.setup()
    const { onApply } = renderDialog()

    await user.click(screen.getByRole('radio', { name: 'Align center' }))
    await user.click(screen.getByRole('button', { name: 'Bullet list' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        value: expect.objectContaining({
          align: 'center',
          alignMixed: false,
          list: 'ul',
          listMixed: false,
        }),
        backgroundImage: emptyBackgroundImage,
      }),
    )
  })

  it('closes without applying on Cancel', async () => {
    const user = userEvent.setup()
    const { onApply, onClose } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('switches to the Spacing tab', async () => {
    const user = userEvent.setup()
    const { onTabChange } = renderDialog()

    await user.click(screen.getByRole('tab', { name: 'Spacing' }))
    expect(onTabChange).toHaveBeenCalledWith('spacing')
  })

  it('edits spacing on the Spacing tab', async () => {
    const user = userEvent.setup()
    const { onApply } = renderDialog({ tab: 'spacing' })

    const margin = screen.getByLabelText('Margin')
    await user.clear(margin)
    await user.type(margin, '8')
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply.mock.calls[0][0].value.margin.top).toEqual({ value: 8, unit: 'pt' })
    expect(onApply.mock.calls[0][0].value.marginMixed).toBe(false)
  })

  it('shows Border, Background, and Background Image tabs', async () => {
    const user = userEvent.setup()
    const { onTabChange } = renderDialog()

    await user.click(screen.getByRole('tab', { name: 'Border' }))
    expect(onTabChange).toHaveBeenCalledWith('border')
    await user.click(screen.getByRole('tab', { name: 'Background' }))
    expect(onTabChange).toHaveBeenCalledWith('background')
    await user.click(screen.getByRole('tab', { name: 'Background Image' }))
    expect(onTabChange).toHaveBeenCalledWith('backgroundImage')
  })

  it('picks a background color and opacity on the Background tab', async () => {
    const user = userEvent.setup()
    const { onApply } = renderDialog({ tab: 'background' })

    await user.click(screen.getByRole('button', { name: 'Background color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    const opacity = screen.getByLabelText('Opacity')
    await user.clear(opacity)
    await user.type(opacity, '40')
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        value: expect.objectContaining({
          backgroundColor: '#ff0000',
          backgroundMixed: false,
          opacity: 0.4,
          opacityMixed: false,
        }),
      }),
    )
  })

  it('applies a background image from the Background Image tab', async () => {
    const user = userEvent.setup()
    const { onApply } = renderDialog({ tab: 'backgroundImage' })

    await user.click(screen.getByRole('radio', { name: 'Image URL' }))
    await user.type(screen.getByLabelText('Image URL'), 'https://example.com/bg.png')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundImage: expect.objectContaining({
          src: 'https://example.com/bg.png',
        }),
      }),
    )
  })
})
