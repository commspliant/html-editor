import type { CustomParagraphStyleParagraph } from '../types'
import {
  applyParagraphBoxInDocument,
  emptyParagraphBoxApply,
  type ParagraphBoxApply,
  queryParagraphBox,
} from './paragraphBox'
import { queryList, setListInDocument, type ListType } from './lists'
import { queryTextAlign, setTextAlignInDocument, type TextAlign } from './textAlign'

export type ParagraphPropertiesApply = ParagraphBoxApply & {
  align: TextAlign | null
  alignMixed: boolean
  list: ListType | null
  listMixed: boolean
}

export function emptyParagraphPropertiesApply(): ParagraphPropertiesApply {
  return {
    ...emptyParagraphBoxApply(),
    align: 'left',
    alignMixed: false,
    list: null,
    listMixed: false,
  }
}

export function queryParagraphProperties(root: HTMLElement): ParagraphPropertiesApply {
  const box = queryParagraphBox(root)
  const align = queryTextAlign(root)
  const list = queryList(root)
  return {
    ...box,
    align: align.align,
    alignMixed: align.mixed,
    list: list.type,
    listMixed: list.mixed,
  }
}

export function applyParagraphPropertiesInDocument(
  root: HTMLElement,
  draft: ParagraphPropertiesApply,
): boolean {
  let changed = false
  if (!draft.alignMixed && draft.align) {
    if (setTextAlignInDocument(root, draft.align)) changed = true
  }
  if (!draft.listMixed) {
    if (setListInDocument(root, draft.list)) changed = true
  }
  if (applyParagraphBoxInDocument(root, draft)) changed = true
  return changed
}

export function applyCustomParagraphInDocument(
  root: HTMLElement,
  paragraph: CustomParagraphStyleParagraph,
): boolean {
  return applyParagraphPropertiesInDocument(root, styleToParagraphApply(paragraph))
}

export function paragraphApplyToStyle(
  draft: ParagraphPropertiesApply,
): CustomParagraphStyleParagraph {
  return {
    align: draft.alignMixed ? undefined : (draft.align ?? 'left'),
    list: draft.listMixed ? undefined : draft.list,
    margin: draft.marginMixed ? undefined : draft.margin,
    padding: draft.paddingMixed ? undefined : draft.padding,
    lineHeight: draft.lineHeightMixed ? undefined : draft.lineHeight,
    border: draft.borderMixed ? undefined : draft.border,
    borderRadius: draft.radiusMixed ? undefined : draft.borderRadius,
    boxShadow: draft.shadowMixed ? undefined : draft.boxShadow,
    backgroundColor: draft.backgroundMixed ? undefined : draft.backgroundColor,
    opacity: draft.opacityMixed ? undefined : draft.opacity,
    breakInside: draft.breakInsideMixed ? undefined : draft.breakInside,
    breakAfter: draft.breakAfterMixed ? undefined : draft.breakAfter,
    breakBefore: draft.breakBeforeMixed ? undefined : draft.breakBefore,
  }
}

export function styleToParagraphApply(
  paragraph?: CustomParagraphStyleParagraph,
): ParagraphPropertiesApply {
  const empty = emptyParagraphPropertiesApply()
  if (!paragraph) {
    return {
      ...empty,
      alignMixed: true,
      listMixed: true,
      marginMixed: true,
      paddingMixed: true,
      lineHeightMixed: true,
      borderMixed: true,
      radiusMixed: true,
      shadowMixed: true,
      backgroundMixed: true,
      opacityMixed: true,
      breakInsideMixed: true,
      breakAfterMixed: true,
      breakBeforeMixed: true,
    }
  }
  return {
    align: paragraph.align ?? empty.align,
    alignMixed: paragraph.align === undefined,
    list: paragraph.list === undefined ? empty.list : paragraph.list,
    listMixed: paragraph.list === undefined,
    margin: paragraph.margin ?? empty.margin,
    marginMixed: paragraph.margin === undefined,
    padding: paragraph.padding ?? empty.padding,
    paddingMixed: paragraph.padding === undefined,
    lineHeight: paragraph.lineHeight === undefined ? empty.lineHeight : paragraph.lineHeight,
    lineHeightMixed: paragraph.lineHeight === undefined,
    border: paragraph.border ?? empty.border,
    borderMixed: paragraph.border === undefined,
    borderRadius:
      paragraph.borderRadius === undefined ? empty.borderRadius : paragraph.borderRadius,
    radiusMixed: paragraph.borderRadius === undefined,
    boxShadow: paragraph.boxShadow === undefined ? empty.boxShadow : paragraph.boxShadow,
    shadowMixed: paragraph.boxShadow === undefined,
    backgroundColor:
      paragraph.backgroundColor === undefined ? empty.backgroundColor : paragraph.backgroundColor,
    backgroundMixed: paragraph.backgroundColor === undefined,
    opacity: paragraph.opacity === undefined ? empty.opacity : paragraph.opacity,
    opacityMixed: paragraph.opacity === undefined,
    breakInside:
      paragraph.breakInside === undefined ? empty.breakInside : paragraph.breakInside,
    breakInsideMixed: paragraph.breakInside === undefined,
    breakAfter: paragraph.breakAfter === undefined ? empty.breakAfter : paragraph.breakAfter,
    breakAfterMixed: paragraph.breakAfter === undefined,
    breakBefore:
      paragraph.breakBefore === undefined ? empty.breakBefore : paragraph.breakBefore,
    breakBeforeMixed: paragraph.breakBefore === undefined,
  }
}
