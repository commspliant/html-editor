import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { HelpDialog } from './HelpDialog'

describe('HelpDialog', () => {
  it('renders the selected topic and filters topics when searching', async () => {
    const user = userEvent.setup()
    const onTopicChange = vi.fn()

    render(
      <LocaleProvider>
        <HelpDialog
          open
          topicId="getStarted"
          onTopicChange={onTopicChange}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { name: 'How do I use this editor?' })).toBeTruthy()

    const search = screen.getByRole('searchbox', { name: 'Search help' })
    await user.type(search, 'table')

    expect(screen.getByRole('button', { name: 'How do I insert a table?' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'How do I print my document?' })).toBeNull()
  })

  it('shows an empty state when search has no matches', async () => {
    const user = userEvent.setup()

    render(
      <LocaleProvider>
        <HelpDialog
          open
          topicId="getStarted"
          onTopicChange={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    const search = screen.getByRole('searchbox', { name: 'Search help' })
    await user.type(search, 'zzznomatch')

    expect(screen.getByText('No help topics match your search.')).toBeTruthy()
  })
})
