import { describe, expect, it } from 'vitest'
import { filterCapabilitiesLayout } from './capabilitiesChrome'
import { resolveEditorCapabilities } from './resolveEditorCapabilities'
import { COMMSPLIANT_EMAIL_CONTRACT } from './testContracts'
import { defaultToolbarLayout } from '../toolbar/defaultLayout'

describe('filterCapabilitiesLayout', () => {
  it('removes hidden items from menus and icon groups', () => {
    const profile = resolveEditorCapabilities(COMMSPLIANT_EMAIL_CONTRACT)
    const filtered = filterCapabilitiesLayout(defaultToolbarLayout, profile)
    const insertMenu = filtered.menus.find((menu) => menu.id === 'insert')
    const insertItems = insertMenu?.items.filter((item) => typeof item === 'string')
    expect(insertItems).not.toContain('audio')
    expect(insertItems).not.toContain('youtube')

    const insertGroup = filtered.iconGroups.find((group) => group.id === 'insert')
    expect(insertGroup?.items).not.toContain('horizontalRule')
  })
})
