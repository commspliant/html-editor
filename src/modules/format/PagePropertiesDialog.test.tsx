import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyPagePropertiesApply } from '../../core/pageProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { PagePropertiesDialog } from './PagePropertiesDialog'

describe('PagePropertiesDialog', () => {
  it('starts on Font like Add paragraph style, with a Paragraph tab', () => {
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="font"
          value={emptyPagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Page properties' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Font' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox', { name: 'Font size' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Bold' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Paragraph' })).toBeInTheDocument()
  })

  it('shows Spacing, Border, and Background on the Paragraph tab, not General', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="font"
          value={emptyPagePropertiesApply()}
          onTabChange={onTabChange}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Paragraph' }))
    expect(onTabChange).toHaveBeenCalledWith('paragraph')
  })

  it('shows paragraph box tabs when opened on Paragraph', () => {
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="paragraph"
          value={emptyPagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('tab', { name: 'Paragraph' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Spacing' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('tab', { name: 'General' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Border' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Background' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Background Image' })).toBeInTheDocument()
  })

  it('applies a background image from the Background Image tab', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="paragraph"
          value={emptyPagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Background Image' }))
    await user.click(screen.getByRole('radio', { name: 'Image URL' }))
    await user.type(screen.getByLabelText('Image URL'), 'https://example.com/bg.png')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundImage: expect.objectContaining({
          src: 'https://example.com/bg.png',
          width: { value: 100, unit: '%' },
          height: null,
        }),
      }),
    )
  })

  it('picks a background color and opacity on the Background tab', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="paragraph"
          value={emptyPagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('tab', { name: 'Background' }))
    await user.click(screen.getByRole('button', { name: 'Background color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    const opacity = screen.getByLabelText('Opacity')
    await user.clear(opacity)
    await user.type(opacity, '40')
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        box: expect.objectContaining({
          backgroundColor: '#ff0000',
          backgroundMixed: false,
          opacity: 0.4,
          opacityMixed: false,
        }),
      }),
    )
  })

  it('applies font color from the Font tab on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="font"
          value={emptyPagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Font color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    await user.click(screen.getByRole('checkbox', { name: 'Bold' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        font: expect.objectContaining({
          fontColor: '#ff0000',
          marks: expect.objectContaining({ bold: true }),
        }),
      }),
    )
  })

  it('closes without applying on Cancel', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="font"
          value={emptyPagePropertiesApply()}
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

  it('shows the Print tab and calls onResetAtRule', async () => {
    const user = userEvent.setup()
    const onResetAtRule = vi.fn()
    render(
      <LocaleProvider>
        <PagePropertiesDialog
          open
          tab="print"
          value={emptyPagePropertiesApply()}
          onTabChange={() => undefined}
          onApply={() => undefined}
          onResetAtRule={onResetAtRule}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('tab', { name: 'Print' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('button', { name: 'Remove @page print settings from this page' }))
    expect(onResetAtRule).toHaveBeenCalledTimes(1)
  })
})
