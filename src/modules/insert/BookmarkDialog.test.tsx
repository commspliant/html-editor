import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { BookmarkDialog } from './BookmarkDialog'

describe('BookmarkDialog', () => {
  it('disables OK until the name is valid and applies on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <BookmarkDialog open existingIds={['intro']} onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    await user.type(screen.getByLabelText('Bookmark name'), 'section-1')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith('section-1')
  })

  it('shows a validation error for an invalid name', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <BookmarkDialog open existingIds={[]} onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.type(screen.getByLabelText('Bookmark name'), '1bad')
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    expect(
      screen.getByText('Start with a letter. Use only letters, numbers, hyphens, and underscores.'),
    ).toBeInTheDocument()
  })

  it('rejects a duplicate bookmark name', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <BookmarkDialog open existingIds={['intro']} onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.type(screen.getByLabelText('Bookmark name'), 'intro')
    expect(screen.getByText('A bookmark with this name already exists.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
  })

  it('closes on Cancel and Close without applying', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <BookmarkDialog open existingIds={[]} onApply={onApply} onClose={onClose} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onApply).not.toHaveBeenCalled()
  })
})
