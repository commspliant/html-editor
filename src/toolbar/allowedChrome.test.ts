import { describe, expect, it } from 'vitest'
import { MENU_SEPARATOR, type ToolbarLayout } from './types'
import { filterAllowedChrome } from './allowedChrome'

const layout: ToolbarLayout = {
  menus: [
    { id: 'file', items: ['save', 'open', MENU_SEPARATOR, 'print'] },
    { id: 'edit', items: ['undo', 'redo'] },
    { id: 'insert', items: ['link', 'bookmark'] },
    { id: 'custom', items: ['ai'] },
  ],
  iconGroups: [
    { id: 'file', items: ['save', 'open'] },
    { id: 'print', items: ['print'] },
    { id: 'edit', items: ['undo', 'redo'] },
    { id: 'custom', items: ['ai'] },
    { id: 'fullscreen', items: ['fullscreen'] },
  ],
}

describe('filterAllowedChrome', () => {
  it('returns the same layout when the allowlist is omitted', () => {
    expect(filterAllowedChrome(layout)).toBe(layout)
  })

  it('returns the same layout when both fields are omitted', () => {
    expect(filterAllowedChrome(layout, {})).toBe(layout)
  })

  it('keeps whole menus and does not rewrite their items', () => {
    const next = filterAllowedChrome(layout, { menus: ['file', 'edit'] })
    expect(next.menus).toEqual([
      { id: 'file', items: ['save', 'open', MENU_SEPARATOR, 'print'] },
      { id: 'edit', items: ['undo', 'redo'] },
    ])
    expect(next.iconGroups).toBe(layout.iconGroups)
    expect(next.menus[0].items).toBe(layout.menus[0].items)
  })

  it('keeps only listed toolbar items and drops empty groups', () => {
    const next = filterAllowedChrome(layout, { toolbar: ['save', 'undo', 'ai'] })
    expect(next.menus).toBe(layout.menus)
    expect(next.iconGroups).toEqual([
      { id: 'file', items: ['save'] },
      { id: 'edit', items: ['undo'] },
      { id: 'custom', items: ['ai'] },
    ])
  })

  it('filters menus and toolbar independently when both lists are set', () => {
    const next = filterAllowedChrome(layout, {
      menus: ['file'],
      toolbar: ['undo', 'print'],
    })
    expect(next.menus).toEqual([layout.menus[0]])
    expect(next.iconGroups).toEqual([
      { id: 'print', items: ['print'] },
      { id: 'edit', items: ['undo'] },
    ])
  })

  it('hides every menu or toolbar button when the list is empty', () => {
    expect(filterAllowedChrome(layout, { menus: [] }).menus).toEqual([])
    expect(filterAllowedChrome(layout, { toolbar: [] }).iconGroups).toEqual([])
  })

  it('ignores unknown ids', () => {
    const next = filterAllowedChrome(layout, {
      menus: ['file', 'gone'],
      toolbar: ['save', 'nope'],
    })
    expect(next.menus.map((menu) => menu.id)).toEqual(['file'])
    expect(next.iconGroups).toEqual([{ id: 'file', items: ['save'] }])
  })

  it('keeps custom menu and toolbar ids when listed', () => {
    const next = filterAllowedChrome(layout, {
      menus: ['custom'],
      toolbar: ['ai'],
    })
    expect(next.menus).toEqual([{ id: 'custom', items: ['ai'] }])
    expect(next.iconGroups).toEqual([{ id: 'custom', items: ['ai'] }])
  })
})
