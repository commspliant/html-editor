import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyFontMarkState } from '../../core/marks'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import type { CustomParagraphStyleFont } from '../../types'
import { CustomParagraphStyleDialog } from './CustomParagraphStyleDialog'

const font: CustomParagraphStyleFont = {
  size: 12,
  unit: 'pt',
  marks: emptyFontMarkState(),
  fontFamily: null,
  fontColor: null,
  highlightColor: null,
}

describe('CustomParagraphStyleDialog', () => {
  it('disables OK until a name is provided and saves on OK', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <CustomParagraphStyleDialog
          open
          mode="create"
          font={font}
          onSave={onSave}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    await user.type(screen.getByLabelText('Name'), '  Quote  ')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({
      name: 'Quote',
      font: {
        size: 12,
        unit: 'pt',
        marks: emptyFontMarkState(),
        fontFamily: null,
        fontColor: null,
        highlightColor: null,
      },
    })
    expect(onSave.mock.calls[0][0].id).toEqual(expect.any(String))
  })

  it('closes without saving on Cancel or Close', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onClose = vi.fn()
    const { rerender } = render(
      <LocaleProvider>
        <CustomParagraphStyleDialog
          open
          mode="create"
          font={font}
          onSave={onSave}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()

    rerender(
      <LocaleProvider>
        <CustomParagraphStyleDialog
          open
          mode="create"
          font={font}
          onSave={onSave}
          onClose={onClose}
        />
      </LocaleProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <LocaleProvider>
        <CustomParagraphStyleDialog
          open
          mode="edit"
          styleId="quote"
          name="Quote"
          font={font}
          canDelete
          onSave={() => undefined}
          onDelete={onDelete}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('Delete this paragraph style?')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('quote')
  })

  it('shows paragraph fields on the Paragraph tab', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <CustomParagraphStyleDialog
          open
          mode="create"
          font={font}
          onSave={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('combobox', { name: 'Font size' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Paragraph' }))
    expect(screen.queryByRole('combobox', { name: 'Font size' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Align left' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  })
})
