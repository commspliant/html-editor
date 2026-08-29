# How to get clean HTML from the editor

Search teams often ask for **SEO-friendly HTML** from a WYSIWYG editor. CommsPliant HTML editor serializes Visual-mode content with **structural tags** (`p`, `h1`, `ul`, `a`, …) and **inline `style` attributes** for presentation — not editor-specific CSS classes.

## What you receive in `onChange`

```html
<p style="text-align: center">
  <span style="font-weight: bold; color: rgb(200, 0, 0)">Hello</span>
</p>
```

This HTML is portable: email clients, CMS previews, and static pages can render it without loading editor stylesheets.

## Steps

1. **Read `value` / `onChange`** — the string is the document HTML (single page or multi-page joined, depending on configuration).
2. **Avoid post-processing that strips `style`** if you need WYSIWYG fidelity.
3. **Use `transformHtml`** when you need a final normalization pass (after built-in sanitization).
4. **Switch to HTML mode** (View → HTML) when authors must edit source directly; the same string round-trips through Visual mode.

## Multi-page documents

When `enableMultiPages` is true, each page is stored separately; use the multi-page helpers exported from the package to split or join pages for storage.

[← Back to guides](README.md) · [Sanitize HTML](how-to-sanitize-editor-html.md)
