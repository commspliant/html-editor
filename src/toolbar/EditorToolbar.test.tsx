import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TOOLTIP_HOVER_DELAY_MS } from './Tooltip'
import { LocaleProvider } from '../i18n/LocaleProvider'
import type { Locale } from '../i18n/types'
import type { EditorCommands, EditorQueries } from '../core/commandTypes'
import { mergeFontFaces } from '../core/fontFamily'
import { mergeCustomActions } from '../core/customActions'
import { defaultToolbarCatalog } from './defaultCatalog'
import { defaultToolbarLayout } from './defaultLayout'
import { EditorToolbar } from './EditorToolbar'
import type { EditorToolbarProps } from './EditorToolbar'
import { MENU_SEPARATOR } from './types'

function renderToolbar(
  overrides: Omit<Partial<EditorToolbarProps>, 'commands' | 'queries'> & {
    commands?: Partial<EditorCommands>
    queries?: Partial<EditorQueries>
  } = {},
  locale: Locale = 'en',
) {
  const commands = {
    save: vi.fn(async () => undefined),
    open: vi.fn(async () => undefined),
    print: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    setVisualMode: vi.fn(),
    setHtmlMode: vi.fn(),
    toggleFullscreen: vi.fn(),
    openCustomizeToolbar: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrikethrough: vi.fn(),
    setFontSize: vi.fn(),
    setFontSizeUnit: vi.fn(),
    setFontFamily: vi.fn(),
    setFontColor: vi.fn(),
    setHighlightColor: vi.fn(),
    setParagraphStyle: vi.fn(),
    alignLeft: vi.fn(),
    alignCenter: vi.fn(),
    alignRight: vi.fn(),
    alignJustify: vi.fn(),
    indent: vi.fn(),
    outdent: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleNumberedList: vi.fn(),
    openFontProperties: vi.fn(),
    applyFontProperties: vi.fn(),
    openParagraphProperties: vi.fn(),
    applyParagraphProperties: vi.fn(),
    openPageProperties: vi.fn(),
    applyPageProperties: vi.fn(),
    openCustomParagraphStyleDialog: vi.fn(),
    applyCustomParagraphStyle: vi.fn(),
    openLinkDialog: vi.fn(),
    applyLink: vi.fn(),
    openBookmarkDialog: vi.fn(),
    applyBookmark: vi.fn(),
    openImageDialog: vi.fn(),
    applyImage: vi.fn(),
    openImageProperties: vi.fn(),
    applyImageProperties: vi.fn(),
    openTableDialog: vi.fn(),
    applyTable: vi.fn(),
    openTableProperties: vi.fn(),
    applyTableProperties: vi.fn(),
    openCellProperties: vi.fn(),
    applyCellProperties: vi.fn(),
    openRowProperties: vi.fn(),
    applyRowProperties: vi.fn(),
    insertRowBelow: vi.fn(),
    insertRowBefore: vi.fn(),
    deleteRow: vi.fn(),
    insertColumnAfter: vi.fn(),
    insertColumnBefore: vi.fn(),
    deleteColumn: vi.fn(),
    cut: vi.fn(),
    copy: vi.fn(),
    deleteSelection: vi.fn(),
    clearFormatting: vi.fn(),
    ...overrides.commands,
  }
  const queries = {
    isVisualMode: () => true,
    isHtmlMode: () => false,
    isFullscreen: () => false,
    canUndo: () => false,
    canRedo: () => false,
    isBold: () => false,
    isItalic: () => false,
    isUnderline: () => false,
    isStrikethrough: () => false,
    getFontSize: () => null,
    getFontSizeUnit: () => 'pt' as const,
    isFontSizeMixed: () => false,
    getFontFamily: () => null,
    isFontFamilyMixed: () => false,
    getFontFaces: () => mergeFontFaces(),
    getFontColor: () => null,
    isFontColorMixed: () => false,
    getHighlightColor: () => null,
    isHighlightColorMixed: () => false,
    getParagraphStyle: () => 'p' as const,
    isParagraphStyleMixed: () => false,
    isAlignLeft: () => false,
    isAlignCenter: () => false,
    isAlignRight: () => false,
    isAlignJustify: () => false,
    canOutdent: () => false,
    isBulletList: () => false,
    isNumberedList: () => false,
    customParagraphStylesEnabled: () => false,
    getCustomParagraphStyles: () => [],
    isCustomParagraphStylesLoading: () => false,
    isLink: () => false,
    isImageSelected: () => false,
    isInTable: () => false,
    hasTextSelection: () => true,
    ...overrides.queries,
  }
  const view = render(
    <LocaleProvider locale={locale}>
      <EditorToolbar
        catalog={overrides.catalog ?? defaultToolbarCatalog}
        layout={overrides.layout ?? defaultToolbarLayout}
        commands={commands}
        queries={queries}
        disabled={overrides.disabled}
        menuVisible={overrides.menuVisible}
        toolbarVisible={overrides.toolbarVisible}
        compact={overrides.compact}
      />
    </LocaleProvider>,
  )
  return { ...view, commands }
}

