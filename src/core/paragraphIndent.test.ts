import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyParagraphIndentInDocument,
  queryParagraphIndent,
} from './paragraphIndent'

describe('paragraphIndent', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('queries empty indent when no block is selected', () => {
    const res = queryParagraphIndent(container)
    expect(res.firstLineIndentPx).toBe(0)
    expect(res.leftIndentPx).toBe(0)
    expect(res.rightIndentPx).toBe(0)
  })

  it('queries indent from a styled paragraph', () => {
    const p = document.createElement('p')
    p.style.textIndent = '0.5in'
    p.style.marginLeft = '1in'
    p.style.marginRight = '0.75in'
    p.textContent = 'Sample paragraph'
    container.appendChild(p)

    // Select the paragraph
    const range = document.createRange()
    range.selectNodeContents(p)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const res = queryParagraphIndent(container)
    expect(res.firstLineIndentPx).toBe(48) // 0.5in = 48px
    expect(res.leftIndentPx).toBe(96) // 1in = 96px
    expect(res.rightIndentPx).toBe(72) // 0.75in = 72px
  })

  it('applies first line indent and left indent', () => {
    const p = document.createElement('p')
    p.textContent = 'Hello world'
    container.appendChild(p)

    const range = document.createRange()
    range.selectNodeContents(p)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const changed = applyParagraphIndentInDocument(container, {
      firstLineIndentPx: 48,
      leftIndentPx: 96,
      unit: 'in',
    })

    expect(changed).toBe(true)
    expect(p.style.textIndent).toBe('0.5in')
    expect(p.style.marginLeft).toBe('1in')
  })

  it('applies negative first line indent for hanging indent', () => {
    const p = document.createElement('p')
    p.textContent = 'Hello world'
    container.appendChild(p)

    const range = document.createRange()
    range.selectNodeContents(p)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const changed = applyParagraphIndentInDocument(container, {
      firstLineIndentPx: -48,
      leftIndentPx: 96,
      unit: 'in',
    })

    expect(changed).toBe(true)
    expect(p.style.textIndent).toBe('-0.5in')
    expect(p.style.marginLeft).toBe('1in')
  })
})
