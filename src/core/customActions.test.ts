import { describe, expect, it, vi } from 'vitest'
import { defaultToolbarCatalog } from '../toolbar/defaultCatalog'
import { defaultToolbarLayout } from '../toolbar/defaultLayout'
import { MENU_SEPARATOR } from '../toolbar/types'
import type { CustomAction } from '../types'
import {
  BUILTIN_TOOLBAR_ITEM_IDS,
  createCustomActionCommands,
  customCommandName,
  mergeCustomActions,
} from './customActions'

function action(overrides: Partial<CustomAction> & Pick<CustomAction, 'id'>): CustomAction {
  return {
    label: overrides.label ?? overrides.id,
    showIn: 'both',
    onAction: vi.fn(),
    ...overrides,
  }
}

describe('mergeCustomActions', () => {
  it('appends an item to the File menu and a new custom toolbar group', () => {
    const { catalog, layout } = mergeCustomActions(
      [action({ id: 'ai', label: 'AI', menu: { id: 'file' } })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.find((menu) => menu.id === 'file')?.items).toEqual([
      'save',
      'open',
      MENU_SEPARATOR,
      'print',
      MENU_SEPARATOR,
      'ai',
    ])
    expect(layout.iconGroups.map((group) => group.id)).toEqual(['file', 'print', 'edit', 'insert', 'table', 'font', 'align', 'paragraph', 'view', 'custom', 'fullscreen'])
    expect(layout.iconGroups.find((group) => group.id === 'custom')?.items).toEqual(['ai'])
    expect(catalog.items.ai?.label).toBe('AI')
    expect(catalog.items.ai?.command).toBe('custom:ai')
    expect(catalog.groups.custom?.labelKey).toBe('toolbarGroupCustom')
  })

  it('creates a new top-level menu from menu.id and label', () => {
    const { catalog, layout } = mergeCustomActions(
      [action({ id: 'ai', menu: { id: 'tools', label: 'Tools' }, showIn: 'menu' })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.map((menu) => menu.id)).toEqual(['file', 'edit', 'view', 'insert', 'format', 'table', 'help', 'tools'])
    expect(layout.menus.find((menu) => menu.id === 'tools')?.items).toEqual(['ai'])
    expect(catalog.menus.tools?.label).toBe('Tools')
    expect(layout.iconGroups.map((group) => group.id)).toEqual(['file', 'print', 'edit', 'insert', 'table', 'font', 'align', 'paragraph', 'view', 'fullscreen'])
  })

  it('uses the default custom menu when menu placement is omitted', () => {
    const { catalog, layout } = mergeCustomActions(
      [action({ id: 'ai', showIn: 'menu' })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.find((menu) => menu.id === 'custom')?.items).toEqual(['ai'])
    expect(catalog.menus.custom?.labelKey).toBe('menuCustom')
  })

  it('appends toolbar items to an existing group', () => {
    const { layout } = mergeCustomActions(
      [action({ id: 'ai', showIn: 'toolbar', toolbarGroup: 'file' })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.iconGroups.find((group) => group.id === 'file')?.items).toEqual([
      'save',
      'open',
      'ai',
    ])
    expect(layout.menus).toEqual(defaultToolbarLayout.menus)
  })

  it('preserves array order within a shared menu and group', () => {
    const { layout } = mergeCustomActions(
      [
        action({ id: 'one', menu: { id: 'tools', label: 'Tools' } }),
        action({ id: 'two', menu: { id: 'tools' } }),
      ],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.find((menu) => menu.id === 'tools')?.items).toEqual(['one', 'two'])
    expect(layout.iconGroups.find((group) => group.id === 'custom')?.items).toEqual(['one', 'two'])
  })

  it('inserts one separator before the first custom item on a built-in menu', () => {
    const { layout } = mergeCustomActions(
      [
        action({ id: 'one', menu: { id: 'file' } }),
        action({ id: 'two', menu: { id: 'file' } }),
      ],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.find((menu) => menu.id === 'file')?.items).toEqual([
      'save',
      'open',
      MENU_SEPARATOR,
      'print',
      MENU_SEPARATOR,
      'one',
      'two',
    ])
  })

  it('does not insert a leading separator on a new custom menu', () => {
    const { layout } = mergeCustomActions(
      [action({ id: 'ai', menu: { id: 'tools', label: 'Tools' }, showIn: 'menu' })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.find((menu) => menu.id === 'tools')?.items).toEqual(['ai'])
  })

  it('skips ids that collide with the menu separator', () => {
    const { catalog, layout } = mergeCustomActions(
      [action({ id: MENU_SEPARATOR, label: 'Nope', menu: { id: 'file' } })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(catalog.items[MENU_SEPARATOR]).toBeUndefined()
    expect(layout.menus.find((menu) => menu.id === 'file')?.items).toEqual([
      'save',
      'open',
      MENU_SEPARATOR,
      'print',
    ])
  })

  it('skips ids that collide with built-in items', () => {
    const { catalog, layout } = mergeCustomActions(
      [action({ id: 'save', label: 'Nope' })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(catalog.items.save?.labelKey).toBe('commandSave')
    expect(layout.menus.find((menu) => menu.id === 'file')?.items).toEqual([
      'save',
      'open',
      MENU_SEPARATOR,
      'print',
    ])
    expect(BUILTIN_TOOLBAR_ITEM_IDS.has('save')).toBe(true)
  })

  it('appends custom items to Format after the Fonts submenu', () => {
    const { layout } = mergeCustomActions(
      [action({ id: 'ai', menu: { id: 'format' }, showIn: 'menu' })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(layout.menus.find((menu) => menu.id === 'format')?.items).toEqual([
      { submenu: 'paragraphStyles', items: [] },
      MENU_SEPARATOR,
      {
        submenu: 'font',
        items: [
          'fontProperties',
          'customCss',
          MENU_SEPARATOR,
          { submenu: 'highlightColor', items: [] },
          MENU_SEPARATOR,
          'bold',
          'italic',
          'underline',
          'strikethrough',
        ],
      },
      MENU_SEPARATOR,
      'clearFormatting',
      MENU_SEPARATOR,
      {
        submenu: 'paragraph',
        items: [
          'paragraphProperties',
          MENU_SEPARATOR,
          'alignLeft',
          'alignCenter',
          'alignRight',
          'alignJustify',
          MENU_SEPARATOR,
          'indent',
          'outdent',
          MENU_SEPARATOR,
          'bulletList',
          'numberedList',
        ],
      },
      MENU_SEPARATOR,
      'imageProperties',
      MENU_SEPARATOR,
      'ai',
    ])
  })

  it('does not mutate the default catalog or layout', () => {
    const fileItems = defaultToolbarLayout.menus[0].items
    const formatItems = defaultToolbarLayout.menus.find((menu) => menu.id === 'format')?.items
    mergeCustomActions(
      [action({ id: 'ai', menu: { id: 'file' } })],
      defaultToolbarCatalog,
      defaultToolbarLayout,
    )

    expect(defaultToolbarLayout.menus[0].items).toBe(fileItems)
    expect(defaultToolbarLayout.menus[0].items).toEqual(['save', 'open', MENU_SEPARATOR, 'print'])
    expect(defaultToolbarLayout.menus.find((menu) => menu.id === 'format')?.items).toBe(formatItems)
    expect(defaultToolbarCatalog.items.ai).toBeUndefined()
    expect(defaultToolbarCatalog.items.bold).toBeDefined()
  })
})

describe('createCustomActionCommands', () => {
  it('invokes onAction through the custom command name', () => {
    const onAction = vi.fn()
    const api = {
      mode: 'visual' as const,
      selection: { text: '', collapsed: true, start: 0, end: 0 },
      getHtml: () => '',
      setHtml: vi.fn(),
      insertText: vi.fn(),
      insertHtml: vi.fn(),
    }
    const commands = createCustomActionCommands(
      [action({ id: 'ai', onAction })],
      () => api,
    )

    void commands[customCommandName('ai')]?.()

    expect(onAction).toHaveBeenCalledWith(api)
  })

  it('does not register colliding built-in ids', () => {
    const onAction = vi.fn()
    const commands = createCustomActionCommands([action({ id: 'save', onAction })], () => ({
      mode: 'visual',
      selection: { text: '', collapsed: true, start: 0, end: 0 },
      getHtml: () => '',
      setHtml: vi.fn(),
      insertText: vi.fn(),
      insertHtml: vi.fn(),
    }))

    expect(commands[customCommandName('save')]).toBeUndefined()
    expect(onAction).not.toHaveBeenCalled()
  })
})
