import type { FontPropertiesApply } from './commandTypes'
import { queryCustomCssAtSelection, setCustomCssInDocument } from './customCss'
import { queryInheritedFontFamily, setFontFamilyInDocument } from './fontFamily'
import { queryInheritedFontSize, setFontSizeInDocument } from './fontSize'
import { queryInheritedInlineColor, setInlineColorInDocument } from './inlineColor'
import { FONT_MARKS, queryInheritedFontMarks, toggleFontMarkInDocument } from './marks'
import type { SelectionSnapshot } from './selection'

export type CopiedFormat = FontPropertiesApply & {
  customCss: string | null
  customCssMixed: boolean
}

export function selectionRangesEqual(a: SelectionSnapshot, b: SelectionSnapshot): boolean {
  return a.start === b.start && a.end === b.end && a.collapsed === b.collapsed
}

export function snapshotFormatFromRoot(root: HTMLElement): CopiedFormat {
  const marks = queryInheritedFontMarks(root)
  const fontSize = queryInheritedFontSize(root)
  const fontFamily = queryInheritedFontFamily(root)
  const fontColor = queryInheritedInlineColor(root, 'color')
  const highlightColor = queryInheritedInlineColor(root, 'backgroundColor')
  const customCss = queryCustomCssAtSelection(root)

  return {
    size: fontSize.mixed ? null : fontSize.value,
    unit: fontSize.unit,
    marks,
    fontFamily: fontFamily.mixed ? null : fontFamily.value,
    fontFamilyMixed: fontFamily.mixed,
    fontColor: fontColor.mixed ? null : fontColor.value,
    fontColorMixed: fontColor.mixed,
    highlightColor: highlightColor.mixed ? null : highlightColor.value,
    highlightColorMixed: highlightColor.mixed,
    customCss: customCss.mixed ? null : customCss.value,
    customCssMixed: customCss.mixed,
  }
}

export function applyCopiedFormat(root: HTMLElement, format: CopiedFormat): boolean {
  if (format.size !== null) {
    setFontSizeInDocument(root, format.size, format.unit)
  }
  const currentMarks = queryInheritedFontMarks(root)
  for (const mark of FONT_MARKS) {
    if (format.marks[mark] !== currentMarks[mark]) {
      toggleFontMarkInDocument(root, mark)
    }
  }
  if (!format.fontFamilyMixed) {
    setFontFamilyInDocument(root, format.fontFamily)
  }
  if (!format.fontColorMixed) {
    setInlineColorInDocument(root, 'color', format.fontColor)
  }
  if (!format.highlightColorMixed) {
    setInlineColorInDocument(root, 'backgroundColor', format.highlightColor)
  }
  if (!format.customCssMixed && format.customCss) {
    setCustomCssInDocument(root, format.customCss)
  }
  return true
}
