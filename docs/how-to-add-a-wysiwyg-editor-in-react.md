# How to add a WYSIWYG editor in React

You can add a production-ready WYSIWYG editor to a React app in a few minutes by installing `commspliant-html-editor` and rendering the `Editor` component with controlled `value` / `onChange` state.

## Steps

1. **Install the package** (React 18+ as a peer dependency):

   ```bash
   npm install commspliant-html-editor
   ```

2. **Import the component and styles** in your app entry or page:

   ```tsx
   import { Editor } from 'commspliant-html-editor'
   import 'commspliant-html-editor/styles.css'
   ```

3. **Wire document state** the same way you would for any controlled input:

   ```tsx
   import { useState } from 'react'
   import { Editor } from 'commspliant-html-editor'
   import 'commspliant-html-editor/styles.css'

   export function MyPage() {
     const [html, setHtml] = useState('<p>Hello world</p>')

     return (
       <Editor
         value={html}
         onChange={setHtml}
         placeholder="Start writing…"
       />
     )
   }
   ```

4. **Try the chrome** — menus for File, Edit, View, Insert, Format, Table, and Help are enabled by default. Use **Help → Editor Help** (F1) for end-user guidance.

## Next steps

- [TypeScript setup](how-to-use-the-editor-with-typescript.md)
- [Next.js App Router](how-to-add-a-rich-text-editor-in-nextjs.md)
- [Full API reference](../README.md)

[← Back to guides](README.md)