describe('EditorToolbar', () => {
  it('runs save, open, and print from matching toolbar icons', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Save as HTML file' }))
    await user.click(screen.getByRole('button', { name: 'Open HTML file' }))
    await user.click(screen.getByRole('button', { name: 'Print document' }))

    expect(commands.save).toHaveBeenCalledTimes(1)
    expect(commands.open).toHaveBeenCalledTimes(1)
    expect(commands.print).toHaveBeenCalledTimes(1)
  })

  it('places save and open in a file icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'File' })
    expect(group).toHaveAttribute('data-toolbar-group', 'file')
    expect(group.querySelector('[data-icon="save"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="open"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="print"]')).toBeNull()
  })

  it('places print in its own icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Print' })
    expect(group).toHaveAttribute('data-toolbar-group', 'print')
    expect(group.querySelector('[data-icon="print"]')).not.toBeNull()
  })

  describe('brand mark', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders the shield before the File menu', () => {
      renderToolbar()

      const mark = screen.getByRole('img', { name: 'CommsPliant HTML editor' })
      const file = screen.getByRole('button', { name: 'File menu' })

      expect(mark.querySelector('[data-icon="commspliant-shield"]')).not.toBeNull()
      expect(mark.compareDocumentPosition(file) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('shows a localised tooltip after hovering the shield', () => {
      vi.useFakeTimers()
      renderToolbar()

      const mark = screen.getByRole('img', { name: 'CommsPliant HTML editor' })
      const trigger = mark.closest('[data-tooltip-trigger]') as HTMLElement
      fireEvent.mouseEnter(trigger)

      expect(screen.queryByText('CommsPliant HTML editor', { selector: '[data-toolbar-tooltip]' })).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(TOOLTIP_HOVER_DELAY_MS)
      })

      expect(screen.getByText('CommsPliant HTML editor', { selector: '[data-toolbar-tooltip]' })).toBeInTheDocument()
    })

    it('uses Spanish copy for the shield name', () => {
      renderToolbar({}, 'es')

      expect(screen.getByRole('img', { name: 'Editor HTML de CommsPliant' })).toBeInTheDocument()
    })
  })

  it('renders only the icons listed in each layout group', () => {
    renderToolbar({
      layout: {
        menus: [{ id: 'file', items: ['save', 'open'] }],
        iconGroups: [{ id: 'file', items: ['save'] }],
      },
    })

    expect(screen.getByRole('button', { name: 'Save as HTML file' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open HTML file' })).not.toBeInTheDocument()
  })

  it('runs the same commands from File menu items', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Save' }))
    expect(commands.save).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Open' }))
    expect(commands.open).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Print' }))
    expect(commands.print).toHaveBeenCalledTimes(1)
  })

  it('uses the same icons in the File menu and the icon toolbar', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'File menu' }))

    expect(screen.getByRole('menuitem', { name: 'Save' }).querySelector('[data-icon="save"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Save as HTML file' }).querySelector('[data-icon="save"]')).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Open' }).querySelector('[data-icon="open"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Open HTML file' }).querySelector('[data-icon="open"]')).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Print' }).querySelector('[data-icon="print"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Print document' }).querySelector('[data-icon="print"]')).not.toBeNull()
  })

  it('runs undo and redo from matching toolbar icons', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { canUndo: () => true, canRedo: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await user.click(screen.getByRole('button', { name: 'Redo' }))

    expect(commands.undo).toHaveBeenCalledTimes(1)
    expect(commands.redo).toHaveBeenCalledTimes(1)
  })

  it('places undo and redo in an edit icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Edit' })
    expect(group).toHaveAttribute('data-toolbar-group', 'edit')
    expect(group.querySelector('[data-icon="undo"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="redo"]')).not.toBeNull()
  })

  it('grays out undo and redo when history is empty', () => {
    renderToolbar()

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save as HTML file' })).toBeEnabled()
  })

  it('enables undo and redo from queries', () => {
    renderToolbar({
      queries: { canUndo: () => true, canRedo: () => false },
    })

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })

  it('runs the same commands from Edit menu items', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { canUndo: () => true, canRedo: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Undo' }))
    expect(commands.undo).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Redo' }))
    expect(commands.redo).toHaveBeenCalledTimes(1)
  })

  it('grays out Edit menu items when history is empty', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))

    expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Redo' })).toBeDisabled()
  })

  it('uses the same icons in the Edit menu and the icon toolbar', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))

    expect(screen.getByRole('menuitem', { name: 'Undo' }).querySelector('[data-icon="undo"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Undo' }).querySelector('[data-icon="undo"]')).not.toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Redo' }).querySelector('[data-icon="redo"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Redo' }).querySelector('[data-icon="redo"]')).not.toBeNull()
  })

  it('runs link, bookmark, and image from Insert menu items', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Link' }))
    expect(commands.openLinkDialog).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Bookmark' }))
    expect(commands.openBookmarkDialog).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Image' }))
    expect(commands.openImageDialog).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Table' }))
    expect(commands.openTableDialog).toHaveBeenCalledTimes(1)
  })

  it('runs link, bookmark, and image from matching toolbar icons', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Link' }))
    await user.click(screen.getByRole('button', { name: 'Bookmark' }))
    await user.click(screen.getByRole('button', { name: 'Insert image' }))
    await user.click(screen.getByRole('button', { name: 'Insert table' }))

    expect(commands.openLinkDialog).toHaveBeenCalledTimes(1)
    expect(commands.openBookmarkDialog).toHaveBeenCalledTimes(1)
    expect(commands.openImageDialog).toHaveBeenCalledTimes(1)
    expect(commands.openTableDialog).toHaveBeenCalledTimes(1)
  })

  it('places link, bookmark, and image in an insert icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Insert' })
    expect(group).toHaveAttribute('data-toolbar-group', 'insert')
    expect(group.querySelector('[data-icon="link"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="bookmark"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="image"]')).not.toBeNull()
  })

  it('runs view commands from matching toolbar icons', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Switch to visual mode' }))
    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))
    await user.click(screen.getByRole('button', { name: 'Toggle full screen' }))

    expect(commands.setVisualMode).toHaveBeenCalledTimes(1)
    expect(commands.setHtmlMode).toHaveBeenCalledTimes(1)
    expect(commands.toggleFullscreen).toHaveBeenCalledTimes(1)
  })

  it('places visual and html in a view icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'View' })
    expect(group).toHaveAttribute('data-toolbar-group', 'view')
    expect(group.querySelector('[data-icon="visual"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="html"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="fullscreen"]')).toBeNull()
  })

  it('places fullscreen in its own last icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Full screen' })
    expect(group).toHaveAttribute('data-toolbar-group', 'fullscreen')
    expect(group.querySelector('[data-icon="fullscreen"]')).not.toBeNull()

    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' })
    const buttons = toolbar.querySelectorAll('button')
    expect(buttons[buttons.length - 1]).toHaveAccessibleName('Toggle full screen')
  })

  it('pins fullscreen last even when the layout lists it in the view group', () => {
    renderToolbar({
      layout: {
        ...defaultToolbarLayout,
        iconGroups: [
          { id: 'view', items: ['visual', 'html', 'fullscreen'] },
          { id: 'file', items: ['save'] },
        ],
      },
    })

    expect(screen.getByRole('group', { name: 'View' }).querySelector('[data-icon="fullscreen"]')).toBeNull()
    expect(screen.getByRole('group', { name: 'Full screen' }).querySelector('[data-icon="fullscreen"]')).not.toBeNull()

    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' })
    const buttons = toolbar.querySelectorAll('button')
    expect(buttons[buttons.length - 1]).toHaveAccessibleName('Toggle full screen')
  })

  it('keeps fullscreen last when a custom toolbar action is present', () => {
    const { catalog, layout } = mergeCustomActions(
      [{ id: 'ai', label: 'AI', showIn: 'toolbar', onAction: vi.fn() }],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )
    renderToolbar({ catalog, layout })

    expect(screen.getByRole('button', { name: 'AI' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Custom' })).toHaveAttribute('data-toolbar-group', 'custom')

    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' })
    const buttons = toolbar.querySelectorAll('button')
    expect(buttons[buttons.length - 1]).toHaveAccessibleName('Toggle full screen')
  })

  it('marks the active view icon as pressed', () => {
    renderToolbar()

    expect(screen.getByRole('button', { name: 'Switch to visual mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Switch to HTML mode' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Toggle full screen' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('runs the same commands from View menu items', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Visual' }))
    expect(commands.setVisualMode).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'HTML' }))
    expect(commands.setHtmlMode).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Full screen' }))
    expect(commands.toggleFullscreen).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Toolbar submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Customize toolbar' }))
    expect(commands.openCustomizeToolbar).toHaveBeenCalledTimes(1)
  })

  it('checks the active view in the View menu', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'View menu' }))

    expect(screen.getByRole('menuitemradio', { name: 'Visual' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'HTML' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Full screen' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('uses the same icons in the View menu and the icon toolbar', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'View menu' }))

    expect(screen.getByRole('menuitemradio', { name: 'Visual' }).querySelector('[data-icon="visual"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Switch to visual mode' }).querySelector('[data-icon="visual"]')).not.toBeNull()
    expect(screen.getByRole('menuitemradio', { name: 'HTML' }).querySelector('[data-icon="html"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Switch to HTML mode' }).querySelector('[data-icon="html"]')).not.toBeNull()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Full screen' }).querySelector('[data-icon="fullscreen"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Toggle full screen' }).querySelector('[data-icon="fullscreen"]')).not.toBeNull()
  })

  it('separates HTML and Full screen in the View menu', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'View menu' }))

    const entries = [...screen.getByRole('menu').children].map((el) => el.getAttribute('role'))
    expect(entries).toEqual(['menuitemradio', 'menuitemradio', 'separator', null, 'separator', 'menuitemcheckbox'])
    expect(screen.getAllByRole('separator')).toHaveLength(2)
  })

  it('separates print from save and open in the File menu', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'File menu' }))

    const entries = [...screen.getByRole('menu').children].map((el) => el.getAttribute('role'))
    expect(entries).toEqual(['menuitem', 'menuitem', 'separator', 'menuitem'])
    expect(screen.getAllByRole('separator')).toHaveLength(1)
  })

  it('does not separate Edit menu items', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('places bold italic underline and strikethrough in a fonts icon group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Fonts' })
    expect(group).toHaveAttribute('data-toolbar-group', 'font')
    expect(group.querySelector('[data-icon="bold"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="italic"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="underline"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="strikethrough"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="clear-formatting"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="font-color"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="highlight-color"]')).not.toBeNull()
    expect(screen.getByRole('combobox', { name: 'Font size' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Font family' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paragraph styles' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Font color' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Highlight color' })).toBeInTheDocument()
  })

  it('commits a typed font size from the toolbar combobox', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    const input = screen.getByRole('combobox', { name: 'Font size' })
    await user.clear(input)
    await user.type(input, '18')
    await user.keyboard('{Enter}')

    expect(commands.setFontSize).toHaveBeenCalledWith(18, 'pt')
  })

  it('applies a font family from the toolbar dropdown', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Font family' }))
    await user.click(screen.getByRole('option', { name: 'Georgia' }))

    expect(commands.setFontFamily).toHaveBeenCalledWith('Georgia, serif')
  })

  it('rejects zero from the font size combobox', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { getFontSize: () => 12 },
    })

    const input = screen.getByRole('combobox', { name: 'Font size' })
    await user.clear(input)
    await user.type(input, '0')
    await user.keyboard('{Enter}')

    expect(commands.setFontSize).not.toHaveBeenCalled()
  })

  it('opens Font properties from the Fonts submenu', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Font properties…' }))

    expect(commands.openFontProperties).toHaveBeenCalled()
  })

  it('opens Paragraph properties from the Paragraph submenu', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Paragraph properties…' }))

    expect(commands.openParagraphProperties).toHaveBeenCalled()
  })

  it('opens Page properties from the Page submenu', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))

    expect(commands.openPageProperties).toHaveBeenCalled()
  })

  it('disables Image in the Format menu when no image is selected', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))

    expect(screen.getByRole('menuitem', { name: 'Image' })).toBeDisabled()
  })

  it('opens Image properties from the Format menu when an image is selected', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { isImageSelected: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Image' }))

    expect(commands.openImageProperties).toHaveBeenCalled()
  })

  it('disables table commands when the caret is not in a table', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    expect(screen.getByRole('menuitem', { name: 'Table properties…' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties…' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties…' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    expect(screen.getByRole('menuitem', { name: 'Insert or delete row' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Insert or delete column' })).toBeDisabled()
  })

  it('opens table properties from the Format menu when the caret is in a table', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { isInTable: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Table properties…' }))

    expect(commands.openTableProperties).toHaveBeenCalled()
  })

  it('does not show Page properties in the icon toolbar', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Page properties' })).not.toBeInTheDocument()
  })

  it('does not show Image properties in the icon toolbar', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Image properties' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert image' })).toBeInTheDocument()
  })

  it('does not show Paragraph properties in the icon toolbar', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Paragraph properties' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Align left' })).toBeInTheDocument()
  })

  it('runs font commands from matching toolbar icons', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Bold' }))
    await user.click(screen.getByRole('button', { name: 'Italic' }))
    await user.click(screen.getByRole('button', { name: 'Underline' }))
    await user.click(screen.getByRole('button', { name: 'Strikethrough' }))

    expect(commands.toggleBold).toHaveBeenCalledTimes(1)
    expect(commands.toggleItalic).toHaveBeenCalledTimes(1)
    expect(commands.toggleUnderline).toHaveBeenCalledTimes(1)
    expect(commands.toggleStrikethrough).toHaveBeenCalledTimes(1)
  })

  it('does not list Font color in the Fonts submenu', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))

    expect(screen.queryByRole('menuitem', { name: 'Font color' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Highlight color' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Font properties…' })).toBeInTheDocument()
  })

  it('applies a font color from the toolbar palette', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Font color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))

    expect(commands.setFontColor).toHaveBeenCalledWith('#ff0000')
  })

  it('applies a highlight from the Fonts submenu palette', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Highlight color' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: '#ffff00' }))

    expect(commands.setHighlightColor).toHaveBeenCalledWith('#ffff00')
  })

  it('applies a heading from the Styles toolbar dropdown', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { getParagraphStyle: () => 'p' },
    })

    expect(screen.getByRole('button', { name: 'Paragraph styles' })).toHaveTextContent('Paragraph')
    await user.click(screen.getByRole('button', { name: 'Paragraph styles' }))
    await user.click(screen.getByRole('option', { name: 'Heading 1' }))

    expect(commands.setParagraphStyle).toHaveBeenCalledWith('h1')
  })

  it('applies a heading from Format then Paragraph styles', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Heading 2' }))

    expect(commands.setParagraphStyle).toHaveBeenCalledWith('h2')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('marks the current paragraph style in the Format submenu', async () => {
    const user = userEvent.setup()
    renderToolbar({
      queries: { getParagraphStyle: () => 'h3' },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))

    expect(screen.getByRole('menuitemradio', { name: 'Heading 3' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Paragraph' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('does not show custom paragraph styles when the feature is disabled', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))

    expect(screen.queryByRole('menuitem', { name: 'Add new paragraph style' })).not.toBeInTheDocument()
  })

  it('applies a custom style from the toolbar dropdown', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: {
        customParagraphStylesEnabled: () => true,
        getCustomParagraphStyles: () => [
          {
            id: 'quote',
            name: 'Quote',
            font: {
              size: 12,
              unit: 'pt',
              marks: { bold: false, italic: true, underline: false, strikethrough: false },
              fontFamily: null,
              fontColor: null,
              highlightColor: null,
            },
          },
        ],
      },
    })

    await user.click(screen.getByRole('button', { name: 'Paragraph styles' }))
    await user.click(screen.getByRole('option', { name: 'Quote' }))

    expect(commands.applyCustomParagraphStyle).toHaveBeenCalledWith('quote')
  })

  it('opens the custom style dialog from Format then Paragraph styles', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: {
        customParagraphStylesEnabled: () => true,
        getCustomParagraphStyles: () => [
          {
            id: 'quote',
            name: 'Quote',
            font: {
              size: 12,
              unit: 'pt',
              marks: { bold: false, italic: true, underline: false, strikethrough: false },
              fontFamily: null,
              fontColor: null,
              highlightColor: null,
            },
          },
        ],
      },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quote' }))

    expect(commands.openCustomParagraphStyleDialog).toHaveBeenCalledWith('quote')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens Add new from Format then Paragraph styles', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { customParagraphStylesEnabled: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Add new paragraph style' }))

    expect(commands.openCustomParagraphStyleDialog).toHaveBeenCalledWith()
  })

  it('marks active font icons as pressed', () => {
    renderToolbar({
      queries: { isBold: () => true, isUnderline: () => true },
    })

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Underline' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Strikethrough' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables font icons when not in visual mode', () => {
    renderToolbar({
      queries: { isVisualMode: () => false, isHtmlMode: () => true },
    })

    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Paragraph styles' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Link' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bookmark' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Switch to visual mode' })).toBeEnabled()
  })

  it('opens Format then Fonts and runs a font command', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Bold' }))

    expect(commands.toggleBold).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('runs reset formatting from the Format menu and the fonts toolbar icon', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Reset formatting' }))
    expect(commands.clearFormatting).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reset formatting' }))
    expect(commands.clearFormatting).toHaveBeenCalledTimes(2)
    expect(
      screen.getByRole('button', { name: 'Reset formatting' }).querySelector('[data-icon="clear-formatting"]'),
    ).not.toBeNull()
  })

  it('disables reset formatting when nothing is selected', () => {
    renderToolbar({
      queries: { hasTextSelection: () => false },
    })

    expect(screen.getByRole('button', { name: 'Reset formatting' })).toBeDisabled()
  })

  it('disables reset formatting in the Format menu when nothing is selected', async () => {
    const user = userEvent.setup()
    renderToolbar({
      queries: { hasTextSelection: () => false },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    expect(screen.getByRole('menuitem', { name: 'Reset formatting' })).toBeDisabled()
  })

  it('checks active font marks in the Fonts submenu', async () => {
    const user = userEvent.setup()
    renderToolbar({
      queries: { isItalic: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))

    expect(screen.getByRole('menuitemcheckbox', { name: 'Bold' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('menuitemcheckbox', { name: 'Italic' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('uses the same icons in the Fonts submenu and the icon toolbar', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))

    expect(screen.getByRole('menuitemcheckbox', { name: 'Bold' }).querySelector('[data-icon="bold"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Bold' }).querySelector('[data-icon="bold"]')).not.toBeNull()
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Strikethrough' }).querySelector('[data-icon="strikethrough"]'),
    ).not.toBeNull()
  })

  it('places alignment icons in their own group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Align' })
    expect(group).toHaveAttribute('data-toolbar-group', 'align')
    expect(group.querySelector('[data-icon="align-left"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="align-center"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="align-right"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="align-justify"]')).not.toBeNull()
  })

  it('places indent and list icons in the paragraph group', () => {
    renderToolbar()

    const group = screen.getByRole('group', { name: 'Paragraph' })
    expect(group).toHaveAttribute('data-toolbar-group', 'paragraph')
    expect(group.querySelector('[data-icon="indent"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="outdent"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="bullet-list"]')).not.toBeNull()
    expect(group.querySelector('[data-icon="numbered-list"]')).not.toBeNull()
  })

  it('runs paragraph commands from matching toolbar icons', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { canOutdent: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Align center' }))
    await user.click(screen.getByRole('button', { name: 'Increase indent' }))
    await user.click(screen.getByRole('button', { name: 'Decrease indent' }))
    await user.click(screen.getByRole('button', { name: 'Bullet list' }))
    await user.click(screen.getByRole('button', { name: 'Numbered list' }))

    expect(commands.alignCenter).toHaveBeenCalledTimes(1)
    expect(commands.indent).toHaveBeenCalledTimes(1)
    expect(commands.outdent).toHaveBeenCalledTimes(1)
    expect(commands.toggleBulletList).toHaveBeenCalledTimes(1)
    expect(commands.toggleNumberedList).toHaveBeenCalledTimes(1)
  })

  it('runs paragraph commands from the Paragraph submenu', async () => {
    const user = userEvent.setup()
    const { commands } = renderToolbar({
      queries: { canOutdent: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Align left' }))

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Increase indent' }))

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Bullet list' }))

    expect(commands.alignLeft).toHaveBeenCalledTimes(1)
    expect(commands.indent).toHaveBeenCalledTimes(1)
    expect(commands.toggleBulletList).toHaveBeenCalledTimes(1)
  })

  it('presses the active alignment and list toolbar buttons', () => {
    renderToolbar({
      queries: { isAlignCenter: () => true, isBulletList: () => true },
    })

    expect(screen.getByRole('button', { name: 'Align left' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Align center' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Bullet list' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Numbered list' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables decrease indent when canOutdent is false', () => {
    renderToolbar()

    expect(screen.getByRole('button', { name: 'Decrease indent' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase indent' })).toBeEnabled()
  })

  it('checks alignment radios in the Paragraph submenu', async () => {
    const user = userEvent.setup()
    renderToolbar({
      queries: { isAlignJustify: () => true, canOutdent: () => true },
    })

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))

    expect(screen.getByRole('menuitemradio', { name: 'Justify' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Align left' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('skips leading, trailing, and consecutive menu separators', async () => {
    const user = userEvent.setup()
    renderToolbar({
      layout: {
        menus: [
          {
            id: 'file',
            items: [
              MENU_SEPARATOR,
              MENU_SEPARATOR,
              'save',
              MENU_SEPARATOR,
              MENU_SEPARATOR,
              'open',
              MENU_SEPARATOR,
            ],
          },
        ],
        iconGroups: [{ id: 'file', items: ['save', 'open'] }],
      },
    })

    await user.click(screen.getByRole('button', { name: 'File menu' }))

    const entries = [...screen.getByRole('menu').children].map((el) => el.getAttribute('role'))
    expect(entries).toEqual(['menuitem', 'separator', 'menuitem'])
  })

  it('disables the File menu and icon buttons', () => {
    renderToolbar({ disabled: true })

    expect(screen.getByRole('button', { name: 'File menu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit menu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'View menu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Format menu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Insert menu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save as HTML file' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Open HTML file' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Print document' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Underline' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Strikethrough' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Switch to visual mode' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Switch to HTML mode' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Toggle full screen' })).toBeDisabled()
  })

  it('renders Spanish chrome labels', async () => {
    const user = userEvent.setup()
    renderToolbar({}, 'es')

    expect(screen.getByRole('button', { name: 'Menú Archivo' })).toHaveTextContent('Archivo')
    expect(screen.getByRole('button', { name: 'Menú Editar' })).toHaveTextContent('Editar')
    expect(screen.getByRole('button', { name: 'Menú Insertar' })).toHaveTextContent('Insertar')
    expect(screen.getByRole('button', { name: 'Menú Vista' })).toHaveTextContent('Vista')
    expect(screen.getByRole('button', { name: 'Menú Formato' })).toHaveTextContent('Formato')
    expect(screen.getByRole('img', { name: 'Editor HTML de CommsPliant' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Barra de herramientas' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Archivo' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Imprimir' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Insertar' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Fuentes' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Vista' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar como archivo HTML' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir archivo HTML' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir documento' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rehacer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar al modo visual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar al modo HTML' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activar o desactivar pantalla completa' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Menú Archivo' }))

    expect(screen.getByRole('menuitem', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Abrir' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Imprimir' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Menú Editar' }))

    expect(screen.getByRole('menuitem', { name: 'Deshacer' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Rehacer' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Menú Insertar' }))

    expect(screen.getByRole('menuitemcheckbox', { name: 'Enlace' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Marcador' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Menú Vista' }))

    expect(screen.getByRole('menuitemradio', { name: 'Visual' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'HTML' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Pantalla completa' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Menú Formato' }))
    expect(screen.getByRole('menuitem', { name: 'Restablecer formato' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Submenú Fuentes' }))

    expect(screen.getByRole('menuitemcheckbox', { name: 'Negrita' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Cursiva' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Subrayado' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Tachado' })).toBeInTheDocument()
  })

  it('does not expose overflow wrap controls', () => {
    renderToolbar()

    expect(screen.queryByRole('button', { name: 'Show more toolbar items' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show fewer toolbar items' })).not.toBeInTheDocument()
  })

  it('closes the File menu on Escape', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows the menu bar and icon toolbar by default', () => {
    renderToolbar()

    expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format menu' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Formatting toolbar' })).toBeInTheDocument()
  })

  it('hides the menu bar when menuVisible is false', () => {
    renderToolbar({ menuVisible: false })

    expect(screen.queryByRole('button', { name: 'File menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Insert menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Format menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Formatting toolbar' })).toBeInTheDocument()
  })

  it('hides the icon toolbar when toolbarVisible is false', () => {
    renderToolbar({ toolbarVisible: false })

    expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format menu' })).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Formatting toolbar' })).not.toBeInTheDocument()
  })

  it('renders nothing when both surfaces are hidden', () => {
    const { container } = renderToolbar({ menuVisible: false, toolbarVisible: false })

    expect(container.firstChild).toBeNull()
  })

  describe('tooltips', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    function tooltip(text: string) {
      return screen.queryByText(text, { selector: '[data-toolbar-tooltip]' })
    }

    function triggerFor(name: string) {
      return screen.getByRole('button', { name }).closest('[data-tooltip-trigger]') as HTMLElement
    }

    it('shows a localised tooltip after hovering a toolbar icon', () => {
      vi.useFakeTimers()
      renderToolbar()

      const save = screen.getByRole('button', { name: 'Save as HTML file' })
      fireEvent.mouseEnter(triggerFor('Save as HTML file'))

      expect(tooltip('Save')).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(TOOLTIP_HOVER_DELAY_MS)
      })

      expect(tooltip('Save')).toBeInTheDocument()
      expect(tooltip('Save')).toHaveAttribute('aria-hidden', 'true')
      expect(save).toHaveAccessibleName('Save as HTML file')
    })

    it('hides the tooltip when the pointer leaves the icon', () => {
      vi.useFakeTimers()
      renderToolbar()

      const trigger = triggerFor('Save as HTML file')
      fireEvent.mouseEnter(trigger)
      act(() => {
        vi.advanceTimersByTime(TOOLTIP_HOVER_DELAY_MS)
      })
      expect(tooltip('Save')).toBeInTheDocument()

      fireEvent.mouseLeave(trigger)
      expect(tooltip('Save')).not.toBeInTheDocument()
    })

    it('shows a tooltip immediately on keyboard focus', () => {
      renderToolbar()

      act(() => {
        screen.getByRole('button', { name: 'Save as HTML file' }).focus()
      })

      expect(tooltip('Save')).toBeInTheDocument()
    })

    it('shows Spanish tooltip labels', () => {
      vi.useFakeTimers()
      renderToolbar({}, 'es')

      fireEvent.mouseEnter(triggerFor('Guardar como archivo HTML'))
      act(() => {
        vi.advanceTimersByTime(TOOLTIP_HOVER_DELAY_MS)
      })

      expect(tooltip('Guardar')).toBeInTheDocument()
    })
  })

  describe('compact hamburger menu', () => {
    afterEach(() => {
      document.body.style.overflow = ''
    })

    it('shows a hamburger and hides desktop menus', () => {
      renderToolbar({ compact: true })

      expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'File menu' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Edit menu' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Insert menu' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'View menu' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Format menu' })).not.toBeInTheDocument()
    })

    it('keeps the brand mark in the menu bar when the overlay is open', async () => {
      const user = userEvent.setup()
      renderToolbar({ compact: true })

      await user.click(screen.getByRole('button', { name: 'Open menu' }))

      const mark = screen.getByRole('img', { name: 'CommsPliant HTML editor' })
      const overlay = screen.getByRole('dialog', { name: 'Editor menu' })
      expect(overlay.contains(mark)).toBe(false)
      expect(
        mark.compareDocumentPosition(screen.getByRole('button', { name: 'Open menu' })) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('keeps desktop menus when compact is forced off', () => {
      renderToolbar({ compact: false })

      expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    })

    it('opens a full-screen overlay with menu disclosures', async () => {
      const user = userEvent.setup()
      renderToolbar({ compact: true })

      await user.click(screen.getByRole('button', { name: 'Open menu' }))

      expect(screen.getByRole('dialog', { name: 'Editor menu' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit menu' })).toBeInTheDocument()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('runs File save from the overlay', async () => {
      const user = userEvent.setup()
      const { commands } = renderToolbar({ compact: true })

      await user.click(screen.getByRole('button', { name: 'Open menu' }))
      await user.click(screen.getByRole('button', { name: 'File menu' }))
      await user.click(screen.getByRole('menuitem', { name: 'Save' }))

      expect(commands.save).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog', { name: 'Editor menu' })).not.toBeInTheDocument()
    })

    it('closes the overlay from the close button', async () => {
      const user = userEvent.setup()
      renderToolbar({ compact: true })

      await user.click(screen.getByRole('button', { name: 'Open menu' }))
      await user.click(screen.getByRole('button', { name: 'Close menu' }))

      expect(screen.queryByRole('dialog', { name: 'Editor menu' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus()
    })

    it('closes an open disclosure on the first Escape and the overlay on the second', async () => {
      const user = userEvent.setup()
      renderToolbar({ compact: true })

      await user.click(screen.getByRole('button', { name: 'Open menu' }))
      await user.click(screen.getByRole('button', { name: 'File menu' }))
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await user.keyboard('{Escape}')

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(screen.getByRole('dialog', { name: 'Editor menu' })).toBeInTheDocument()

      await user.keyboard('{Escape}')

      expect(screen.queryByRole('dialog', { name: 'Editor menu' })).not.toBeInTheDocument()
    })

    it('hides the hamburger when menuVisible is false', () => {
      renderToolbar({ compact: true, menuVisible: false })

      expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
    })

    it('labels the hamburger and overlay in Spanish', async () => {
      const user = userEvent.setup()
      renderToolbar({ compact: true }, 'es')

      expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Abrir menú' }))

      expect(screen.getByRole('dialog', { name: 'Menú del editor' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeInTheDocument()
    })
  })
})
