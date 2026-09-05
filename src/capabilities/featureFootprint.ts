export type FeatureFootprint = {
  tags?: string[]
  cssProperties?: string[]
  attributes?: { tag: string; names: string[] }[]
  dialogTabs?: { dialog: 'paragraph' | 'page'; tabs: string[] }[]
}

export const EDITOR_FEATURE_FOOTPRINTS: Record<string, FeatureFootprint> = {
  audio: { tags: ['audio'] },
  youtube: { tags: ['video', 'iframe'] },
  horizontalRule: { tags: ['hr'] },
  bookmark: { tags: ['a'], attributes: [{ tag: 'a', names: ['name', 'id'] }] },
  bulletList: { tags: ['ul', 'ol', 'li'] },
  numberedList: { tags: ['ul', 'ol', 'li'] },
  customCss: { cssProperties: ['*'] },
  formatBrush: { cssProperties: ['*'] },
  pageBackgroundImage: {
    cssProperties: ['background-image'],
    dialogTabs: [{ dialog: 'page', tabs: ['backgroundImage'] }],
  },
  paragraphBackgroundImage: {
    cssProperties: ['background-image'],
    dialogTabs: [{ dialog: 'paragraph', tabs: ['backgroundImage'] }],
  },
  pageBreak: { tags: ['div'], cssProperties: ['page-break-after', 'break-after'] },
  indent: { cssProperties: ['margin-left', 'margin-right', 'margin'] },
  outdent: { cssProperties: ['margin-left', 'margin-right', 'margin'] },
  paragraphStyle: { tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] },
  fontFamily: { cssProperties: ['font-family'] },
  openCustomParagraphStyleDialog: { tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'] },
  paragraphProperties: {
    dialogTabs: [
      { dialog: 'paragraph', tabs: ['spacing', 'border', 'background', 'backgroundImage'] },
    ],
  },
  pageProperties: {
    dialogTabs: [
      { dialog: 'page', tabs: ['spacing', 'border', 'background', 'backgroundImage'] },
    ],
  },
  openPageBackgroundImage: { cssProperties: ['background-image'] },
  openParagraphBackgroundImage: { cssProperties: ['background-image'] },
  openParagraphProperties: {
    dialogTabs: [
      { dialog: 'paragraph', tabs: ['spacing', 'border', 'background', 'backgroundImage'] },
    ],
  },
  openPageProperties: {
    dialogTabs: [
      { dialog: 'page', tabs: ['spacing', 'border', 'background', 'backgroundImage'] },
    ],
  },
}

export const DIALOG_TAB_FOOTPRINTS: Record<
  'paragraph' | 'page',
  Record<string, FeatureFootprint>
> = {
  paragraph: {
    general: { cssProperties: ['font-family', 'font-size', 'color'] },
    spacing: { cssProperties: ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding'] },
    border: { cssProperties: ['border', 'border-width', 'border-style', 'border-color'] },
    background: { cssProperties: ['background-color'] },
    backgroundImage: { cssProperties: ['background-image'] },
  },
  page: {
    font: { cssProperties: ['font-family', 'font-size', 'color'] },
    paragraph: { cssProperties: ['margin', 'padding'] },
    print: { cssProperties: ['page-break-after', 'break-after'] },
    spacing: { cssProperties: ['margin', 'padding'] },
    border: { cssProperties: ['border'] },
    background: { cssProperties: ['background-color'] },
    backgroundImage: { cssProperties: ['background-image'] },
  },
}

export const CONTEXT_MENU_COMMAND_FOOTPRINTS: Record<string, FeatureFootprint> = {
  openPageBackgroundImage: EDITOR_FEATURE_FOOTPRINTS.openPageBackgroundImage,
  openPageProperties: EDITOR_FEATURE_FOOTPRINTS.openPageProperties,
  openParagraphProperties: EDITOR_FEATURE_FOOTPRINTS.openParagraphProperties,
}
