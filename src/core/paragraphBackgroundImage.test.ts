import { afterEach, describe, expect, it } from 'vitest'
import {
  applyParagraphBackgroundImageInDocument,
  queryParagraphBackgroundImage,
} from './paragraphBackgroundImage'
import { emptyPageBackgroundImageApply } from './pageBackgroundImage'

function mountVisual(html: string) {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function selectOffsets(el: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remainingStart = start
  let remainingEnd = end
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.data.length
    if (!startNode && remainingStart <= len) {
      startNode = text
      startOffset = remainingStart
    }
    if (!startNode) remainingStart -= len
    if (!endNode && remainingEnd <= len) {
      endNode = text
      endOffset = remainingEnd
      break
    }
    if (!endNode) remainingEnd -= len
  }
  if (!startNode || !endNode) return
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('applyParagraphBackgroundImageInDocument', () => {
  it('writes background-image styles on the selected block', () => {
    const el = mountVisual('<p>Hello</p>')
    selectOffsets(el, 0, 5)
    expect(
      applyParagraphBackgroundImageInDocument(el, {
        src: 'https://example.com/bg.png',
        opacity: 0.7,
        fit: 'cover',
        position: 'center',
        width: null,
        height: null,
      }),
    ).toBe(true)

    const p = el.querySelector('p')
    expect(p?.style.backgroundImage).toContain('example.com/bg.png')
    expect(p?.style.backgroundSize).toBe('cover')
    expect(p?.style.backgroundPosition).toBe('center')
    expect(p?.style.opacity).toBe('0.7')
    expect(p?.style.backgroundRepeat).toBe('no-repeat')
  })

  it('clears background-image styles when src is removed', () => {
    const el = mountVisual(
      '<p style="background-image:url(&quot;https://example.com/bg.png&quot;);background-size:cover;opacity:0.5">Hello</p>',
    )
    selectOffsets(el, 0, 5)
    expect(
      applyParagraphBackgroundImageInDocument(el, emptyPageBackgroundImageApply()),
    ).toBe(true)
    const p = el.querySelector('p')
    expect(p?.style.backgroundImage).toBe('')
    expect(p?.style.backgroundSize).toBe('')
    expect(p?.style.opacity).toBe('')
  })
})

describe('queryParagraphBackgroundImage', () => {
  it('reads background-image from the selected block', () => {
    const el = mountVisual(
      '<p style="background-image:url(&quot;https://example.com/bg.png&quot;);background-size:cover;background-position:top;opacity:0.8">Hello</p>',
    )
    selectOffsets(el, 0, 5)
    expect(queryParagraphBackgroundImage(el)).toEqual({
      src: 'https://example.com/bg.png',
      opacity: 0.8,
      fit: 'cover',
      position: 'top',
      width: null,
      height: null,
    })
  })

  it('returns empty when blocks differ', () => {
    const el = mountVisual(
      '<p style="background-image:url(&quot;https://example.com/a.png&quot;)">One</p><p style="background-image:url(&quot;https://example.com/b.png&quot;)">Two</p>',
    )
    selectOffsets(el, 0, 6)
    expect(queryParagraphBackgroundImage(el)).toEqual(emptyPageBackgroundImageApply())
  })

  it('returns empty when no block is selected', () => {
    const el = mountVisual('<p>Hello</p>')
    expect(queryParagraphBackgroundImage(el)).toEqual(emptyPageBackgroundImageApply())
  })
})
