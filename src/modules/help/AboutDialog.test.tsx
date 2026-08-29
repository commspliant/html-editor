import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { AboutDialog } from './AboutDialog'

describe('AboutDialog', () => {
  it('links to the CommsPliant website with safe external attributes', () => {
    render(
      <LocaleProvider>
        <AboutDialog open onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(
      screen.getByText("See what we're building for regulated communication solutions."),
    ).toBeTruthy()

    const link = screen.getByRole('link', {
      name: 'Visit CommsPliant — regulated communication management',
    })

    expect(link.getAttribute('href')).toBe('https://commspliant.com/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toBe('Visit commspliant.com')
  })
})
