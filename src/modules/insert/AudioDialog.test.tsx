import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { AudioDialog } from './AudioDialog'

describe('AudioDialog', () => {
  it('disables OK until a URL is entered and applies optional title', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <AudioDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('radio', { name: 'Audio URL' }))
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    await user.type(screen.getByLabelText('Audio URL'), 'https://example.com/track.mp3')
    await user.type(screen.getByLabelText('Title'), 'Intro')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      src: 'https://example.com/track.mp3',
      title: 'Intro',
    })
  })

  it('shows a validation error for a dangerous URL', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <AudioDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('radio', { name: 'Audio URL' }))
    await user.type(screen.getByLabelText('Audio URL'), 'javascript:alert(1)')
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    expect(screen.getByText('Enter a valid audio URL.')).toBeInTheDocument()
  })

  it('embeds a chosen file as a data URL', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <AudioDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    const file = new File(['mp3-bytes'], 'track.mp3', { type: 'audio/mpeg' })
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    await user.upload(input as HTMLInputElement, file)

    await waitFor(() => {
      expect(screen.getByText('track.mp3')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    const draft = onApply.mock.calls[0][0] as { src: string; title: string }
    expect(draft.src.startsWith('data:audio/mpeg;base64,')).toBe(true)
  })

  it('invokes onCustomPick from the custom source', async () => {
    const user = userEvent.setup()
    const onCustomPick = vi.fn()
    render(
      <LocaleProvider>
        <AudioDialog
          open
          customAudioPicker={{
            text: 'Library',
            description: 'Choose from the audio library',
            buttonCaption: 'Open library',
            onPick: () => undefined,
          }}
          onApply={() => undefined}
          onCustomPick={onCustomPick}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('radio', { name: 'Library' }))
    expect(screen.queryByRole('button', { name: 'OK' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open library' }))
    expect(onCustomPick).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-audio file', async () => {
    render(
      <LocaleProvider>
        <AudioDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Use an MP3, WAV, OGG, AAC, WebM, or M4A audio file.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
  })
})
