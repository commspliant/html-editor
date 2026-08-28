import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { DocumentPreviewDialog } from './DocumentPreviewDialog'

describe('DocumentPreviewDialog', () => {
  it('renders the snapshot html in a sandboxed iframe', async () => {
    render(
      <LocaleProvider>
        <DocumentPreviewDialog open html="<p>Hello preview</p>" onClose={() => undefined} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Document preview' })).toBeInTheDocument()
    const frame = screen.getByTitle('Document preview') as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe('allow-same-origin')

    await waitFor(() => {
      expect(frame.contentDocument?.body.innerHTML).toContain('Hello preview')
    })
  })

  it('closes from the header X and the Close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <DocumentPreviewDialog open html="<p>Doc</p>" onClose={onClose} />
      </LocaleProvider>,
    )

    const [headerClose, footerClose] = screen.getAllByRole('button', { name: 'Close' })
    await user.click(headerClose)
    await user.click(footerClose)

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <DocumentPreviewDialog open html="<p>Doc</p>" onClose={onClose} />
      </LocaleProvider>,
    )

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders multi-page content as separated visual pages in the preview iframe', async () => {
    const multiPageHtml = '<p>Page 1</p>\n<!-- wysiwyg-page-separator -->\n<p>Page 2</p>'
    render(
      <LocaleProvider>
        <DocumentPreviewDialog open html={multiPageHtml} onClose={() => undefined} />
      </LocaleProvider>,
    )

    const frame = screen.getByTitle('Document preview') as HTMLIFrameElement
    await waitFor(() => {
      const pages = frame.contentDocument?.querySelectorAll('.wysiwyg-preview-page')
      expect(pages).toHaveLength(2)
      expect(pages?.[0]?.innerHTML).toContain('Page 1')
      expect(pages?.[1]?.innerHTML).toContain('Page 2')
    })
  })
})
