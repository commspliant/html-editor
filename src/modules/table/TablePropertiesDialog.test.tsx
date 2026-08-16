import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultTablePropertiesApply } from '../../core/tableProperties'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { TablePropertiesDialog } from './TablePropertiesDialog'

describe('TablePropertiesDialog', () => {
  it('applies the current draft on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const value = defaultTablePropertiesApply({
      borderCollapse: 'separate',
      width: { value: 80, unit: '%' },
    })
    render(
      <LocaleProvider>
        <TablePropertiesDialog open value={value} onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Table properties' })).toBeInTheDocument()
    expect(screen.getByLabelText('Border collapse')).toHaveValue('separate')
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onApply).toHaveBeenCalledWith(value)
  })

  it('closes on Cancel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <TablePropertiesDialog
          open
          value={defaultTablePropertiesApply()}
          onApply={() => undefined}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
