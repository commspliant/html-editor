# How to sanitize editor HTML

User-generated HTML from any rich text editor should be sanitized before you store it or render it on a public site. This library can sanitize on every write and lets you add a host-specific `transformHtml` hook.

## Steps

1. **Keep default sanitization on** — `sanitizeHtml` defaults to `true`. The editor runs its built-in sanitizer on typing, paste, inserts, and file load.

2. **Add DOMPurify or your policy** with `transformHtml`:

   ```tsx
   import DOMPurify from 'dompurify'
   import { Editor } from 'commspliant-html-editor'

   function sanitize(html: string) {
     return DOMPurify.sanitize(html, {
       USE_PROFILES: { html: true },
     })
   }

   <Editor value={html} onChange={setHtml} transformHtml={sanitize} />
   ```

3. **Sanitize again on the server** when you publish — never trust client-side filtering alone.

4. **Allow embedded media carefully** — if you enable audio, video, or custom image hosts, extend your allowlist for the tags and attributes you permit.

## Related

- Built-in `sanitizeHtml` and `transformHtml` props: [README](../README.md#html-sanitization)
- Clean output shape: [How to get clean HTML](how-to-get-clean-html-from-the-editor.md)

[← Back to guides](README.md)
