import { afterEach, describe, expect, it } from 'vitest'
import { hsvToRgb, rememberRecentColor, resetRecentColors, rgbToHex, rgbToHsv, getRecentColors } from './colorModel'

afterEach(() => {
  resetRecentColors()
})

describe('colorModel', () => {
  it('round-trips rgb through hsv', () => {
    const rgb = { r: 204, g: 0, b: 0 }
    expect(hsvToRgb(rgbToHsv(rgb))).toEqual(rgb)
  })

  it('formats rgb as hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })

  it('remembers recent custom colors with newest first', () => {
    rememberRecentColor('#ff0000')
    rememberRecentColor('#00ff00')
    rememberRecentColor('#ff0000')
    expect(getRecentColors()).toEqual(['#ff0000', '#00ff00'])
  })
})
