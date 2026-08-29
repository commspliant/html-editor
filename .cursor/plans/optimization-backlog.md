# WYSIWYG Editor — Optimization Backlog

Last updated: 2026-08-29. Use this file when chat context is full.

## Completed (do not re-do)

| Area | What shipped |
|------|----------------|
| **Multi-page state** | `usePageStore`, structural sharing, dirty-page flush, `useVisualPageBodies` |
| **Multi-page UI perf** | `MemoizedPageRow`, selective `syncSurfaceHtml` in `MultiPageVisualSurface.tsx` |
| **Preview** | `getDocumentHtml` / preview always export all pages via `getAllPagesHtml()` |
| **HTML mode** | Per-page textarea + `HtmlPageTabs` (scroll arrows at 5+ pages) |
| **History memory** | `HISTORY_MAX_TOTAL_CHARS` (20M) + entry cap in `history.ts` |
| **Auto-save** | Multi-page dirty snapshot cache |
| **Font preview scan** | `previewFontKey` uses active page only in multi-page mode |
| **Image registry** | Opt-in `optimizeEmbeddedImages`; `imageRegistry.ts`, externalize on store, hydrate on export |
| **Open image flash** | Canonical document equality + image-preserving visual sync on File → Open |
| **Page-scoped undo** | `multiPageHistory.ts` — per-page edit entries + structural insert/delete/replace-all ops |
| **Multi-page virtualization** | Always-on virtual page list in visual mode — flush on unmount, `useVirtualPageRange`, height spacers, mounted-only ruler metrics |
| **Font stylesheet collection** | Per-page scoping via `serializePageBody` + `liveRoot` in multi-page mode; `fontFamilyUsedInRoot` / parse cache for single-page |
| **`onPagesChange` batching** | Microtask-coalesced `schedulePagesChange` in `Editor.tsx` (flush on unmount) |
| **Playground multi-page HTML tabs** | `multiPagesExampleBody` aligned with per-page `HtmlPageTabs` behavior (en + es) |

## Remaining — high impact

_(none — virtualization shipped)_

## Remaining — medium / polish

### Stability plan leftovers (`.hermes/plans/2026-08-28_stability_and_memory_fix.md`)

| Task | Status |
|------|--------|
| Auto-save idle loops (single-page `getDocumentHtml` must not `recordHtml` on idle poll) | Done |
| `fontFamilyUsedInHtml` parse cache / live DOM | Done |
| ResizeObserver / zoom debounce | Done |

### Editor render split

Split `Editor.tsx` document surface vs chrome so typing does not re-render toolbar/dialogs. **Done** — `EditorChrome` + `EditorWorkspaceHost`, ref-backed document bridge, memo'd toolbar, lazy dialog mount, per-slice toolbar query subscriptions.

### Profiling-gated (defer until measured)

- **Web Worker for sanitize/join** — only worthwhile for very large single-page docs with default `sanitizeHtml={true}` during typing; multi-page typing already skips per-keystroke sanitize. Revisit after main-thread profiling.

## Suggested priority

1. Stability leftovers + low-hanging — **done**
2. Editor chrome split — **done**
3. Profiling-gated worker sanitize — defer
