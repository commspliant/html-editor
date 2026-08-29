# How to add a rich text editor in Next.js

Next.js App Router renders Server Components by default. The `Editor` uses `contenteditable` and browser APIs, so wrap it in a **client component** and import styles on the client.

## Steps

1. **Install** in your Next.js project:

   ```bash
   npm install commspliant-html-editor
   ```

2. **Create a client wrapper** (e.g. `components/RichTextEditor.tsx`):

   ```tsx
   'use client'

   import { useState } from 'react'
   import { Editor } from 'commspliant-html-editor'
   import 'commspliant-html-editor/styles.css'

   export function RichTextEditor({ initialHtml = '<p></p>' }: { initialHtml?: string }) {
     const [html, setHtml] = useState(initialHtml)

     return (
       <Editor
         value={html}
         onChange={setHtml}
         placeholder="Write your post…"
       />
     )
   }
   ```

3. **Import the wrapper** from a Server Component page:

   ```tsx
   import { RichTextEditor } from '@/components/RichTextEditor'

   export default function NewPostPage() {
     return (
       <main>
         <h1>New post</h1>
         <RichTextEditor />
       </main>
     )
   }
   ```

4. **Persist HTML** through a Route Handler or Server Action — store the string `onChange` returns. Sanitize on the server before rendering published content ([sanitize guide](how-to-sanitize-editor-html.md)).

## Tips

- Do not import `Editor` directly into a Server Component file.
- For SSR-heavy layouts, render the editor only after mount or inside the client boundary above.
- Use `locale="es"` when your app UI is Spanish; chrome strings are built in.

[← Back to guides](README.md) · [React setup](how-to-add-a-wysiwyg-editor-in-react.md)
