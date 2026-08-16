import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { ImageDialog } from './ImageDialog'

describe('ImageDialog', () => {
  it('disables OK until a URL is entered and applies optional fields', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <ImageDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('radio', { name: 'File' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Image URL' }))
    expect(screen.getByRole('radio', { name: 'Image URL' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByRole('button', { name: 'Choose file' })).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    await user.type(screen.getByLabelText('Image URL'), 'https://example.com/a.png')
    await user.type(screen.getByLabelText('Alt text'), 'Chart')
    await user.type(screen.getByLabelText('Title'), 'Q1')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      src: 'https://example.com/a.png',
      alt: 'Chart',
      title: 'Q1',
    })
  })

  it('shows a validation error for a dangerous URL', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <ImageDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('radio', { name: 'Image URL' }))
    await user.type(screen.getByLabelText('Image URL'), 'javascript:alert(1)')
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    expect(screen.getByText('Enter a valid image URL.')).toBeInTheDocument()
  })

  it('embeds a chosen file as a data URL', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <ImageDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    const file = new File(['png-bytes'], 'photo.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    await user.upload(input as HTMLInputElement, file)

    await waitFor(() => {
      expect(screen.getByText('photo.png')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    const draft = onApply.mock.calls[0][0] as { src: string; alt: string; title: string }
    expect(draft.src.startsWith('data:image/png;base64,')).toBe(true)
    expect(draft.alt).toBe('')
    expect(draft.title).toBe('')
  })

  it('hides the custom source when no picker is set', () => {
    render(
      <LocaleProvider>
        <ImageDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('radio', { name: 'File' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Image URL' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Gallery' })).not.toBeInTheDocument()
  })

  it('shows host copy on the custom source and invokes onCustomPick', async () => {
    const user = userEvent.setup()
    const onCustomPick = vi.fn()
    render(
      <LocaleProvider>
        <ImageDialog
          open
          customImagePicker={{
            text: 'Gallery',
            description: 'Choose from the media library',
            buttonCaption: 'Open gallery',
            onPick: () => undefined,
          }}
          onApply={() => undefined}
          onCustomPick={onCustomPick}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Gallery' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('radio', { name: 'Gallery' }))
    expect(screen.getByRole('radio', { name: 'Gallery' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Choose from the media library')).toBeInTheDocument()
    expect(screen.queryByLabelText('Alt text')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'OK' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open gallery' }))
    expect(onCustomPick).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-raster file', async () => {
    render(
      <LocaleProvider>
        <ImageDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    const file = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Use a JPEG, PNG, GIF, WebP, BMP, or AVIF image.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
  })
})
