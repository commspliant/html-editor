import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultLinkAttrs } from '../../core/link'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { LinkDialog, type LinkDialogProps } from './LinkDialog'

function renderDialog(overrides: Partial<LinkDialogProps> = {}) {
  const props: LinkDialogProps = {
    open: true,
    tab: 'link',
    href: '',
    title: '',
    targetBlank: false,
    textDecorationNone: false,
    hoverMode: 'color',
    hoverColor: null,
    hoverHtml: '',
    bookmarks: [],
    selectedBookmarkId: '',
    onTabChange: () => undefined,
    onApply: () => undefined,
    onClose: () => undefined,
    ...overrides,
  }
  return render(
    <LocaleProvider>
      <LinkDialog {...props} />
    </LocaleProvider>,
  )
}

describe('LinkDialog', () => {
  it('applies href, title, target blank, and no underline on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    renderDialog({ onApply, onClose })

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    await user.type(screen.getByLabelText('URL'), 'https://example.com')
    await user.type(screen.getByLabelText('Title'), 'Example')
    await user.click(screen.getByRole('checkbox', { name: 'Open in a new tab' }))
    await user.click(screen.getByRole('checkbox', { name: 'No underline' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      defaultLinkAttrs({
        href: 'https://example.com',
        title: 'Example',
        targetBlank: true,
        textDecorationNone: true,
      }),
    )
  })

  it('applies a hover color on OK', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    renderDialog({ href: 'https://example.com', onApply })

    await user.click(screen.getByRole('button', { name: 'Hover color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      defaultLinkAttrs({
        href: 'https://example.com',
        hoverMode: 'color',
        hoverColor: '#ff0000',
      }),
    )
  })

  it('switches to HTML hover mode and applies custom markup', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    renderDialog({ href: 'https://example.com', onApply })

    await user.click(screen.getByRole('button', { name: 'HTML', pressed: false }))
    await user.type(screen.getByLabelText('Custom hover HTML'), '<em>Tip</em>')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith(
      defaultLinkAttrs({
        href: 'https://example.com',
        hoverMode: 'html',
        hoverHtml: '<em>Tip</em>',
      }),
    )
  })

  it('closes without applying on Cancel', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const onClose = vi.fn()
    renderDialog({ href: 'https://example.com', onApply, onClose })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('applies a selected bookmark with Select, including appearance', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    renderDialog({
      tab: 'bookmark',
      bookmarks: [{ id: 'intro' }, { id: 'end' }],
      onApply,
    })

    expect(screen.getByRole('checkbox', { name: 'No underline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Bookmark'), 'intro')
    await user.click(screen.getByRole('checkbox', { name: 'No underline' }))
    await user.click(screen.getByRole('button', { name: 'Select' }))

    expect(onApply).toHaveBeenCalledWith(
      defaultLinkAttrs({
        href: '#intro',
        textDecorationNone: true,
      }),
    )
  })

  it('shows an empty state when there are no bookmarks and still offers appearance fields', () => {
    renderDialog({ tab: 'bookmark' })

    expect(screen.getByText('No bookmarks in this document.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'No underline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Color' })).toHaveAttribute('aria-pressed', 'true')
  })
})
