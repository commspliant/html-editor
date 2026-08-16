# wysiwyg-editor

**Try it out here:** [https://htmleditor.commspliant.com/](https://htmleditor.commspliant.com/)

Reusable React + TypeScript editor with two base modes: **Visual** (`contenteditable`) and **HTML** (plain-text source). Downstream apps import the package; they do not copy source.

## Usage

Peer dependencies: `react` and `react-dom` (^18).

```tsx
import { useState } from 'react'
import { Editor } from 'wysiwyg-editor'
import 'wysiwyg-editor/styles.css'

export function App() {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <Editor
      defaultValue="<p>Hello <strong>world</strong></p>"
      placeholder="Start writing…"
      fullscreen={fullscreen}
      onFullscreenChange={setFullscreen}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled HTML document |
| `defaultValue` | `string` | `''` | Initial HTML when uncontrolled |
| `onChange` | `(html: string) => void` | — | Fires when either surface edits the document |
| `mode` | `'visual' \| 'html'` | — | Controlled mode |
| `defaultMode` | `'visual' \| 'html'` | `'visual'` | Initial mode when uncontrolled |
| `onModeChange` | `(mode: EditorMode) => void` | — | Fires when the built-in Visual / HTML toggle is used |
| `fullscreen` | `boolean` | — | Controlled full-screen overlay |
| `defaultFullscreen` | `boolean` | `false` | Initial overlay when uncontrolled |
| `onFullscreenChange` | `(fullscreen: boolean) => void` | — | Fires when full screen is entered or exited |
| `placeholder` | `string` | — | Empty-state hint |
| `disabled` | `boolean` | — | Disables both surfaces, menus, toolbar commands, and the Visual / HTML / Full screen toggles |
| `className` | `string` | — | Extra class on the editor root |
| `locale` | `'en' \| 'es'` | `'en'` | Library chrome language. Document content is not translated |
| `toolbarBackground` | `string` | `#f0f0f0` | CSS color for the icon toolbar row. Omit to use the default light gray |
| `menuColor` | `string` | `#444` | CSS color for menu bar text and dropdown items |
| `menuBackground` | `string` | `#fff` | CSS color for the menu bar and dropdown panel |
| `menuFontSize` | `string` | `0.875rem` | CSS font-size for menu triggers and items. Omit to use the default |
| `menuFontFamily` | `string` | inherit | CSS font-family for menus. Omit to inherit `system-ui, sans-serif`. Load webfonts on the host page before passing a custom family |
| `border` | `'none' \| EditorBorder` | `1px` `#d0d0d0`, radius `6px` | Outer editor box. `'none'` removes width, radius, and shadow. Object fields (`width`, `color`, `radius`, `shadow`) are independent; omitted fields keep the defaults |
| `menuVisible` | `boolean` | `true` | Show the dropdown menu bar. Set `false` to hide it |
| `toolbarVisible` | `boolean` | `true` | Show the icon toolbar. Set `false` to hide it |
| `customActions` | `CustomAction[]` | — | Host-defined menu items and/or toolbar buttons. See [Custom actions](#custom-actions) |
| `customFonts` | `CustomFont[]` | — | Extra document font faces after the built-in web-safe list. See [Custom fonts](#custom-fonts) |
| `transformHtml` | `(html: string) => string` | — | Optional map over document HTML before it is stored and passed to `onChange`. See [Transform HTML](#transform-html) |
| `customImagePicker` | `CustomImagePicker` | — | Optional third Insert image source. See [Custom image picker](#custom-image-picker) |
| `disableBuiltinImageInsert` | `boolean` | `false` | Skip the Insert image dialog and call `customImagePicker.onPick` from the toolbar or Insert menu |

`mode`, `value`, and `fullscreen` are optional. Omit them for internal state; pass them to control from the parent. Chrome includes a File menu (Save, Load, and Print), an Edit menu (Undo and Redo), an Insert menu (Link and Bookmark), a File icon group (Save and Load), a Print icon group, an Edit icon group (Undo and Redo), an Insert icon group (Link and Bookmark), and the Visual | HTML | Full screen toggle unless `menuVisible` or `toolbarVisible` is `false`. Hide both to drop the chrome slot entirely. Full screen covers the host page with a fixed overlay; an X control (and Escape) returns to the in-page layout. Visual and HTML mode stay independent of the overlay. Save writes the current document to an HTML file; Load replaces it from an HTML file. Print opens the browser print dialog for the document HTML only (not the editor chrome). Undo and Redo walk document HTML history; they are grayed out when there is nothing to undo or redo. The File, Edit, and Insert menu items use the same icons as the toolbar buttons. Link wraps the selection (or inserts the URL as the visible text at the caret) in an `<a href>` tag; an optional title becomes the native hover tooltip, and opening in a new tab sets `target="_blank"`. Bookmark inserts a named destination (`id`) at the caret or around the selection.

`menuColor`, `menuBackground`, `menuFontSize`, and `menuFontFamily` restyle the dropdown menu bar and panels only — not the icon toolbar. `border` is the outer editor box and is ignored in fullscreen. Custom menu fonts must already be available on the page.

The toolbar Font dropdown lists web-safe faces (Arial, Georgia, Times New Roman, and the rest of the usual stacks). Choose **Default** to clear an authored `font-family` so the text inherits. Applied faces are written as inline `style="font-family: …"` on the selection (or the page shell from Page properties).

### Editor chrome

Show or hide the menu bar and icon toolbar, and control the full-screen overlay from the host.

```tsx
import { useState } from 'react'
import { Editor } from 'wysiwyg-editor'

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
}
```

```tsx
import { Editor } from 'wysiwyg-editor'

<Editor menuVisible={false} toolbarVisible={false} />
```

### Menu appearance

Restyle the dropdown menu bar only — not the icon toolbar. Load any custom webfont on the host page before passing its family name.

```tsx
import { Editor } from 'wysiwyg-editor'

<Editor
  menuColor="#1e3a5f"
  menuBackground="#fef3c7"
  menuFontSize="1.05rem"
  menuFontFamily="Georgia, serif"
/>
```

### Editor border

Set the outer editor box. Use `"none"` to remove width, radius and shadow. Object fields are independent; omitted fields keep the defaults. Ignored in full screen.

```tsx
import { Editor } from 'wysiwyg-editor'

<Editor border="none" />
```

```tsx
import { Editor, type EditorBorder } from 'wysiwyg-editor'

const border: EditorBorder = {
  width: '2px',
  color: '#2563eb',
  radius: '12px',
  shadow: '0 8px 24px rgb(0 0 0 / 15%)',
}

<Editor border={border} />
```

### Locale

Pass `locale` to switch library chrome between English and Spanish. Document content is not translated.

```tsx
import { Editor } from 'wysiwyg-editor'

<Editor locale="en" />
```

```tsx
import { Editor } from 'wysiwyg-editor'

<Editor locale="es" />
```

### Custom fonts

Pass `customFonts` to append host faces after the built-in list. Duplicate `family` values are ignored. Optional `css` is a stylesheet URL (Google Fonts CSS, or a host file with `@font-face`) — not a raw `.woff2`. The editor loads those stylesheets for the picker preview. When a webfont is used in the document, its `<link rel="stylesheet">` is prepended to the HTML `onChange` receives, so the snippet still loads the face outside the editor.

```tsx
<Editor
  customFonts={[
    {
      name: 'Roboto',
      family: 'Roboto, sans-serif',
      css: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
    },
  ]}
/>
```

### Transform HTML

Pass `transformHtml` to sanitize or enhance the document on every write: visual typing and paste, HTML-source edits, Load, inserts, and `setHtml`. The result is what the editor stores and what `onChange` receives. Inbound `value` / `defaultValue` are not transformed — sanitize those before passing if needed.

```tsx
<Editor
  defaultValue="<p>Hello</p>"
  transformHtml={(html) => html.replace(/<script[\s\S]*?<\/script>/gi, '')}
/>
```

Keep the callback idempotent. If it rewrites markup on every keystroke (pretty-print, wrap tags), the visual surface resyncs `innerHTML` and the caret may jump. Prefer stripping disallowed tags over format-on-type.

### Custom actions

Pass a `customActions` array to add host buttons, menu items, or both. Labels and tooltips are your copy — the library does not translate them.

```tsx
import { Editor, type CustomAction } from 'wysiwyg-editor'

const insertStamp: CustomAction = {
  id: 'stamp',
  label: 'Stamp',
  showIn: 'both',
  menu: { id: 'tools', label: 'Tools' },
  onAction: (api) => {
    api.insertHtml('<p>[stamp]</p>')
  },
}

<Editor customActions={[insertStamp]} />
```

Each object:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable id. Must not collide with built-ins (`save`, `open`, `undo`, `redo`, `visual`, `html`, `fullscreen`) |
| `label` | `string` | Menu item text; also the toolbar tooltip and accessible name when those are omitted |
| `tooltip` | `string` | Toolbar tooltip. Defaults to `label` |
| `icon` | React component | Optional 16×16 icon. Omit to use the built-in custom-action icon |
| `showIn` | `'menu'` \| `'toolbar'` \| `'both'` | Which chrome surfaces show the action |
| `menu` | `{ id?: string; label?: string }` | Menu placement. Built-in ids: `file`, `edit`, `insert`, `view`, `format`. Other ids create a new top-level menu. Default id: `custom` |
| `toolbarGroup` | `string` | Icon group. Built-in ids: `file`, `edit`, `insert`, `view`. Other ids create a group at the end. Default: `custom` |
| `onAction` | `(api: CustomActionApi) => void` | Called when the item is activated |

**Placement**

- New top-level menu: `{ menu: { id: 'tools', label: 'Tools' } }`
- Item in an existing menu: `{ menu: { id: 'file' } }`
- Existing toolbar group: `{ toolbarGroup: 'file' }`
- Array order is the order inside the target menu or group
- `showIn: 'menu'` skips the toolbar; `'toolbar'` skips the menu

When the action runs, `onAction` receives a snapshot of the caret or selection plus edit helpers. You choose the outcome:

| Method | Effect |
| --- | --- |
| `api.selection.text` | Selected plain text, or `''` if the caret is collapsed |
| `api.selection.start` / `end` | Offsets (visual: `textContent`; HTML mode: textarea indices) |
| `api.insertHtml(html, formattedText?)` | Insert HTML at the caret, or replace the selection. Pass `formattedText` to insert visible text instead of parsing markup |
| `api.insertText(text)` | Insert formatted text at the caret, or replace the selection |
| `api.setHtml(html)` | Replace the entire document |
| `api.getHtml()` | Current document HTML |

The snapshot is taken before chrome steals focus, so a host dialog can call `insertHtml` later and still hit the original caret or selection.

Both modes share one HTML string. Switching Visual → HTML flushes the contenteditable markup into the textarea; switching back mounts that string into the visual surface.

### Custom image picker

Pass `customImagePicker` to add a third Insert image source. Labels are your copy — the library does not translate them. When the host finishes picking, call the `insertImage` function received by `onPick`.

```tsx
import { Editor, type CustomImagePicker } from 'wysiwyg-editor'

const gallery: CustomImagePicker = {
  text: 'Gallery',
  description: 'Choose from your media library.',
  buttonCaption: 'Open gallery',
  onPick: (insertImage) => {
    openHostGallery().then((picked) => {
      insertImage({
        src: picked.url,
        alt: picked.alt,
        title: picked.title,
        css: 'width: 200px; border-radius: 8px',
      })
    })
  },
}

<Editor customImagePicker={gallery} />
```

| Field | Type | Description |
| --- | --- | --- |
| `text` | `string` | Third source / navigation button label |
| `description` | `string` | Shown on the custom source panel |
| `buttonCaption` | `string` | Caption of the button that starts the host picker |
| `onPick` | `(insertImage) => void` | Called when that button is clicked. Call `insertImage` with a URL or raster data URL, plus optional `alt`, `title`, and inline `css` |

Omit `customImagePicker` to keep File and URL only. Set `disableBuiltinImageInsert` to skip the dialog: Insert → Image and the toolbar Image button call `onPick` immediately.

```tsx
<Editor customImagePicker={gallery} disableBuiltinImageInsert />
```

`insertImage` uses the same insert path as File and URL: an `<img>` with inline `max-width: 100%; height: auto`, then any host `css`. `src` must be `http(s)`, a relative path, or a raster `data:` URL.

### Style isolation

The shipped CSS resets inherited styles on the editor root and restyles chrome and the visual document so typical host-page rules (`p`, `button`, `textarea`, inherited typography) do not restyle the editor. Pass `className` on the root to override that look on purpose. Isolation is not a hard boundary: high-specificity host selectors or `!important` can still win.

## Development

```bash
make install            # npm install
make dev                # playground at the Vite dev server
make build              # static playground to dist/ (index.html for hosting)
make build-lib          # library to dist/ (es, cjs, types, CSS)
make preview            # serve dist/ locally
make test               # vitest
make storybook          # Storybook on port 6006
```

`make build` and `make build-lib` both write to `dist/` and overwrite each other. Use `make build` for the hosted demo; use `make build-lib` when packaging the library.

- `src/` is the library. Public exports live in `src/index.ts`.
- `playground/` is a consumer app: it imports `wysiwyg-editor` the same way other projects will. No editor logic belongs there.
- Stories (`*.stories.tsx`) sit next to public UI and are the visual contract.
- Tests (`*.test.ts(x)`) sit next to modules.

The live demo is the playground static build. DigitalOcean App Platform defaults (`npm run build`, output `dist`) match this. Deploy a **static site** from the repo root with:

- **Build command:** `npm run build` (or leave the Node default)
- **Output directory:** `dist` (not `playground/dist`)
- **Source directory:** `/`
- **Node:** 18+ (this repo pins 20 via `.nvmrc`; set `NODE_VERSION=20` if the build image ignores it)

```tsx
import { Editor } from 'wysiwyg-editor'
```

[Brought to you by CommsPliant Communication](https://commspliant.com/)
