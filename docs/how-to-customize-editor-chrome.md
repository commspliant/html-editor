# How to customize editor chrome

Hosts often need to hide features their workflow does not support, or add custom actions next to built-in menus. Use `allowedChrome`, `menuVisible`, `toolbarVisible`, and `customActions` — the Help menu can stay available for end users.

## Steps

1. **Show only allowed menus** — menu ids include `file`, `edit`, `view`, `insert`, `format`, `table`, and `help`:

   ```tsx
   <Editor
     allowedChrome={{
       menus: ['edit', 'insert', 'format', 'help'],
       toolbar: ['undo', 'redo', 'bold', 'italic', 'underline'],
     }}
   />
   ```

2. **Hide the menu bar but keep the icon toolbar** (or vice versa):

   ```tsx
   <Editor menuVisible={false} toolbarVisible />
   ```

3. **Let users reorder icons** — View → Toolbar → Customize toolbar (or pass `toolbarCustomization` for host persistence).

4. **Add host actions** without forking the library:

   ```tsx
   customActions={[
     {
       id: 'publish',
       label: 'Publish',
       menu: { id: 'file' },
       onRun: ({ html }) => publish(html),
     },
   ]}
   ```

5. **Keep Help for authors** — unless your product replaces it, include `help` in `allowedChrome.menus` so users can search in-editor guidance (F1).

## Localisation

Pass `locale="en"` or `locale="es"` for chrome strings. Host content (`value`, `placeholder`) is not translated by the library.

[← Back to guides](README.md) · [Full README](../README.md#allowed-chrome)
