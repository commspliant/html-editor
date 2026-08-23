import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { DeletePageConfirmDialog } from './DeletePageConfirmDialog'

describe('DeletePageConfirmDialog', () => {
  it('shows the confirmation message', () => {
    render(
      <LocaleProvider>
        <DeletePageConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} />
      </LocaleProvider>,
    )

    expect(
      screen.getByText('Are you sure you want to delete the selected page?'),
    ).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <LocaleProvider>
        <DeletePageConfirmDialog open onClose={onClose} onConfirm={vi.fn()} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when delete is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <LocaleProvider>
        <DeletePageConfirmDialog open onClose={vi.fn()} onConfirm={onConfirm} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete page' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
