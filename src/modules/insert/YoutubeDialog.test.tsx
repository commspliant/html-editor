import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { YoutubeDialog } from './YoutubeDialog'

describe('YoutubeDialog', () => {
  it('disables OK until a valid YouTube URL is entered', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <LocaleProvider>
        <YoutubeDialog open onApply={onApply} onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    await user.type(
      screen.getByLabelText('YouTube URL'),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
    await user.type(screen.getByLabelText('Title'), 'Demo')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onApply).toHaveBeenCalledWith({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo',
    })
  })

  it('shows a validation error for a non-YouTube URL', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <YoutubeDialog open onApply={() => undefined} onClose={() => undefined} />
      </LocaleProvider>,
    )

    await user.type(screen.getByLabelText('YouTube URL'), 'https://example.com/video.mp4')
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    expect(screen.getByText('Enter a valid YouTube URL.')).toBeInTheDocument()
  })

  it('invokes onCustomPick from the custom source', async () => {
    const user = userEvent.setup()
    const onCustomPick = vi.fn()
    render(
      <LocaleProvider>
        <YoutubeDialog
          open
          customVideoPicker={{
            text: 'Library',
            description: 'Choose from the video library',
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
})
