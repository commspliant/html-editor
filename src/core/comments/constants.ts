export const COMMENT_THREAD_ATTR = 'data-comment-thread'
export const COMMENT_ANCHOR_CLASS = 'wysiwyg-comment-anchor'

export function createCommentThreadId(): string {
  return `cmt_${crypto.randomUUID()}`
}

export function createCommentMessageId(): string {
  return crypto.randomUUID()
}
