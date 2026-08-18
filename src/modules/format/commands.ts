import type {
  CommandContext,
  EditorCommands,
  EditorQueries,
  FontDialogTab,
  PageDialogTab,
  ParagraphDialogTab,
} from '../../core/commandTypes'

export function createFormatCommands(
  ctx: CommandContext,
): Pick<
  EditorCommands,
  | 'toggleBold'
  | 'toggleItalic'
  | 'toggleUnderline'
  | 'toggleStrikethrough'
  | 'clearFormatting'
  | 'toggleFormatBrush'
  | 'setFontSize'
  | 'setFontSizeUnit'
  | 'setFontFamily'
  | 'setFontColor'
  | 'setHighlightColor'
  | 'setParagraphStyle'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'indent'
  | 'outdent'
  | 'toggleBulletList'
  | 'toggleNumberedList'
  | 'openFontProperties'
  | 'applyFontProperties'
  | 'openParagraphProperties'
  | 'applyParagraphProperties'
  | 'openPageProperties'
  | 'applyPageProperties'
  | 'openCustomParagraphStyleDialog'
  | 'applyCustomParagraphStyle'
  | 'openCustomCss'
  | 'applyCustomCss'
> {
  return {
    toggleBold: () => {
      ctx.toggleFontMark('bold')
    },
    toggleItalic: () => {
      ctx.toggleFontMark('italic')
    },
    toggleUnderline: () => {
      ctx.toggleFontMark('underline')
    },
    toggleStrikethrough: () => {
      ctx.toggleFontMark('strikethrough')
    },
    clearFormatting: () => {
      ctx.clearFormatting()
    },
    toggleFormatBrush: () => {
      ctx.toggleFormatBrush()
    },
    setFontSize: (size, unit) => {
      ctx.setFontSize(size, unit)
    },
    setFontSizeUnit: (unit) => {
      ctx.setFontSizeUnit(unit)
    },
    setFontFamily: (family) => {
      ctx.setFontFamily(family)
    },
    setFontColor: (color) => {
      ctx.setFontColor(color)
    },
    setHighlightColor: (color) => {
      ctx.setHighlightColor(color)
    },
    setParagraphStyle: (tag) => {
      ctx.setParagraphStyle(tag)
    },
    alignLeft: () => {
      ctx.setTextAlign('left')
    },
    alignCenter: () => {
      ctx.setTextAlign('center')
    },
    alignRight: () => {
      ctx.setTextAlign('right')
    },
    alignJustify: () => {
      ctx.setTextAlign('justify')
    },
    indent: () => {
      ctx.indent()
    },
    outdent: () => {
      ctx.outdent()
    },
    toggleBulletList: () => {
      ctx.toggleList('ul')
    },
    toggleNumberedList: () => {
      ctx.toggleList('ol')
    },
    openFontProperties: (tab?: FontDialogTab) => {
      ctx.openFontProperties(tab ?? 'general')
    },
    applyFontProperties: (draft) => {
      ctx.applyFontProperties(draft)
    },
    openParagraphProperties: (tab?: ParagraphDialogTab) => {
      ctx.openParagraphProperties(tab ?? 'general')
    },
    applyParagraphProperties: (draft) => {
      ctx.applyParagraphProperties(draft)
    },
    openPageProperties: (tab?: PageDialogTab) => {
      ctx.openPageProperties(tab ?? 'font')
    },
    applyPageProperties: (draft) => {
      ctx.applyPageProperties(draft)
    },
    openCustomParagraphStyleDialog: (id) => {
      ctx.openCustomParagraphStyleDialog(id)
    },
    applyCustomParagraphStyle: (id) => {
      ctx.applyCustomParagraphStyle(id)
    },
    openCustomCss: () => {
      ctx.openCustomCss()
    },
    applyCustomCss: (css) => {
      ctx.applyCustomCss(css)
    },
  }
}

export function createFormatQueries(
  ctx: CommandContext,
): Pick<
  EditorQueries,
  | 'isBold'
  | 'isItalic'
  | 'isUnderline'
  | 'isStrikethrough'
  | 'getFontSize'
  | 'getFontSizeUnit'
  | 'isFontSizeMixed'
  | 'getFontFamily'
  | 'isFontFamilyMixed'
  | 'getFontFaces'
  | 'getFontColor'
  | 'isFontColorMixed'
  | 'getHighlightColor'
  | 'isHighlightColorMixed'
  | 'getParagraphStyle'
  | 'isParagraphStyleMixed'
  | 'isAlignLeft'
  | 'isAlignCenter'
  | 'isAlignRight'
  | 'isAlignJustify'
  | 'canOutdent'
  | 'isBulletList'
  | 'isNumberedList'
  | 'hasTextSelection'
  | 'isFormatBrushActive'
  | 'getCustomParagraphStyles'
  | 'isCustomParagraphStylesLoading'
> {
  return {
    isBold: () => ctx.isFontMarkActive('bold'),
    isItalic: () => ctx.isFontMarkActive('italic'),
    isUnderline: () => ctx.isFontMarkActive('underline'),
    isStrikethrough: () => ctx.isFontMarkActive('strikethrough'),
    getFontSize: () => ctx.getFontSize(),
    getFontSizeUnit: () => ctx.getFontSizeUnit(),
    isFontSizeMixed: () => ctx.isFontSizeMixed(),
    getFontFamily: () => ctx.getFontFamily(),
    isFontFamilyMixed: () => ctx.isFontFamilyMixed(),
    getFontFaces: () => ctx.getFontFaces(),
    getFontColor: () => ctx.getFontColor(),
    isFontColorMixed: () => ctx.isFontColorMixed(),
    getHighlightColor: () => ctx.getHighlightColor(),
    isHighlightColorMixed: () => ctx.isHighlightColorMixed(),
    getParagraphStyle: () => ctx.getParagraphStyle(),
    isParagraphStyleMixed: () => ctx.isParagraphStyleMixed(),
    isAlignLeft: () => ctx.getTextAlign() === 'left' && !ctx.isTextAlignMixed(),
    isAlignCenter: () => ctx.getTextAlign() === 'center' && !ctx.isTextAlignMixed(),
    isAlignRight: () => ctx.getTextAlign() === 'right' && !ctx.isTextAlignMixed(),
    isAlignJustify: () => ctx.getTextAlign() === 'justify' && !ctx.isTextAlignMixed(),
    canOutdent: () => ctx.canOutdent(),
    isBulletList: () => ctx.isBulletList(),
    isNumberedList: () => ctx.isNumberedList(),
    hasTextSelection: () => ctx.hasTextSelection(),
    isFormatBrushActive: () => ctx.isFormatBrushActive(),
    customParagraphStylesEnabled: () => ctx.customParagraphStylesEnabled(),
    getCustomParagraphStyles: () => ctx.getCustomParagraphStyles(),
    isCustomParagraphStylesLoading: () => ctx.isCustomParagraphStylesLoading(),
  }
}
