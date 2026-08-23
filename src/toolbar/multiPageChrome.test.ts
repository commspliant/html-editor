import { describe, expect, it } from 'vitest'
import { defaultToolbarLayout } from './defaultLayout'
import { filterMultiPageLayout } from './multiPageChrome'
import { isMenuSubmenu } from './types'

describe('filterMultiPageLayout', () => {
  function hasInsertPageSubmenu(layout: ReturnType<typeof filterMultiPageLayout>): boolean {
    const insertMenu = layout.menus.find((menu) => menu.id === 'insert')
    return (
      insertMenu?.items.some(
        (item) => isMenuSubmenu(item) && item.submenu === 'insertPage',
      ) ?? false
    )
  }

  function hasDeletePageItem(layout: ReturnType<typeof filterMultiPageLayout>): boolean {
    const editMenu = layout.menus.find((menu) => menu.id === 'edit')
    const pageSubmenu = editMenu?.items.find(
      (item) => isMenuSubmenu(item) && item.submenu === 'page',
    )
    return pageSubmenu?.items.includes('deletePage') ?? false
  }

  it('removes the insert page submenu from the Insert menu when not visible', () => {
    const filtered = filterMultiPageLayout(defaultToolbarLayout, false)
    const insertMenu = filtered.menus.find((menu) => menu.id === 'insert')
    expect(hasInsertPageSubmenu(filtered)).toBe(false)
    expect(insertMenu?.items.some((item) => item === 'insertPage')).toBe(false)
  })

  it('removes delete page from Edit → Page when not visible', () => {
    const filtered = filterMultiPageLayout(defaultToolbarLayout, false)
    expect(hasDeletePageItem(filtered)).toBe(false)
  })

  it('keeps multi-page items when visible', () => {
    const filtered = filterMultiPageLayout(defaultToolbarLayout, true)
    expect(hasInsertPageSubmenu(filtered)).toBe(true)
    expect(hasDeletePageItem(filtered)).toBe(true)
  })
})
