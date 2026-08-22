import type { Meta, StoryObj } from '@storybook/react'
import { mergeFontFaces } from '../core/fontFamily'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { defaultToolbarCatalog } from './defaultCatalog'
import { defaultToolbarLayout } from './defaultLayout'
import { EditorToolbar } from './EditorToolbar'

const meta = {
  title: 'Toolbar',
  component: EditorToolbar,
  args: {
    catalog: defaultToolbarCatalog,
    layout: defaultToolbarLayout,
    commands: {
      save: async () => undefined,
      open: async () => undefined,
      print: () => undefined,
      undo: () => undefined,
      redo: () => undefined,
      setVisualMode: () => undefined,
      setHtmlMode: () => undefined,
      toggleFullscreen: () => undefined,
      openCustomizeToolbar: () => undefined,
      openDocumentPreview: () => undefined,
      toggleReadAloud: () => undefined,
      setLightMode: () => undefined,
      setDarkMode: () => undefined,
      setToolbarPositionTop: () => undefined,
      setToolbarPositionLeft: () => undefined,
      setToolbarPositionRight: () => undefined,
      setToolbarPositionBottom: () => undefined,
      toggleBold: () => undefined,
      toggleItalic: () => undefined,
      toggleUnderline: () => undefined,
      toggleStrikethrough: () => undefined,
      setFontSize: () => undefined,
      setFontSizeUnit: () => undefined,
      setFontFamily: () => undefined,
      setFontColor: () => undefined,
      setHighlightColor: () => undefined,
      setParagraphStyle: () => undefined,
      alignLeft: () => undefined,
      alignCenter: () => undefined,
      alignRight: () => undefined,
      alignJustify: () => undefined,
      indent: () => undefined,
      outdent: () => undefined,
      toggleBulletList: () => undefined,
      toggleNumberedList: () => undefined,
      openFontProperties: () => undefined,
      applyFontProperties: () => undefined,
      openCustomCss: () => undefined,
      applyCustomCss: () => undefined,
      openParagraphProperties: () => undefined,
      applyParagraphProperties: () => undefined,
      openPageProperties: () => undefined,
      applyPageProperties: () => undefined,
      openCustomParagraphStyleDialog: () => undefined,
      applyCustomParagraphStyle: () => undefined,
      openLinkDialog: () => undefined,
      applyLink: () => undefined,
      openBookmarkDialog: () => undefined,
      applyBookmark: () => undefined,
      openImageDialog: () => undefined,
      applyImage: () => undefined,
      openImageProperties: () => undefined,
      applyImageProperties: () => undefined,
      insertHorizontalRule: () => undefined,
      openTableDialog: () => undefined,
      applyTable: () => undefined,
      openTableProperties: () => undefined,
      applyTableProperties: () => undefined,
      openCellProperties: () => undefined,
      applyCellProperties: () => undefined,
      openRowProperties: () => undefined,
      applyRowProperties: () => undefined,
      insertRowBelow: () => undefined,
      insertRowBefore: () => undefined,
      deleteRow: () => undefined,
      insertColumnAfter: () => undefined,
      insertColumnBefore: () => undefined,
      deleteColumn: () => undefined,
      mergeCells: () => undefined,
      unmergeCells: () => undefined,
      cut: async () => undefined,
      copy: async () => undefined,
      deleteSelection: () => undefined,
      clearFormatting: () => undefined,
      toggleFormatBrush: () => undefined,
    },
    queries: {
      isVisualMode: () => true,
      isHtmlMode: () => false,
      isFullscreen: () => false,
      isLightMode: () => true,
      isDarkMode: () => false,
      isPageZoomFitWidth: () => true,
      isPageZoomFitPage: () => false,
      isPageZoom50: () => false,
      isPageZoom75: () => false,
      isPageZoom100: () => false,
      isPageZoom125: () => false,
      isPageZoom150: () => false,
      isPageZoom200: () => false,
      isToolbarPositionTop: () => true,
      isToolbarPositionLeft: () => false,
      isToolbarPositionRight: () => false,
      isToolbarPositionBottom: () => false,
      canUndo: () => false,
      canRedo: () => false,
      isBold: () => false,
      isItalic: () => false,
      isUnderline: () => false,
      isStrikethrough: () => false,
      getFontSize: () => 12,
      getFontSizeUnit: () => 'pt',
      isFontSizeMixed: () => false,
      getFontFamily: () => null,
      isFontFamilyMixed: () => false,
      getFontFaces: () => mergeFontFaces(),
      getFontColor: () => null,
      isFontColorMixed: () => false,
      getHighlightColor: () => null,
      isHighlightColorMixed: () => false,
      getParagraphStyle: () => 'p' as const,
      isParagraphStyleMixed: () => false,
      isAlignLeft: () => false,
      isAlignCenter: () => false,
      isAlignRight: () => false,
      isAlignJustify: () => false,
      canOutdent: () => false,
      isBulletList: () => false,
      isNumberedList: () => false,
      customParagraphStylesEnabled: () => false,
      getCustomParagraphStyles: () => [],
      isCustomParagraphStylesLoading: () => false,
      isLink: () => false,
      isImageSelected: () => false,
      isInTable: () => false,
      canMergeCells: () => false,
      canUnmergeCells: () => false,
      hasTextSelection: () => true,
      isReadingAloud: () => false,
      canReadAloud: () => true,
      isFormatBrushActive: () => false,
    },
  },
  decorators: [
    (Story) => (
      <LocaleProvider>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            border: '1px solid #d0d0d0',
            borderRadius: 6,
            fontFamily: 'system-ui, sans-serif',
            fontSize: '1rem',
          }}
        >
          <Story />
        </div>
      </LocaleProvider>
    ),
  ],
} satisfies Meta<typeof EditorToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Spanish: Story = {
  decorators: [
    (Story) => (
      <LocaleProvider locale="es">
        <Story />
      </LocaleProvider>
    ),
  ],
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const IconGroups: Story = {
  args: {
    layout: {
      menus: [{ id: 'file', items: ['save', 'open'] }],
      iconGroups: [
        { id: 'file', items: ['save'] },
        { id: 'file-open', items: ['open'] },
      ],
    },
  },
}

export const HtmlMode: Story = {
  args: {
    queries: {
      isVisualMode: () => false,
      isHtmlMode: () => true,
      isFullscreen: () => false,
      isLightMode: () => true,
      isDarkMode: () => false,
      isPageZoomFitWidth: () => true,
      isPageZoomFitPage: () => false,
      isPageZoom50: () => false,
      isPageZoom75: () => false,
      isPageZoom100: () => false,
      isPageZoom125: () => false,
      isPageZoom150: () => false,
      isPageZoom200: () => false,
      isToolbarPositionTop: () => true,
      isToolbarPositionLeft: () => false,
      isToolbarPositionRight: () => false,
      isToolbarPositionBottom: () => false,
      canUndo: () => false,
      canRedo: () => false,
      isBold: () => false,
      isItalic: () => false,
      isUnderline: () => false,
      isStrikethrough: () => false,
      getFontSize: () => 12,
      getFontSizeUnit: () => 'pt',
      isFontSizeMixed: () => false,
      getFontFamily: () => null,
      isFontFamilyMixed: () => false,
      getFontFaces: () => mergeFontFaces(),
      getFontColor: () => null,
      isFontColorMixed: () => false,
      getHighlightColor: () => null,
      isHighlightColorMixed: () => false,
      getParagraphStyle: () => 'p' as const,
      isParagraphStyleMixed: () => false,
      isAlignLeft: () => false,
      isAlignCenter: () => false,
      isAlignRight: () => false,
      isAlignJustify: () => false,
      canOutdent: () => false,
      isBulletList: () => false,
      isNumberedList: () => false,
      customParagraphStylesEnabled: () => false,
      getCustomParagraphStyles: () => [],
      isCustomParagraphStylesLoading: () => false,
      isLink: () => false,
      isImageSelected: () => false,
      isInTable: () => false,
      canMergeCells: () => false,
      canUnmergeCells: () => false,
      hasTextSelection: () => true,
      isReadingAloud: () => false,
      canReadAloud: () => true,
      isFormatBrushActive: () => false,
    },
  },
}

export const Overflow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '7.5rem' }}>
        <Story />
      </div>
    ),
  ],
}

