import type { PlaygroundMessages } from './i18n/messages'

export type ExampleBlockId = 'chrome' | 'readOnly' | 'htmlFileDrop' | 'menu' | 'border' | 'fonts' | 'image' | 'toolbar' | 'language'

export type CodeExampleBlock = {
  titleKey: keyof PlaygroundMessages
  bodyKey: keyof PlaygroundMessages
  snippets: string[]
}

export const codeExampleBlocks: Record<ExampleBlockId, CodeExampleBlock> = {
  chrome: {
    titleKey: 'chromeAria',
    bodyKey: 'chromeExampleBody',
    snippets: [
      `import { useState } from 'react'
import { Editor } from 'commspliant-html-editor'

export function App() {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <Editor
      menuVisible
      toolbarVisible
      fullscreen={fullscreen}
      onFullscreenChange={setFullscreen}
    />
  )
}`,
      `import { Editor } from 'commspliant-html-editor'

<Editor menuVisible={false} toolbarVisible={false} />`,
    ],
  },
  readOnly: {
    titleKey: 'readOnlyAria',
    bodyKey: 'readOnlyExampleBody',
    snippets: [
      `import { Editor } from 'commspliant-html-editor'

<Editor readOnly defaultValue="<p>Hello</p>" />`,
    ],
  },
  htmlFileDrop: {
    titleKey: 'htmlFileDropAria',
    bodyKey: 'htmlFileDropExampleBody',
    snippets: [
      `import { Editor } from 'commspliant-html-editor'

<Editor disableHtmlFileDrop />`,
    ],
  },
  menu: {
    titleKey: 'appearanceMenuAria',
    bodyKey: 'menuExampleBody',
    snippets: [
      `import { Editor } from 'commspliant-html-editor'

<Editor
  menuColor="#1e3a5f"
  menuBackground="#fef3c7"
  menuFontSize="1.05rem"
  menuFontFamily="Georgia, serif"
/>`,
    ],
  },
  border: {
    titleKey: 'appearanceBorderAria',
    bodyKey: 'borderExampleBody',
    snippets: [
      `import { Editor } from 'commspliant-html-editor'

<Editor border="none" />`,
      `import { Editor, type EditorBorder } from 'commspliant-html-editor'

const border: EditorBorder = {
  width: '2px',
  color: '#2563eb',
  radius: '12px',
  shadow: '0 8px 24px rgb(0 0 0 / 15%)',
}

<Editor border={border} />`,
    ],
  },
  fonts: {
    titleKey: 'appearanceFontsAria',
    bodyKey: 'fontsExampleBody',
    snippets: [
      `import { Editor, type CustomFont } from 'commspliant-html-editor'

const customFonts: CustomFont[] = [
  {
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    css: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
  },
]

<Editor customFonts={customFonts} />`,
    ],
  },
  image: {
    titleKey: 'appearanceImageAria',
    bodyKey: 'imageExampleBody',
    snippets: [
      `import { Editor, type CustomImagePicker } from 'commspliant-html-editor'

const gallery: CustomImagePicker = {
  text: 'Gallery',
  description: 'Choose from your media library.',
  buttonCaption: 'Open gallery',
  onPick: (insertImage) => {
    insertImage({
      src: '/photo.jpg',
      alt: 'Lake',
      css: 'width: 200px; border-radius: 8px',
    })
  },
}

<Editor customImagePicker={gallery} />`,
      `import { Editor } from 'commspliant-html-editor'

<Editor customImagePicker={gallery} disableBuiltinImageInsert />`,
    ],
  },
  toolbar: {
    titleKey: 'appearanceToolbarAria',
    bodyKey: 'toolbarExampleBody',
    snippets: [
      `import { Editor, type ToolbarCustomizationPersistence } from 'commspliant-html-editor'

let stored = null

const toolbarCustomization: ToolbarCustomizationPersistence = {
  load: async () => stored,
  save: async (settings) => {
    stored = settings
  },
}

<Editor toolbarCustomization={toolbarCustomization} />`,
      `import { Editor } from 'commspliant-html-editor'

<Editor />`,
    ],
  },
  language: {
    titleKey: 'languageAria',
    bodyKey: 'languageExampleBody',
    snippets: [
      `import { Editor } from 'commspliant-html-editor'

<Editor locale="en" />`,
      `import { Editor } from 'commspliant-html-editor'

<Editor locale="es" />`,
    ],
  },
}
