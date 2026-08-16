import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyFontMarkState } from '../../core/marks'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import type { CustomParagraphStyle } from '../../types'
import { ParagraphStyleList } from './ParagraphStyleList'

const quote: CustomParagraphStyle = {
  id: 'quote',
  name: 'Quote',
  font: {
    size: 12,
    unit: 'pt',
    marks: { ...emptyFontMarkState(), italic: true },
    fontFamily: null,
    fontColor: null,
    highlightColor: null,
  },
}

describe('ParagraphStyleList', () => {
  it('hides custom items and Add new when the feature is disabled', () => {
    render(
      <LocaleProvider>
        <ParagraphStyleList
          menu
          value="p"
          customStyles={[quote]}
          onSelect={() => undefined}
          onAddNew={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.queryByRole('menuitem', { name: 'Quote' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Add new paragraph style' })).not.toBeInTheDocument()
  })

  it('opens Add new and custom items from the format menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSelectCustom = vi.fn()
    const onAddNew = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphStyleList
          menu
          value="p"
          customStylesEnabled
          customStyles={[quote]}
          onSelect={onSelect}
          onSelectCustom={onSelectCustom}
          onAddNew={onAddNew}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('menuitem', { name: 'Quote' }))
    await user.click(screen.getByRole('menuitem', { name: 'Add new paragraph style' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Heading 6' }))

    expect(onSelectCustom).toHaveBeenCalledWith('quote')
    expect(onAddNew).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('h6')
  })

  it('applies a custom style from the toolbar list and does not show Add new', async () => {
    const user = userEvent.setup()
    const onSelectCustom = vi.fn()
    const onAddNew = vi.fn()
    render(
      <LocaleProvider>
        <ParagraphStyleList
          value="p"
          customStylesEnabled
          customStyles={[quote]}
          onSelect={() => undefined}
          onSelectCustom={onSelectCustom}
          onAddNew={onAddNew}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('option', { name: 'Quote' }))
    expect(onSelectCustom).toHaveBeenCalledWith('quote')
    expect(screen.queryByRole('option', { name: 'Add new' })).not.toBeInTheDocument()
    expect(onAddNew).not.toHaveBeenCalled()
  })

  it('shows a loading status in the custom section', () => {
    render(
      <LocaleProvider>
        <ParagraphStyleList
          menu
          value="p"
          customStylesEnabled
          customStylesLoading
          onSelect={() => undefined}
          onAddNew={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('status')).toHaveAccessibleName('Loading paragraph styles')
    expect(screen.getByRole('menuitem', { name: 'Add new paragraph style' })).toBeInTheDocument()
  })
})