export const HistoryAvailable: Story = {
  args: {
    queries: {
      isVisualMode: () => true,
      isHtmlMode: () => false,
      isFullscreen: () => false,
      isLightMode: () => true,
      isDarkMode: () => false,
      isPageZoomFitWidth: () => true,
      isPageZoomFitPage: () => false,
      isPageZoom50: () => false,
      isPageZoom75: () => false,
      isPageZoom100: () => false,
      isPageZoom125: () => false,
      isPageZoom150: () => false,
      isPageZoom200: () => false,
      isToolbarPositionTop: () => true,
      isToolbarPositionLeft: () => false,
      isToolbarPositionRight: () => false,
      isToolbarPositionBottom: () => false,
      canUndo: () => true,
      canRedo: () => true,
      isBold: () => false,
      isItalic: () => false,
      isUnderline: () => false,
      isStrikethrough: () => false,
      getFontSize: () => 12,
      getFontSizeUnit: () => 'pt',
      isFontSizeMixed: () => false,
      getFontFamily: () => null,
      isFontFamilyMixed: () => false,
      getFontFaces: () => mergeFontFaces(),
      getFontColor: () => null,
      isFontColorMixed: () => false,
      getHighlightColor: () => null,
      isHighlightColorMixed: () => false,
      getParagraphStyle: () => 'p' as const,
      isParagraphStyleMixed: () => false,
      isAlignLeft: () => false,
      isAlignCenter: () => false,
      isAlignRight: () => false,
      isAlignJustify: () => false,
      canOutdent: () => false,
      isBulletList: () => false,
      isNumberedList: () => false,
      customParagraphStylesEnabled: () => false,
      getCustomParagraphStyles: () => [],
      isCustomParagraphStylesLoading: () => false,
      isLink: () => false,
      isImageSelected: () => false,
      isInTable: () => false,
      canMergeCells: () => false,
      canUnmergeCells: () => false,
      hasTextSelection: () => true,
      isReadingAloud: () => false,
      canReadAloud: () => true,
      isFormatBrushActive: () => false,
    },
  },
}

