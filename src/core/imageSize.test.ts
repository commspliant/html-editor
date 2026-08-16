import { describe, expect, it } from 'vitest'
import {
  clampImageSize,
  parseImageSize,
  parseImageSizeInput,
  scaleLockedSize,
} from './imageSize'

describe('parseImageSize', () => {
  it('parses supported units and rejects auto or empty', () => {
    expect(parseImageSize('50%')).toEqual({ value: 50, unit: '%' })
    expect(parseImageSize('200px')).toEqual({ value: 200, unit: 'px' })
    expect(parseImageSize('12pc')).toEqual({ value: 12, unit: 'pc' })
    expect(parseImageSize('auto')).toBeNull()
    expect(parseImageSize('')).toBeNull()
    expect(parseImageSize('10vw')).toBeNull()
  })
})

describe('parseImageSizeInput', () => {
  it('uses the fallback unit for a bare number', () => {
    expect(parseImageSizeInput('75', '%')).toEqual({ value: 75, unit: '%' })
    expect(parseImageSizeInput('100px', '%')).toEqual({ value: 100, unit: 'px' })
    expect(parseImageSizeInput('', 'px')).toBeNull()
  })
})

describe('scaleLockedSize', () => {
  it('scales the other side from the aspect ratio in the same unit', () => {
    expect(scaleLockedSize('width', { value: 200, unit: 'px' }, 2)).toEqual({
      width: { value: 200, unit: 'px' },
      height: { value: 100, unit: 'px' },
    })
    expect(scaleLockedSize('height', { value: 50, unit: '%' }, 2)).toEqual({
      width: { value: 100, unit: '%' },
      height: { value: 50, unit: '%' },
    })
  })
})

describe('clampImageSize', () => {
  it('rejects non-positive values', () => {
    expect(clampImageSize(0, 'px')).toBeNull()
    expect(clampImageSize(-4, 'px')).toBeNull()
  })
})
