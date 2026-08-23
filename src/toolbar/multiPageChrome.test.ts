import { describe, expect, it } from 'vitest'
import { defaultToolbarLayout } from './defaultLayout'
import { filterInsertPageLayout } from './multiPageChrome'
import { isMenuSubmenu } from './types'

describe('filterInsertPageLayout', () => {
  function hasInsertPageSubmenu(layout: ReturnType<typeof filterInsertPageLayout>): boolean {
    const insertMenu = layout.menus.find((menu) => menu.id === 'insert')
    return (
      insertMenu?.items.some(
        (item) => isMenuSubmenu(item) && item.submenu === 'insertPage',
      ) ?? false
    )
  }

  it('removes the insert page submenu from the Insert menu when not visible', () => {
    const filtered = filterInsertPageLayout(defaultToolbarLayout, false)
    const insertMenu = filtered.menus.find((menu) => menu.id === 'insert')
    expect(hasInsertPageSubmenu(filtered)).toBe(false)
    expect(insertMenu?.items.some((item) => item === 'insertPage')).toBe(false)
  })

  it('keeps the insert page submenu when visible', () => {
    const filtered = filterInsertPageLayout(defaultToolbarLayout, true)
    expect(hasInsertPageSubmenu(filtered)).toBe(true)
  })
})
