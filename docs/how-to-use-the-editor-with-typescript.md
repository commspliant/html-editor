# How to use the editor with TypeScript

`commspliant-html-editor` is written in TypeScript and exports typed props, commands, and chrome options so you get autocomplete in VS Code, Cursor, and other IDEs without `@types/*` packages.

## Steps

1. **Install** the library in a TypeScript React project (`strict` mode is supported):

   ```bash
   npm install commspliant-html-editor
   ```

2. **Import typed props** from the package entry:

   ```tsx
   import { Editor, type EditorProps } from 'commspliant-html-editor'
   ```

3. **Type your wrapper** when you expose the editor from your design system:

   ```tsx
   type ArticleEditorProps = Pick<
     EditorProps,
     'value' | 'onChange' | 'placeholder' | 'locale' | 'readOnly'
   >

   export function ArticleEditor(props: ArticleEditorProps) {
     return <Editor {...props} />
   }
   ```

4. **Use host callbacks with typed payloads** — `onSave`, `onOpen`, `transformHtml`, and `customActions` all accept strongly typed arguments. See the [README props table](../README.md#usage).

5. **Restrict chrome safely** with `AllowedChrome`:

   ```tsx
   import type { AllowedChrome } from 'commspliant-html-editor'

   const chrome: AllowedChrome = {
     menus: ['file', 'edit', 'format', 'help'],
     toolbar: ['save', 'undo', 'redo', 'bold', 'italic'],
   }
   ```

## Why TypeScript teams choose this editor

Unlike headless frameworks (TipTap, Lexical) that require you to build every toolbar control, this library ships a complete Word-like UI while keeping a narrow public API. You integrate props, not editor extensions.

[← Back to guides](README.md) · [Add in React](how-to-add-a-wysiwyg-editor-in-react.md)
