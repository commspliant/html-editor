import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { TableDialog } from './TableDialog'

describe('TableDialog', () => {
  it('applies the default size and can cancel', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <TableDialog open onApply={onApply} onClose={onClose} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Insert table' })).toBeInTheDocument()
    expect(screen.getByText('Size: 3 × 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('inserts the hovered grid size', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <TableDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.hover(screen.getByRole('gridcell', { name: '2 × 4' }))
    expect(screen.getByText('Size: 2 × 4')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Insert' }))
    expect(onApply).toHaveBeenCalledWith({ rows: 2, cols: 4 })
  })

  it('locks the grid size after click so hover no longer changes it', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <TableDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('gridcell', { name: '2 × 4' }))
    expect(screen.getByText('Size: 2 × 4')).toBeInTheDocument()
    await user.hover(screen.getByRole('gridcell', { name: '8 × 8' }))
    expect(screen.getByText('Size: 2 × 4')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Insert' }))
    expect(onApply).toHaveBeenCalledWith({ rows: 2, cols: 4 })
  })

  it('accepts only digits in the rows and columns fields', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <TableDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    const rowsInput = screen.getByLabelText('Rows')
    const colsInput = screen.getByLabelText('Columns')
    expect(rowsInput).toHaveAttribute('type', 'number')
    expect(colsInput).toHaveAttribute('type', 'number')

    await user.clear(rowsInput)
    await user.type(rowsInput, 'ab12c')
    expect(rowsInput).toHaveValue(12)

    await user.clear(colsInput)
    await user.type(colsInput, 'xyz')
    await user.tab()
    expect(colsInput).toHaveValue(3)
  })

  it('closes from the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <TableDialog open onApply={() => undefined} onClose={onClose} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
