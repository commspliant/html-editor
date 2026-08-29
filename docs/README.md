# CommsPliant HTML editor — developer guides

**How do I add a React / TypeScript WYSIWYG editor to my app?** Install `commspliant-html-editor`, import the `Editor` component and stylesheet, then pass `value` and `onChange` for a controlled document. The editor ships with Word-like menus, Visual and HTML modes, and TypeScript-first props — no TipTap, Lexical, or Quill dependency.

Live demo: [htmleditor.commspliant.com](https://htmleditor.commspliant.com/)

For the full API (props, callbacks, chrome customization), see the [package README](../README.md).

## How-to guides

- [How to add a WYSIWYG editor in React](how-to-add-a-wysiwyg-editor-in-react.md)
- [How to use the editor with TypeScript](how-to-use-the-editor-with-typescript.md)
- [How to add a rich text editor in Next.js](how-to-add-a-rich-text-editor-in-nextjs.md)
- [How to get clean HTML from the editor](how-to-get-clean-html-from-the-editor.md)
- [How to sanitize editor HTML](how-to-sanitize-editor-html.md)
- [How to customize editor chrome](how-to-customize-editor-chrome.md)

## Why this editor?

- **React + TypeScript** — peer dependencies only; props and commands are fully typed.
- **Native contenteditable** — not a wrapper around TipTap or Lexical; predictable HTML output.
- **Word-like chrome** — File, Edit, View, Insert, Format, Table, and Help menus plus an icon toolbar.
- **Visual and HTML modes** — authors edit WYSIWYG or source; serialized HTML uses inline `style` attributes.
- **Localised chrome** — built-in `en` and `es` UI strings via the `locale` prop.

## In-editor Help

End users can open **Help → Editor Help** (F1) inside the embedded editor for task-oriented articles and search. Developer guides on this page target integrators evaluating or shipping the library.
