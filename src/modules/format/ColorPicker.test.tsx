import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ColorPicker } from './ColorPicker'
import { resetRecentColors } from './colorModel'

afterEach(() => {
  resetRecentColors()
})

function renderPicker(
  overrides: Partial<Parameters<typeof ColorPicker>[0]> = {},
) {
  const onChange = vi.fn()
  const onCommit = vi.fn()
  const view = render(
    <LocaleProvider>
      <ColorPicker
        value="#ff0000"
        noneLabel="Automatic"
        ariaLabel="Font color"
        onChange={onChange}
        onCommit={onCommit}
        {...overrides}
      />
    </LocaleProvider>,
  )
  return { ...view, onChange, onCommit }
}

describe('ColorPicker', () => {
  it('applies a default swatch', async () => {
    const user = userEvent.setup()
    const { onChange, onCommit } = renderPicker()

    await user.click(screen.getByRole('option', { name: '#000000' }))

    expect(onChange).toHaveBeenCalledWith('#000000')
    expect(onCommit).toHaveBeenCalledWith('#000000')
  })

  it('clears color with Automatic', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker()

    await user.click(screen.getByRole('option', { name: 'Automatic' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('syncs hex input to rgb and remembers the custom color', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker({ value: null })

    await user.click(screen.getByRole('button', { name: 'Custom color' }))
    const hex = screen.getByLabelText('Hex')
    await user.clear(hex)
    await user.type(hex, '#123abc')
    await user.tab()

    expect(onChange).toHaveBeenCalledWith('#123abc')
    expect(screen.getByLabelText('R')).toHaveValue('18')
    expect(screen.getByLabelText('G')).toHaveValue('58')
    expect(screen.getByLabelText('B')).toHaveValue('188')

    expect(screen.getByRole('option', { name: '#123abc' })).toBeInTheDocument()
    expect(screen.getByText('Recent colors')).toBeInTheDocument()
  })

  it('does not show pick from screen without EyeDropper', async () => {
    const user = userEvent.setup()
    renderPicker()
    await user.click(screen.getByRole('button', { name: 'Custom color' }))
    expect(screen.queryByRole('button', { name: 'Pick from screen' })).not.toBeInTheDocument()
  })
})
