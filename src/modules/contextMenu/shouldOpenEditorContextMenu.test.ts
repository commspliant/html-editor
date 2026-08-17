import { describe, expect, it } from 'vitest'
import { shouldOpenEditorContextMenu } from './shouldOpenEditorContextMenu'

describe('shouldOpenEditorContextMenu', () => {
  it('does not open after a touch or pen long-press', () => {
    expect(shouldOpenEditorContextMenu({ button: 0, ctrlKey: false }, 'touch')).toBe(false)
    expect(shouldOpenEditorContextMenu({ button: 0, ctrlKey: false }, 'pen')).toBe(false)
  })

  it('opens on a mouse right-click even after a touch pointer', () => {
    expect(shouldOpenEditorContextMenu({ button: 2, ctrlKey: false }, 'touch')).toBe(true)
  })

  it('opens on Ctrl-click even after a touch pointer', () => {
    expect(shouldOpenEditorContextMenu({ button: 0, ctrlKey: true }, 'touch')).toBe(true)
  })

  it('opens when the last pointer type is mouse or unknown', () => {
    expect(shouldOpenEditorContextMenu({ button: 0, ctrlKey: false }, 'mouse')).toBe(true)
    expect(shouldOpenEditorContextMenu({ button: 2, ctrlKey: false }, 'mouse')).toBe(true)
    expect(shouldOpenEditorContextMenu({ button: 0, ctrlKey: false }, undefined)).toBe(true)
  })
})
