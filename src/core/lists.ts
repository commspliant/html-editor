import {
  clearEmptyStyle,
  collectSelectedBlocks,
  ensureSelectedBlocks,
  groupConsecutiveSiblings,
  isListContainer,
  isListItem,
  parentList,
  renameElement,
  tagName,
  withRestoredSelection,
} from './blocks'

export type ListType = 'ul' | 'ol'

export type ListQuery = {
  type: ListType | null
  mixed: boolean
}

function listTypeOf(block: HTMLElement): ListType | null {
  if (!isListItem(block)) return null
  const list = parentList(block)
  if (!list) return null
  const tag = tagName(list)
  return tag === 'ul' || tag === 'ol' ? tag : null
}

export function queryList(root: HTMLElement): ListQuery {
  const blocks = collectSelectedBlocks(root)
  if (blocks.length === 0) return { type: null, mixed: false }
  const types = blocks.map(listTypeOf)
  const first = types[0]
  if (types.every((type) => type === first)) {
    return { type: first, mixed: false }
  }
  return { type: null, mixed: true }
}

function moveNestedListsAfter(from: HTMLElement, target: Node, before: Node | null): void {
  const nested = [...from.children].filter((child) => isListContainer(child))
  for (const list of nested) {
    target.insertBefore(list, before)
  }
}

export function unwrapListItemToParagraph(li: HTMLElement): HTMLElement {
  const list = parentList(li)
  const p = document.createElement('p')
  for (const attr of [...li.attributes]) {
    p.setAttribute(attr.name, attr.value)
  }
  p.style.marginLeft = ''
  clearEmptyStyle(p)

  while (li.firstChild) {
    if (isListContainer(li.firstChild)) break
    p.appendChild(li.firstChild)
  }

  const following: Element[] = []
  let sibling = li.nextElementSibling
  while (sibling) {
    following.push(sibling)
    sibling = sibling.nextElementSibling
  }

  const listParent = list?.parentNode ?? li.parentNode
  if (!list || !listParent) {
    li.replaceWith(p)
    return p
  }

  const insertParent = isListItem(listParent) ? listParent.parentNode ?? listParent : listParent
  const insertBefore = isListItem(listParent) ? listParent.nextSibling : list.nextSibling

  li.remove()

  let nextList: HTMLElement | null = null
  if (following.length > 0) {
    nextList = document.createElement(list.tagName)
    for (const item of following) nextList.appendChild(item)
  }

  insertParent.insertBefore(p, insertBefore)
  if (nextList) insertParent.insertBefore(nextList, p.nextSibling)
  moveNestedListsAfter(li, insertParent, p.nextSibling)

  if (list.childElementCount === 0) list.remove()
  return p
}

function toListItem(block: HTMLElement): HTMLElement {
  if (isListItem(block)) return block
  const li = renameElement(block, 'li')
  li.style.marginLeft = ''
  clearEmptyStyle(li)
  return li
}

function wrapRunAsList(run: HTMLElement[], type: ListType): boolean {
  if (run.length === 0) return false

  if (run.every(isListItem)) {
    const list = parentList(run[0])
    if (list && run.every((item) => item.parentElement === list)) {
      const allSelected = [...list.children].every(
        (child) => child instanceof HTMLElement && run.includes(child),
      )
      if (allSelected) {
        if (tagName(list) === type) return false
        renameElement(list, type)
        return true
      }
    }
  }

  const first = run[0]
  const parent = first.parentNode
  if (!parent) return false
  const list = document.createElement(type)
  parent.insertBefore(list, first)
  for (const block of run) {
    const oldList = isListItem(block) ? parentList(block) : null
    list.appendChild(toListItem(block))
    if (oldList && oldList !== list && oldList.childElementCount === 0) oldList.remove()
  }
  return true
}

function unwrapSelectedListItems(blocks: HTMLElement[]): boolean {
  let changed = false
  for (const block of [...blocks].reverse()) {
    if (isListItem(block)) {
      unwrapListItemToParagraph(block)
      changed = true
    }
  }
  return changed
}

export function toggleListInDocument(root: HTMLElement, type: ListType): boolean {
  return withRestoredSelection(root, () => {
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false

    const allInTarget = blocks.every((block) => listTypeOf(block) === type)
    if (allInTarget) return unwrapSelectedListItems(blocks)

    let changed = false
    for (const run of groupConsecutiveSiblings(blocks)) {
      if (wrapRunAsList(run, type)) changed = true
    }
    return changed
  })
}

export function setListInDocument(root: HTMLElement, type: ListType | null): boolean {
  return withRestoredSelection(root, () => {
    const blocks = ensureSelectedBlocks(root)
    if (blocks.length === 0) return false

    if (type === null) return unwrapSelectedListItems(blocks)

    const allInTarget = blocks.every((block) => listTypeOf(block) === type)
    if (allInTarget) return false

    let changed = false
    for (const run of groupConsecutiveSiblings(blocks)) {
      if (wrapRunAsList(run, type)) changed = true
    }
    return changed
  })
}

export function isBulletListInDocument(root: HTMLElement): boolean {
  const query = queryList(root)
  return !query.mixed && query.type === 'ul'
}

export function isNumberedListInDocument(root: HTMLElement): boolean {
  const query = queryList(root)
  return !query.mixed && query.type === 'ol'
}
