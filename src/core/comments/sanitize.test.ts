import { describe, expect, it } from 'vitest'
import { stripCommentAnchors } from './sanitize'

describe('stripCommentAnchors', () => {
  it('removes comment-only spans per spec example', () => {
    const html =
      '<p>Price was <span data-comment-thread="cmt_1">£150</span> last week.</p>'
    expect(stripCommentAnchors(html)).toBe('<p>Price was £150 last week.</p>')
  })

  it('preserves styled spans', () => {
    const html =
      '<p><span style="color: red" data-comment-thread="cmt_1">Hello</span></p>'
    expect(stripCommentAnchors(html)).toBe('<p><span style="color: red">Hello</span></p>')
  })

  it('removes thread attribute from images without removing the image', () => {
    const html = '<p><img src="photo.jpg" data-comment-thread="cmt_1" alt=""></p>'
    expect(stripCommentAnchors(html)).toBe('<p><img src="photo.jpg" alt=""></p>')
  })

  it('unwraps nested comment-only spans', () => {
    const html =
      '<p><span data-comment-thread="cmt_1"><span data-comment-thread="cmt_2">Text</span></span></p>'
    expect(stripCommentAnchors(html)).toBe('<p>Text</p>')
  })
})
