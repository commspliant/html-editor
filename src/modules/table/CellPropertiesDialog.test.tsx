import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultCellPropertiesApply } from '../../core/cellProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { CellPropertiesDialog } from './CellPropertiesDialog'

describe('CellPropertiesDialog', () => {
  it('applies cell fields on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const value = defaultCellPropertiesApply({
      backgroundColor: '#ffeeaa',
      verticalAlign: 'middle',
    })
    render(
      <LocaleProvider>
        <CellPropertiesDialog open value={value} onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Cell properties' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Alignment' })).toBeInTheDocument()
    expect(screen.getByLabelText('Vertical align')).toHaveValue('middle')
    expect(screen.getByLabelText('Column span')).toHaveValue(1)
    expect(screen.getByLabelText('Row span')).toHaveValue(1)
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onApply).toHaveBeenCalledWith(value)
  })
})
