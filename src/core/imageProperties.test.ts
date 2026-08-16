import { afterEach, describe, expect, it } from 'vitest'
import { selectImageInDocument } from './image'
import {
  IMAGE_HOVER_CSS_ATTR,
  applyImagePropertiesInDocument,
  defaultImagePropertiesApply,
  ensureSizeForObjectFit,
  queryImageAtSelection,
  readImageProperties,
  sanitizeHoverCss,
  writeImageProperties,
} from './imageProperties'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('sanitizeHoverCss', () => {
  it('keeps safe declarations and drops dangerous ones', () => {
    expect(sanitizeHoverCss('opacity: 0.8; transform: scale(1.02)')).toBe(
      'opacity: 0.8; transform: scale(1.02)',
    )
    expect(sanitizeHoverCss('opacity: expression(alert(1)); color: red')).toBe('color: red')
    expect(sanitizeHoverCss('background: url(javascript:alert(1))')).toBe('')
  })
})

describe('ensureSizeForObjectFit', () => {
  it('locks and fills the missing side for cover', () => {
    const next = ensureSizeForObjectFit(
      defaultImagePropertiesApply({
        sizeMode: 'width',
        width: { value: 200, unit: 'px' },
        objectFit: 'cover',
      }),
      2,
    )
    expect(next.sizeMode).toBe('lock')
    expect(next.height).toEqual({ value: 100, unit: 'px' })
  })
})

describe('writeImageProperties', () => {
  it('writes width-only size and restores the insert default when cleared', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement

    writeImageProperties(
      img,
      defaultImagePropertiesApply({
        sizeMode: 'width',
        width: { value: 200, unit: 'px' },
      }),
    )
    expect(img.style.width).toBe('200px')
    expect(img.style.height).toBe('auto')
    expect(img.style.maxWidth).toBe('')

    writeImageProperties(img, defaultImagePropertiesApply())
    expect(img.style.width).toBe('')
    expect(img.style.height).toBe('auto')
    expect(img.style.maxWidth).toBe('100%')
  })

  it('locks both dimensions', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement
    writeImageProperties(
      img,
      defaultImagePropertiesApply({
        sizeMode: 'lock',
        width: { value: 200, unit: 'px' },
        height: { value: 100, unit: 'px' },
      }),
    )
    expect(img.style.width).toBe('200px')
    expect(img.style.height).toBe('100px')
  })

  it('writes wrap alignment', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement

    writeImageProperties(img, defaultImagePropertiesApply({ align: 'left' }))
    expect(img.style.float).toBe('left')

    writeImageProperties(img, defaultImagePropertiesApply({ align: 'center' }))
    expect(img.style.float).toBe('')
    expect(img.style.display).toBe('block')
    expect(img.style.marginLeft).toBe('auto')
    expect(img.style.marginRight).toBe('auto')

    writeImageProperties(img, defaultImagePropertiesApply({ align: 'right' }))
    expect(img.style.float).toBe('right')
    expect(img.style.display).toBe('')
  })

  it('writes object-fit, position, rotation, and hover css', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement

    writeImageProperties(
      img,
      defaultImagePropertiesApply({
        sizeMode: 'lock',
        width: { value: 200, unit: 'px' },
        height: { value: 100, unit: 'px' },
        objectFit: 'cover',
        objectPosition: 'top left',
        rotateDeg: 15,
        hoverCss: 'opacity: 0.8; transform: scale(1.02)',
        opacity: 0.9,
      }),
    )

    expect(img.style.objectFit).toBe('cover')
    expect(img.style.objectPosition).toBe('top left')
    expect(img.style.transform).toBe('rotate(15deg)')
    expect(img.style.opacity).toBe('0.9')
    expect(img.getAttribute(IMAGE_HOVER_CSS_ATTR)).toBe('opacity: 0.8; transform: scale(1.02)')
    expect(img.getAttribute('onmouseover')).toContain('data-hover-css')
    expect(img.getAttribute('onmouseout')).toContain('_hp')
  })

  it('writes border, radius, shadow, and margin', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement
    writeImageProperties(
      img,
      defaultImagePropertiesApply({
        margin: {
          top: { value: 8, unit: 'px' },
          right: { value: 8, unit: 'px' },
          bottom: { value: 8, unit: 'px' },
          left: { value: 8, unit: 'px' },
        },
        border: { style: 'solid', width: { value: 2, unit: 'px' }, color: '#cc0000' },
        borderRadius: { value: 6, unit: 'px' },
        boxShadow: {
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 4, unit: 'px' },
          blur: { value: 8, unit: 'px' },
          spread: { value: 0, unit: 'px' },
          color: '#000000',
          inset: false,
        },
      }),
    )
    expect(img.style.marginTop).toBe('8px')
    expect(img.style.borderStyle).toBe('solid')
    expect(img.style.borderWidth).toBe('2px')
    expect(img.style.borderRadius).toBe('6px')
    expect(img.style.boxShadow).toContain('4px')
  })
})

describe('readImageProperties', () => {
  it('round-trips size, align, fit, rotate, and hover', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png"></p>')
    const img = el.querySelector('img') as HTMLImageElement
    const draft = defaultImagePropertiesApply({
      sizeMode: 'lock',
      width: { value: 160, unit: 'px' },
      height: { value: 80, unit: 'px' },
      align: 'left',
      objectFit: 'contain',
      objectPosition: 'center',
      rotateDeg: 45,
      hoverCss: 'opacity: 0.5',
    })
    writeImageProperties(img, draft)
    const read = readImageProperties(img)
    expect(read.sizeMode).toBe('lock')
    expect(read.width).toEqual({ value: 160, unit: 'px' })
    expect(read.height).toEqual({ value: 80, unit: 'px' })
    expect(read.align).toBe('left')
    expect(read.objectFit).toBe('contain')
    expect(read.objectPosition).toBe('center')
    expect(read.rotateDeg).toBe(45)
    expect(read.hoverCss).toBe('opacity: 0.5')
  })
})

describe('applyImagePropertiesInDocument', () => {
  it('applies to the selected image', () => {
    const el = mountVisual('<p><img src="https://example.com/a.png" alt="Chart"></p>')
    const img = el.querySelector('img') as HTMLImageElement
    expect(selectImageInDocument(el, img)).toBe(true)
    expect(
      applyImagePropertiesInDocument(
        el,
        defaultImagePropertiesApply({
          sizeMode: 'width',
          width: { value: 50, unit: '%' },
        }),
      ),
    ).toBe(true)
    expect(img.style.width).toBe('50%')
    expect(queryImageAtSelection(el)?.width).toEqual({ value: 50, unit: '%' })
  })

  it('returns false when no image is selected', () => {
    const el = mountVisual('<p>Hello</p>')
    expect(applyImagePropertiesInDocument(el, defaultImagePropertiesApply())).toBe(false)
  })
})
