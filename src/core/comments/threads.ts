import type { CommentAuthor, CommentMessage, CommentThread } from '../../types'
import { createCommentMessageId, createCommentThreadId } from './constants'

export function createCommentThread(
  anchor: CommentThread['anchor'],
  messages: CommentMessage[] = [],
): CommentThread {
  return {
    id: createCommentThreadId(),
    anchor,
    messages,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  }
}

export function createCommentMessage(author: CommentAuthor, message: string): CommentMessage {
  return {
    id: createCommentMessageId(),
    userId: author.userId,
    userName: author.userName,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  }
}

export function addMessageToThread(
  threads: readonly CommentThread[],
  threadId: string,
  message: CommentMessage,
): CommentThread[] {
  return threads.map((thread) =>
    thread.id === threadId ? { ...thread, messages: [...thread.messages, message] } : thread,
  )
}

export function findCommentThread(
  threads: readonly CommentThread[],
  threadId: string,
): CommentThread | undefined {
  return threads.find((thread) => thread.id === threadId)
}
