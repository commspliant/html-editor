import type { PageMarginSidesPx } from '../core/pageCanvasLayout'
import {
  applyParagraphIndentInDocument,
  type ApplyParagraphIndentOptions,
} from '../core/paragraphIndent'
import type { RulerUnit } from '../core/rulerUnits'

export type RulerIndentSides = Pick<
  ApplyParagraphIndentOptions,
  'firstLineIndentPx' | 'leftIndentPx' | 'rightIndentPx'
>

type MarginDragCommitResult = {
  pageHtml: string
}

export function createRulerMarginPreviewHandler(
  getSurface: () => HTMLElement | null,
  getPageHtml: () => string,
  preview: (surface: HTMLElement, pageHtml: string, sides: PageMarginSidesPx) => void,
): (sides: PageMarginSidesPx) => void {
  return (sides) => {
    const surface = getSurface()
    if (!surface) return
    preview(surface, getPageHtml(), sides)
  }
}

export function createRulerMarginChangeHandler(
  getSurface: () => HTMLElement | null,
  getPageHtml: () => string,
  commit: (
    surface: HTMLElement,
    pageHtml: string,
    sides: PageMarginSidesPx,
  ) => MarginDragCommitResult,
  onCommitted: (pageHtml: string) => void,
): (sides: PageMarginSidesPx) => void {
  return (sides) => {
    const surface = getSurface()
    if (!surface) return
    const result = commit(surface, getPageHtml(), sides)
    onCommitted(result.pageHtml)
  }
}

export function createMultiPageRulerMarginPreviewHandler(
  getSurface: (pageIndex: number) => HTMLElement | null,
  getPageHtml: (pageIndex: number) => string,
  preview: (surface: HTMLElement, pageHtml: string, sides: PageMarginSidesPx) => void,
): (pageIndex: number, sides: PageMarginSidesPx) => void {
  return (pageIndex, sides) => {
    const surface = getSurface(pageIndex)
    if (!surface) return
    preview(surface, getPageHtml(pageIndex), sides)
  }
}

export function createMultiPageRulerMarginChangeHandler(
  getSurface: (pageIndex: number) => HTMLElement | null,
  getPageHtml: (pageIndex: number) => string,
  commit: (
    surface: HTMLElement,
    pageHtml: string,
    sides: PageMarginSidesPx,
  ) => MarginDragCommitResult,
  onCommitted: (pageIndex: number, pageHtml: string) => void,
): (pageIndex: number, sides: PageMarginSidesPx) => void {
  return (pageIndex, sides) => {
    const surface = getSurface(pageIndex)
    if (!surface) return
    const result = commit(surface, getPageHtml(pageIndex), sides)
    onCommitted(pageIndex, result.pageHtml)
  }
}

export function createRulerIndentChangeHandler(
  getSurface: () => HTMLElement | null,
  rulerUnit: RulerUnit,
  onApplied: (surface: HTMLElement) => void,
): (indents: RulerIndentSides) => void {
  return (indents) => {
    const surface = getSurface()
    if (!surface) return
    if (
      applyParagraphIndentInDocument(surface, {
        ...indents,
        unit: rulerUnit,
      })
    ) {
      onApplied(surface)
    }
  }
}
