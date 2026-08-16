import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyFontMarkState } from '../../core/marks'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { FontPropertiesDialog } from './FontPropertiesDialog'

describe('FontPropertiesDialog', () => {
  it('applies size and marks on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <FontPropertiesDialog
          open
          tab="general"
          size={12}
          unit="pt"
          marks={emptyFontMarkState()}
          fontColor={null}
          highlightColor={null}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    await user.clear(screen.getByRole('combobox', { name: 'Font size' }))
    await user.type(screen.getByRole('combobox', { name: 'Font size' }), '20')
    await user.click(screen.getByRole('checkbox', { name: 'Italic' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      size: 20,
      unit: 'pt',
      marks: { ...emptyFontMarkState(), italic: true },
      fontFamily: null,
      fontFamilyMixed: false,
      fontColor: null,
      highlightColor: null,
      fontColorMixed: false,
      highlightColorMixed: false,
    })
  })

  it('closes without applying on Cancel', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <FontPropertiesDialog
          open
          tab="general"
          size={12}
          unit="pt"
          marks={emptyFontMarkState()}
          fontColor={null}
          highlightColor={null}
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

  it('converts the draft size when the unit changes and applies on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <FontPropertiesDialog
          open
          tab="general"
          size={12}
          unit="pt"
          marks={emptyFontMarkState()}
          fontColor={null}
          highlightColor={null}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Font size unit' }), 'px')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      size: 16,
      unit: 'px',
      marks: emptyFontMarkState(),
      fontFamily: null,
      fontFamilyMixed: false,
      fontColor: null,
      highlightColor: null,
      fontColorMixed: false,
      highlightColorMixed: false,
    })
  })

  it('applies a picked font color on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <FontPropertiesDialog
          open
          tab="general"
          size={12}
          unit="pt"
          marks={emptyFontMarkState()}
          fontColor={null}
          highlightColor={null}
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Font color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      size: 12,
      unit: 'pt',
      marks: emptyFontMarkState(),
      fontFamily: null,
      fontFamilyMixed: false,
      fontColor: '#ff0000',
      highlightColor: null,
      fontColorMixed: false,
      highlightColorMixed: false,
    })
  })

  it('skips mixed colors that were not changed', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <FontPropertiesDialog
          open
          tab="general"
          size={12}
          unit="pt"
          marks={emptyFontMarkState()}
          fontColor={null}
          fontColorMixed
          highlightColor={null}
          highlightColorMixed
          onTabChange={() => undefined}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      size: 12,
      unit: 'pt',
      marks: emptyFontMarkState(),
      fontFamily: null,
      fontFamilyMixed: false,
      fontColor: null,
      highlightColor: null,
      fontColorMixed: true,
      highlightColorMixed: true,
    })
  })
})
