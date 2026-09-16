# Security notes

This package edits HTML in the browser. Treat saved output as untrusted until a
host or server sanitizer you control has accepted it.

## `sanitizeHtml` vs `transformHtml` vs multi-page

| Control | Default | When it runs | What it does |
| --- | --- | --- | --- |
| `sanitizeHtml` | `true` | Inbound `value` / `defaultValue` / `pages` and every outbound write, including multi-page `commitPages` | Built-in XSS guard (scripts, event handlers, dangerous URIs, iframe/form/object/embed). Not DOMPurify. |
| `transformHtml` | unset | After built-in sanitization on those same writes | Host-owned extra filter or rewriter. Keep it idempotent. Do not strip HTML comments if you use multi-page joined HTML (`<!-- wysiwyg-page-separator -->`). |
| `enableMultiPages` | `false` | Visual pages + `onPagesChange` | Each page is sanitized independently when `sanitizeHtml` is true. Joined storage still uses the page separator comment. |

`sanitizeHtml={false}` is the **dangerouslyDisableSanitize** escape hatch. The
prop name is unchanged so existing hosts keep working. Development builds log a
`console.warn`. If you disable the built-in guard, you must supply `transformHtml`
and/or sanitize before persist/render.

## Size guards

To reduce tab freeze / OOM on huge paste or hostile HTML, ingest and commit
paths clamp documents to:

- `MAX_EDITOR_PAGE_COUNT` (500 pages)
- `MAX_EDITOR_HTML_CHARS` (~5MB total HTML)

Dropped content is marked with `DOCUMENT_TRUNCATED_COMMENT` (`<!-- wysiwyg-truncated -->`)
so the limit is never silent. `splitPagesFromHtml` stays lossless for hosts that
need the raw split.

## Persistence parsers

Toolbar, dark-mode, and page-zoom `localStorage` payloads are parsed as `unknown`
and copied field-by-field. Validators do not `Object.assign` / proto-merge JSON
into shared objects.
