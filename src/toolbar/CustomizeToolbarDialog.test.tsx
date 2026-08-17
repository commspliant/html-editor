import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { defaultToolbarCatalog } from './defaultCatalog'
import { defaultToolbarLayout } from './defaultLayout'
import { CustomizeToolbarDialog } from './CustomizeToolbarDialog'

const groups = defaultToolbarLayout.iconGroups

describe('CustomizeToolbarDialog', () => {
  it('lists toolbar groups and items with checkboxes checked by default', () => {
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={null}
          onChange={() => undefined}
          onReset={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('dialog', { name: 'Customize toolbar' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Save: Show on toolbar' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Print: Show on toolbar' })).toBeChecked()
    expect(screen.getAllByRole('button', { name: 'Drag to reorder group' }).length).toBeGreaterThan(1)
  })

  it('unchecking an item reports it as hidden', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={null}
          onChange={onChange}
          onReset={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Print: Show on toolbar' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].hiddenItemIds).toEqual(['print'])
  })

  it('moves a group with the keyboard buttons', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={null}
          onChange={onChange}
          onReset={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    const fileGroup = screen.getByRole('region', { name: 'File' })
    await user.click(fileGroup.querySelector('[aria-label="Move group down"]') as HTMLButtonElement)

    expect(onChange.mock.calls[0][0].groupOrder[0]).toBe('print')
    expect(onChange.mock.calls[0][0].groupOrder[1]).toBe('file')
  })

  it('does not allow dragging the fullscreen group', () => {
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={null}
          onChange={() => undefined}
          onReset={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    const fullscreen = screen.getByRole('region', { name: 'Full screen' })
    const handle = fullscreen.querySelector('[aria-label="Drag to reorder group"]') as HTMLButtonElement
    expect(handle).toBeDisabled()
    expect(fullscreen.querySelector('[aria-label="Move group up"]')).toBeDisabled()
    expect(fullscreen.querySelector('[aria-label="Move group down"]')).toBeDisabled()
  })

  it('resets and closes', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    const onClose = vi.fn()
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={{ groupOrder: ['print', 'file'], hiddenItemIds: ['print'] }}
          onChange={() => undefined}
          onReset={onReset}
          onClose={onClose}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('checkbox', { name: 'Print: Show on toolbar' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows a loading status', () => {
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={null}
          loading
          onChange={() => undefined}
          onReset={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    expect(screen.getByRole('status', { name: 'Loading toolbar settings' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Save: Show on toolbar' })).not.toBeInTheDocument()
  })

  it('reorders on drop', () => {
    const onChange = vi.fn()
    render(
      <LocaleProvider>
        <CustomizeToolbarDialog
          open
          catalog={defaultToolbarCatalog}
          groups={groups}
          settings={null}
          onChange={onChange}
          onReset={() => undefined}
          onClose={() => undefined}
        />
      </LocaleProvider>,
    )

    const printGroup = screen.getByRole('region', { name: 'Print' })
    fireEvent.drop(printGroup, { dataTransfer: { getData: () => 'file' } })
    expect(onChange.mock.calls[0][0].groupOrder[0]).toBe('print')
    expect(onChange.mock.calls[0][0].groupOrder[1]).toBe('file')
  })
})
