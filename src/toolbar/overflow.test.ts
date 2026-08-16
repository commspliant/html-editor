import { describe, expect, it } from 'vitest'
import { getOverflowState, overflowScrollAmount } from './overflow'

describe('getOverflowState', () => {
  it('hides both controls when icons fit', () => {
    expect(getOverflowState({ scrollLeft: 0, scrollWidth: 120, clientWidth: 120 })).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
    })
  })

  it('shows only the next control at the start of overflow', () => {
    expect(getOverflowState({ scrollLeft: 0, scrollWidth: 400, clientWidth: 120 })).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
    })
  })

  it('shows only the previous control at the end of overflow', () => {
    expect(getOverflowState({ scrollLeft: 280, scrollWidth: 400, clientWidth: 120 })).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
    })
  })

  it('shows both controls in the middle of overflow', () => {
    expect(getOverflowState({ scrollLeft: 80, scrollWidth: 400, clientWidth: 120 })).toEqual({
      canScrollLeft: true,
      canScrollRight: true,
    })
  })
})

describe('overflowScrollAmount', () => {
  it('scrolls by the first icon button width', () => {
    const track = document.createElement('div')
    const button = document.createElement('button')
    Object.defineProperty(button, 'offsetWidth', { value: 36 })
    track.append(button)
    expect(overflowScrollAmount(track)).toBe(36)
  })

  it('falls back when buttons cannot be measured', () => {
    expect(overflowScrollAmount(document.createElement('div'))).toBe(40)
  })

  it('falls back when the button width is 0', () => {
    const track = document.createElement('div')
    track.append(document.createElement('button'))
    expect(overflowScrollAmount(track)).toBe(40)
  })
})
