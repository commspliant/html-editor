import type { Meta, StoryObj } from '@storybook/react'
import { emptyFontMarkState } from '../core/marks'
import type { CustomImageInsert, CustomParagraphStyle } from '../types'
import { Editor } from './Editor'

const meta = {
  title: 'Editor',
  component: Editor,
  args: {
    placeholder: 'Start writing…',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '32rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Editor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Spanish: Story = {
  args: {
    locale: 'es',
    placeholder: 'Empieza a escribir…',
  },
}

export const HtmlMode: Story = {
  args: {
    defaultMode: 'html',
  },
}

export const SeededHtml: Story = {
  args: {
    defaultValue: '<p>Hello <strong>world</strong></p>',
  },
}

export const TransformHtml: Story = {
  args: {
    defaultMode: 'html',
    defaultValue: '<p>Hello</p><script>alert(1)</script>',
    transformHtml: (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ''),
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: '<p>Read only</p>',
    disabled: true,
  },
}

export const IsolatedFromHost: Story = {
  decorators: [
    (Story) => (
      <div className="hostile-host">
        <style>{`
          .hostile-host {
            height: 100%;
            font-size: 28px;
            color: hotpink;
            font-family: Georgia, serif;
            line-height: 2.4;
          }
          .hostile-host p {
            margin: 3rem;
            color: red;
          }
          .hostile-host button {
            background: lime;
            padding: 2rem;
            font-size: 24px;
          }
          .hostile-host textarea {
            font-size: 32px;
            color: orange;
            background: navy;
          }
          .hostile-host strong {
            color: aqua;
            font-size: 2em;
          }
        `}</style>
        <Story />
      </div>
    ),
  ],
  args: {
    defaultValue:
      '<p>Hello <strong>world</strong></p><p>Host styles should not restyle this document.</p>',
  },
}

export const ToolbarBackground: Story = {
  args: {
    toolbarBackground: '#dbeafe',
    defaultValue: '<p>Custom toolbar background.</p>',
  },
}

export const MenuFormatting: Story = {
  args: {
    menuColor: '#1e3a5f',
    menuBackground: '#fef3c7',
    menuFontSize: '1.125rem',
    menuFontFamily: 'Georgia, serif',
    defaultValue: '<p>Custom menu color, background, size, and font.</p>',
  },
}

export const BorderNone: Story = {
  args: {
    border: 'none',
    defaultValue: '<p>No outer border, radius, or shadow.</p>',
  },
}

export const BorderCustom: Story = {
  args: {
    border: {
      width: '2px',
      color: '#2563eb',
      radius: '12px',
      shadow: '0 8px 24px rgb(0 0 0 / 15%)',
    },
    defaultValue: '<p>Custom outer border, radius, and shadow.</p>',
  },
}

export const HiddenMenu: Story = {
  args: {
    menuVisible: false,
    defaultValue: '<p>Menu bar hidden.</p>',
  },
}

export const HiddenToolbar: Story = {
  args: {
    toolbarVisible: false,
    defaultValue: '<p>Icon toolbar hidden.</p>',
  },
}

export const HiddenChrome: Story = {
  args: {
    menuVisible: false,
    toolbarVisible: false,
    defaultValue: '<p>Menu and toolbar hidden.</p>',
  },
}

export const Fullscreen: Story = {
  args: {
    defaultFullscreen: true,
    defaultValue: '<p>Full screen overlay.</p>',
  },
}

const insertDemo = {
  id: 'demo',
  label: 'Demo',
  onAction: (api: { insertHtml: (html: string) => void }) => {
    api.insertHtml('[demo]')
  },
}

export const CustomActionsBoth: Story = {
  args: {
    defaultValue: '<p>Custom action on menu and toolbar.</p>',
    customActions: [
      {
        ...insertDemo,
        showIn: 'both',
        menu: { id: 'tools', label: 'Tools' },
      },
    ],
  },
}

export const CustomActionsMenuOnly: Story = {
  args: {
    defaultValue: '<p>Custom action in a new Tools menu only.</p>',
    customActions: [
      {
        ...insertDemo,
        showIn: 'menu',
        menu: { id: 'tools', label: 'Tools' },
      },
    ],
  },
}

export const CustomActionsToolbarOnly: Story = {
  args: {
    defaultValue: '<p>Custom action on the toolbar only.</p>',
    customActions: [
      {
        ...insertDemo,
        showIn: 'toolbar',
      },
    ],
  },
}

export const CustomActionsNoIcon: Story = {
  args: {
    defaultValue: '<p>Default custom-action icon.</p>',
    customActions: [
      {
        id: 'demo',
        label: 'Demo',
        tooltip: 'Run demo',
        showIn: 'toolbar',
        onAction: (api) => {
          api.insertHtml('[demo]')
        },
      },
    ],
  },
}

export const CustomActionsInFileMenu: Story = {
  args: {
    defaultValue: '<p>Custom action under File.</p>',
    customActions: [
      {
        ...insertDemo,
        showIn: 'menu',
        menu: { id: 'file' },
      },
    ],
  },
}

export const CustomActionsNewMenu: Story = {
  args: {
    defaultValue: '<p>Custom Tools menu.</p>',
    customActions: [
      {
        id: 'one',
        label: 'First',
        showIn: 'menu',
        menu: { id: 'tools', label: 'Tools' },
        onAction: (api) => {
          api.insertHtml('[one]')
        },
      },
      {
        id: 'two',
        label: 'Second',
        showIn: 'menu',
        menu: { id: 'tools' },
        onAction: (api) => {
          api.insertHtml('[two]')
        },
      },
    ],
  },
}

let storyCustomStyles: CustomParagraphStyle[] = [
  {
    id: 'quote',
    name: 'Quote',
    font: {
      size: 12,
      unit: 'pt',
      marks: { ...emptyFontMarkState(), italic: true },
      fontFamily: null,
      fontColor: null,
      highlightColor: null,
    },
  },
]

export const CustomParagraphStyles: Story = {
  args: {
    defaultValue:
      '<p>Custom styles under Heading 6. Format menu edits them; the toolbar applies them.</p>',
    loadCustomParagraphStyles: async () =>
      storyCustomStyles.map((style) => ({
        ...style,
        font: { ...style.font, marks: { ...style.font.marks } },
      })),
    onSaveCustomParagraphStyle: async (style) => {
      const index = storyCustomStyles.findIndex((item) => item.id === style.id)
      if (index >= 0) storyCustomStyles[index] = style
      else storyCustomStyles = [...storyCustomStyles, style]
    },
    onDeleteCustomParagraphStyle: async (id) => {
      storyCustomStyles = storyCustomStyles.filter((item) => item.id !== id)
    },
  },
}

export const CustomFonts: Story = {
  args: {
    defaultValue: '<p>Toggle the Font dropdown — Roboto, Pacifico, and Source Serif 4 are appended.</p>',
    customFonts: [
      {
        name: 'Roboto',
        family: 'Roboto, sans-serif',
        css: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
      },
      {
        name: 'Pacifico',
        family: 'Pacifico, cursive',
        css: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
      },
      {
        name: 'Source Serif 4',
        family: '"Source Serif 4", serif',
        css: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,700&display=swap',
      },
    ],
  },
}

const storyImagePicker = {
  text: 'Gallery',
  description: 'Choose from the media library.',
  buttonCaption: 'Open gallery',
  onPick: (insertImage: (image: CustomImageInsert) => void) => {
    insertImage({
      src: 'https://example.com/a.png',
      alt: 'Sample',
      title: 'Gallery',
      css: 'width: 160px; border-radius: 8px',
    })
  },
}

export const CustomImagePickerTab: Story = {
  args: {
    defaultValue: '<p>Insert image includes a Gallery source.</p>',
    customImagePicker: storyImagePicker,
  },
}

export const CustomImagePickerDirect: Story = {
  args: {
    defaultValue: '<p>Insert image opens the host picker immediately.</p>',
    disableBuiltinImageInsert: true,
    customImagePicker: storyImagePicker,
  },
}