export const UndoOnly: Story = {
  args: {
    queries: {
      isVisualMode: () => true,
      isHtmlMode: () => false,
      isFullscreen: () => false,
      isLightMode: () => true,
      isDarkMode: () => false,
      isPageZoomFitWidth: () => true,
      isPageZoomFitPage: () => false,
      isPageZoom50: () => false,
      isPageZoom75: () => false,
      isPageZoom100: () => false,
      isPageZoom125: () => false,
      isPageZoom150: () => false,
      isPageZoom200: () => false,
      isToolbarPositionTop: () => true,
      isToolbarPositionLeft: () => false,
      isToolbarPositionRight: () => false,
      isToolbarPositionBottom: () => false,
      canUndo: () => true,
      canRedo: () => false,
      isBold: () => false,
      isItalic: () => false,
      isUnderline: () => false,
      isStrikethrough: () => false,
      getFontSize: () => 12,
      getFontSizeUnit: () => 'pt',
      isFontSizeMixed: () => false,
      getFontFamily: () => null,
      isFontFamilyMixed: () => false,
      getFontFaces: () => mergeFontFaces(),
      getFontColor: () => null,
      isFontColorMixed: () => false,
      getHighlightColor: () => null,
      isHighlightColorMixed: () => false,
      getParagraphStyle: () => 'p' as const,
      isParagraphStyleMixed: () => false,
      isAlignLeft: () => false,
      isAlignCenter: () => false,
      isAlignRight: () => false,
      isAlignJustify: () => false,
      canOutdent: () => false,
      isBulletList: () => false,
      isNumberedList: () => false,
      customParagraphStylesEnabled: () => false,
      getCustomParagraphStyles: () => [],
      isCustomParagraphStylesLoading: () => false,
      isLink: () => false,
      isImageSelected: () => false,
      isInTable: () => false,
      canMergeCells: () => false,
      canUnmergeCells: () => false,
      hasTextSelection: () => true,
      isReadingAloud: () => false,
      canReadAloud: () => true,
      isFormatBrushActive: () => false,
    },
  },
}

export const FontMarksActive: Story = {
  args: {
    queries: {
      isVisualMode: () => true,
      isHtmlMode: () => false,
      isFullscreen: () => false,
      isLightMode: () => true,
      isDarkMode: () => false,
      isPageZoomFitWidth: () => true,
      isPageZoomFitPage: () => false,
      isPageZoom50: () => false,
      isPageZoom75: () => false,
      isPageZoom100: () => false,
      isPageZoom125: () => false,
      isPageZoom150: () => false,
      isPageZoom200: () => false,
      isToolbarPositionTop: () => true,
      isToolbarPositionLeft: () => false,
      isToolbarPositionRight: () => false,
      isToolbarPositionBottom: () => false,
      canUndo: () => false,
      canRedo: () => false,
      isBold: () => true,
      isItalic: () => true,
      isUnderline: () => false,
      isStrikethrough: () => true,
      getFontSize: () => 12,
      getFontSizeUnit: () => 'pt',
      isFontSizeMixed: () => false,
      getFontFamily: () => 'Georgia, serif',
      isFontFamilyMixed: () => false,
      getFontFaces: () => mergeFontFaces(),
      getFontColor: () => '#cc0000',
      isFontColorMixed: () => false,
      getHighlightColor: () => '#ffff00',
      isHighlightColorMixed: () => false,
      getParagraphStyle: () => 'p' as const,
      isParagraphStyleMixed: () => false,
      isAlignLeft: () => false,
      isAlignCenter: () => false,
      isAlignRight: () => false,
      isAlignJustify: () => false,
      canOutdent: () => false,
      isBulletList: () => false,
      isNumberedList: () => false,
      customParagraphStylesEnabled: () => false,
      getCustomParagraphStyles: () => [],
      isCustomParagraphStylesLoading: () => false,
      isLink: () => false,
      isImageSelected: () => false,
      isInTable: () => false,
      canMergeCells: () => false,
      canUnmergeCells: () => false,
      hasTextSelection: () => true,
      isReadingAloud: () => false,
      canReadAloud: () => true,
      isFormatBrushActive: () => false,
    },
  },
}

export const HiddenMenu: Story = {
  args: {
    menuVisible: false,
  },
}

export const HiddenToolbar: Story = {
  args: {
    toolbarVisible: false,
  },
}

export const ToolbarLeft: Story = {
  args: {
    position: 'left',
  },
}

export const ToolbarBottom: Story = {
  args: {
    position: 'bottom',
  },
}

export const MobileMenu: Story = {
  args: {
    compact: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375 }}>
        <Story />
      </div>
    ),
  ],
}
