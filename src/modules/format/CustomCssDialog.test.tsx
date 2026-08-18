import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { CustomCssDialog } from './CustomCssDialog'

describe('CustomCssDialog', () => {
  it('prefills the textarea and applies on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <CustomCssDialog
          open
          value={'color: red;\nfont-size: 12px;'}
          onApply={onApply}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    const textarea = screen.getByLabelText('Custom CSS declarations')
    expect(textarea).toHaveValue('color: red;\nfont-size: 12px;')
    await user.clear(textarea)
    await user.type(textarea, 'font-weight: bold')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith('font-weight: bold')
  })

  it('closes on Cancel without applying', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <CustomCssDialog open value="" onApply={onApply} onClose={onClose} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })
})
