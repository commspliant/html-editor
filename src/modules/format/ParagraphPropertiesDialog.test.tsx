import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyParagraphPropertiesApply } from '../../core/paragraphProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ParagraphPropertiesDialog } from './ParagraphPropertiesDialog'

describe('ParagraphPropertiesDialog', () => {
  it('applies alignment and list on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphPropertiesDialog
          open
          tab="general"
          value={emptyParagraphPropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('radio', { name: 'Align center' }))
    await user.click(screen.getByRole('button', { name: 'Bullet list' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        align: 'center',
        alignMixed: false,
        list: 'ul',
        listMixed: false,
      }),
    )
  })

  it('closes without applying on Cancel', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphPropertiesDialog
          open
          tab="general"
          value={emptyParagraphPropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('switches to the Spacing tab', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphPropertiesDialog
          open
          tab="general"
          value={emptyParagraphPropertiesApply()}
          onTabChange={onTabChange}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Spacing' }))
    expect(onTabChange).toHaveBeenCalledWith('spacing')
  })

  it('edits spacing on the Spacing tab', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphPropertiesDialog
          open
          tab="spacing"
          value={emptyParagraphPropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    const margin = screen.getByLabelText('Margin')
    await user.clear(margin)
    await user.type(margin, '8')
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply.mock.calls[0][0].margin.top).toEqual({ value: 8, unit: 'pt' })
    expect(onApply.mock.calls[0][0].marginMixed).toBe(false)
  })

  it('shows Border and Background tabs', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphPropertiesDialog
          open
          tab="general"
          value={emptyParagraphPropertiesApply()}
          onTabChange={onTabChange}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Border' }))
    expect(onTabChange).toHaveBeenCalledWith('border')
    await user.click(screen.getByRole('tab', { name: 'Background' }))
    expect(onTabChange).toHaveBeenCalledWith('background')
  })

  it('picks a background color and opacity on the Background tab', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphPropertiesDialog
          open
          tab="background"
          value={emptyParagraphPropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Background color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    const opacity = screen.getByLabelText('Opacity')
    await user.clear(opacity)
    await user.type(opacity, '40')
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundColor: '#ff0000',
        backgroundMixed: false,
        opacity: 0.4,
        opacityMixed: false,
      }),
    )
  })
})
