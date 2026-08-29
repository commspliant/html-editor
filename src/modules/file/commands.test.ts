import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCommandContext as fileContext } from '../../test/commandContext'
import { createFileCommands } from './commands'
import { loadHtml, saveHtml } from './fileDialogs'
import { printHtml, printPagesHtml } from './printHtml'

vi.mock('./fileDialogs', () => ({
  saveHtml: vi.fn(async () => undefined),
  loadHtml: vi.fn(async () => null),
}))

vi.mock('./printHtml', () => ({
  printHtml: vi.fn(),
  printPagesHtml: vi.fn(),
}))

describe('createFileCommands', () => {
  beforeEach(() => {
    vi.mocked(saveHtml).mockClear()
    vi.mocked(loadHtml).mockClear()
    vi.mocked(printHtml).mockClear()
    vi.mocked(printPagesHtml).mockClear()
  })

  it('saves the current html', async () => {
    const setHtml = vi.fn()
    const commands = createFileCommands(
      fileContext({
        getHtml: () => '<p>Doc</p>',
        setHtml,
      }),
    )

    await commands.save()

    expect(saveHtml).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'))
    expect(saveHtml).toHaveBeenCalledWith(expect.stringContaining('<p>Doc</p>'))
    expect(setHtml).not.toHaveBeenCalled()
  })

  it('opens html into the editor', async () => {
    vi.mocked(loadHtml).mockResolvedValueOnce('<p>Loaded</p>')
    const setHtml = vi.fn()
    const commands = createFileCommands(
      fileContext({
        getHtml: () => '',
        setHtml,
      }),
    )

    await commands.open()

    expect(setHtml).toHaveBeenCalledWith('<p>Loaded</p>')
  })

  it('does not replace html when open is cancelled', async () => {
    vi.mocked(loadHtml).mockResolvedValueOnce(null)
    const setHtml = vi.fn()
    const commands = createFileCommands(
      fileContext({
        getHtml: () => '<p>Keep</p>',
        setHtml,
      }),
    )

    await commands.open()

    expect(setHtml).not.toHaveBeenCalled()
  })

  it('prints the current html', () => {
    const setHtml = vi.fn()
    const commands = createFileCommands(
      fileContext({
        getHtml: () => '<p>Doc</p>',
        setHtml,
      }),
    )

    commands.print()

    expect(printHtml).toHaveBeenCalledWith('<p>Doc</p>')
    expect(setHtml).not.toHaveBeenCalled()
  })

  it('prints hydrated multi-page html split from getHtml', () => {
    const joined = '<p>One</p>\n<!-- wysiwyg-page-separator -->\n<p>Two</p>'
    const commands = createFileCommands(
      fileContext({
        getHtml: () => joined,
        isMultiPagesEnabled: () => true,
      }),
    )

    commands.print()

    expect(printPagesHtml).toHaveBeenCalledWith(['<p>One</p>', '<p>Two</p>'])
    expect(printHtml).not.toHaveBeenCalled()
  })

  it('calls onSave instead of saveHtml when set', async () => {
    const onSave = vi.fn(async () => undefined)
    const commands = createFileCommands(
      fileContext({
        getHtml: () => '<p>Doc</p>',
        onSave,
      }),
    )

    await commands.save()

    expect(onSave).toHaveBeenCalledWith('<p>Doc</p>')
    expect(saveHtml).not.toHaveBeenCalled()
  })

  it('calls onOpen instead of loadHtml when set', async () => {
    const setHtml = vi.fn()
    const onOpen = vi.fn(async () => '<p>From host</p>')
    const commands = createFileCommands(
      fileContext({
        setHtml,
        onOpen,
      }),
    )

    await commands.open()

    expect(onOpen).toHaveBeenCalled()
    expect(loadHtml).not.toHaveBeenCalled()
    expect(setHtml).toHaveBeenCalledWith('<p>From host</p>')
  })

  it('does not replace html when onOpen returns null', async () => {
    const setHtml = vi.fn()
    const commands = createFileCommands(
      fileContext({
        setHtml,
        onOpen: async () => null,
      }),
    )

    await commands.open()

    expect(setHtml).not.toHaveBeenCalled()
    expect(loadHtml).not.toHaveBeenCalled()
  })

  it('saves all pages as a standalone document when multi-page is enabled without onSave', async () => {
    const joined = '<p>One</p>\n<!-- wysiwyg-page-separator -->\n<p>Two</p>'
    const commands = createFileCommands(
      fileContext({
        getHtml: () => joined,
        isMultiPagesEnabled: () => true,
        getActivePageHtml: () => '<p>Active</p>',
      }),
    )

    await commands.save()

    expect(saveHtml).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'))
    expect(saveHtml).toHaveBeenCalledWith(expect.stringContaining('<p>One</p>'))
    expect(saveHtml).toHaveBeenCalledWith(expect.stringContaining('<p>Two</p>'))
    expect(saveHtml).not.toHaveBeenCalledWith(expect.stringContaining('<p>Active</p>'))
  })

  it('passes all pages to onSave when multi-page is enabled', async () => {
    const onSave = vi.fn(async () => undefined)
    const pages = ['<p>One</p>', '<p>Two</p>']
    const commands = createFileCommands(
      fileContext({
        isMultiPagesEnabled: () => true,
        getAllPagesHtml: () => pages,
        onSave,
      }),
    )

    await commands.save()

    expect(onSave).toHaveBeenCalledWith(pages)
    expect(saveHtml).not.toHaveBeenCalled()
  })
})
