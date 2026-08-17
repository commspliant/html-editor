import { describe, expect, it } from 'vitest'
import {
  applyToolbarCustomization,
  mergeGroupOrder,
  moveToolbarGroup,
  moveToolbarGroupByOffset,
  parseToolbarCustomization,
  pinFullscreenLast,
  toggleToolbarItemHidden,
} from './toolbarCustomization'
import type { ToolbarIconGroup } from './types'

const base: ToolbarIconGroup[] = [
  { id: 'file', items: ['save', 'open'] },
  { id: 'print', items: ['print'] },
  { id: 'edit', items: ['undo', 'redo'] },
  { id: 'view', items: ['visual', 'html'] },
  { id: 'fullscreen', items: ['fullscreen'] },
]

describe('pinFullscreenLast', () => {
  it('moves fullscreen to the end', () => {
    expect(pinFullscreenLast(['fullscreen', 'file', 'edit'])).toEqual(['file', 'edit', 'fullscreen'])
  })
})

describe('mergeGroupOrder', () => {
  it('returns the default order when nothing is saved', () => {
    expect(mergeGroupOrder(['file', 'edit', 'fullscreen'], undefined)).toEqual([
      'file',
      'edit',
      'fullscreen',
    ])
  })

  it('keeps saved order for known groups and pins fullscreen last', () => {
    expect(mergeGroupOrder(['file', 'print', 'edit', 'fullscreen'], ['edit', 'file', 'fullscreen'])).toEqual([
      'edit',
      'file',
      'print',
      'fullscreen',
    ])
  })

  it('inserts a new default group after its preceding neighbor', () => {
    expect(
      mergeGroupOrder(['file', 'video', 'print', 'fullscreen'], ['print', 'file', 'fullscreen']),
    ).toEqual(['print', 'file', 'video', 'fullscreen'])
  })

  it('ignores unknown saved group ids', () => {
    expect(mergeGroupOrder(['file', 'edit'], ['gone', 'edit', 'file'])).toEqual(['edit', 'file'])
  })
})

describe('applyToolbarCustomization', () => {
  it('hides items and drops empty groups', () => {
    expect(
      applyToolbarCustomization(base, {
        groupOrder: ['file', 'print', 'edit', 'view', 'fullscreen'],
        hiddenItemIds: ['print', 'open'],
      }),
    ).toEqual([
      { id: 'file', items: ['save'] },
      { id: 'edit', items: ['undo', 'redo'] },
      { id: 'view', items: ['visual', 'html'] },
      { id: 'fullscreen', items: ['fullscreen'] },
    ])
  })

  it('reorders groups and keeps new items visible', () => {
    const withVideo: ToolbarIconGroup[] = [
      { id: 'file', items: ['save', 'open'] },
      { id: 'insert', items: ['link', 'video'] },
      { id: 'fullscreen', items: ['fullscreen'] },
    ]
    expect(
      applyToolbarCustomization(withVideo, {
        groupOrder: ['insert', 'file', 'fullscreen'],
        hiddenItemIds: ['link'],
      }),
    ).toEqual([
      { id: 'insert', items: ['video'] },
      { id: 'file', items: ['save', 'open'] },
      { id: 'fullscreen', items: ['fullscreen'] },
    ])
  })

  it('returns the base layout when settings are null', () => {
    expect(applyToolbarCustomization(base, null)).toEqual(base)
  })
})

describe('toggleToolbarItemHidden', () => {
  it('adds and removes hidden ids', () => {
    const hidden = toggleToolbarItemHidden(null, base, 'print', false)
    expect(hidden.hiddenItemIds).toEqual(['print'])
    expect(toggleToolbarItemHidden(hidden, base, 'print', true).hiddenItemIds).toEqual([])
  })
})

describe('moveToolbarGroup', () => {
  it('reorders groups and keeps fullscreen last', () => {
    const moved = moveToolbarGroup(null, base, 'file', 'edit')
    expect(moved.groupOrder).toEqual(['print', 'edit', 'file', 'view', 'fullscreen'])
  })

  it('does not drag the fullscreen group', () => {
    expect(moveToolbarGroup(null, base, 'fullscreen', 'file').groupOrder.at(-1)).toBe('fullscreen')
    expect(moveToolbarGroup(null, base, 'file', 'fullscreen').groupOrder[0]).toBe('file')
  })
})

describe('moveToolbarGroupByOffset', () => {
  it('moves a group up and down', () => {
    const down = moveToolbarGroupByOffset(null, base, 'file', 1)
    expect(down.groupOrder[0]).toBe('print')
    expect(down.groupOrder[1]).toBe('file')
    const up = moveToolbarGroupByOffset(down, base, 'file', -1)
    expect(up.groupOrder[0]).toBe('file')
  })
})

describe('parseToolbarCustomization', () => {
  it('returns null for empty or invalid payloads', () => {
    expect(parseToolbarCustomization(null)).toBeNull()
    expect(parseToolbarCustomization({ groupOrder: [], hiddenItemIds: [] })).toBeNull()
    expect(parseToolbarCustomization('nope')).toBeNull()
  })

  it('keeps string ids only', () => {
    expect(
      parseToolbarCustomization({
        groupOrder: ['file', 2, 'edit'],
        hiddenItemIds: ['print', null, 'print'],
      }),
    ).toEqual({
      groupOrder: ['file', 'edit'],
      hiddenItemIds: ['print'],
    })
  })
})
