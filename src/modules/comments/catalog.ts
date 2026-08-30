import { CommentIcon, CommentsVisibleIcon } from '../../icons'
import type { ToolbarCatalog } from '../../toolbar/types'

export const commentsCatalog: ToolbarCatalog = {
  menus: {},
  groups: {},
  items: {
    addComment: {
      id: 'addComment',
      command: 'addComment',
      icon: CommentIcon,
      labelKey: 'commandAddComment',
      ariaKey: 'commandAddCommentAria',
      enabled: 'canAddComment',
    },
    insertComment: {
      id: 'insertComment',
      command: 'addComment',
      icon: CommentIcon,
      labelKey: 'commandInsertComment',
      ariaKey: 'commandInsertCommentAria',
      enabled: 'canAddComment',
    },
    toggleCommentsVisible: {
      id: 'toggleCommentsVisible',
      command: 'toggleCommentsVisible',
      icon: CommentsVisibleIcon,
      labelKey: 'showComments',
      ariaKey: 'toggleCommentsVisibleAria',
      toggle: true,
      active: 'areCommentsVisible',
    },
  },
}

export const COMMENT_CHROME_ITEM_IDS = ['addComment', 'insertComment', 'toggleCommentsVisible'] as const
