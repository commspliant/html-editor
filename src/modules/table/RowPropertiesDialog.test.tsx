import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultRowPropertiesApply } from '../../core/rowProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { RowPropertiesDialog } from './RowPropertiesDialog'

describe('RowPropertiesDialog', () => {
  it('applies row fields on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const value = defaultRowPropertiesApply({
      height: { value: 40, unit: 'px' },
      verticalAlign: 'top',
    })
    render(
      <LocaleProvider>
        <RowPropertiesDialog open value={value} onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Row properties' })).toBeInTheDocument()
    expect(screen.getByLabelText('Height')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onApply).toHaveBeenCalledWith(value)
  })
})
