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

## Remaining — high impact

### Virtualized page list

Mount only visible pages ± buffer; flush DOM before unmount. For 20+ pages.

**Touches:** `MultiPageVisualSurface.tsx`, ruler metrics hooks

## Remaining — medium / polish

### Stability plan leftovers (`.hermes/plans/2026-08-28_stability_and_memory_fix.md`)

| Task | Status |
|------|--------|
| Auto-save idle loops (single-page `getDocumentHtml` must not `recordHtml` on idle poll) | Partial |
| `fontFamilyUsedInHtml` parse cache / live DOM | Partial (fast-path only) |
| ResizeObserver / zoom debounce | Partial (`measuringPageZoomRef` exists) |

### Editor render split

Split `Editor.tsx` document surface vs chrome so typing does not re-render toolbar/dialogs.

### Low-hanging fruit

- Debounce `onPagesChange` (microtask batch)
- Scope `collectDocumentFontStylesheets` to edited page only
- Web Worker for sanitize/join on large export

## Documentation gaps

- Playground `messages.ts`: note multi-page HTML tab behavior (README done)

## Suggested priority

1. Virtualization
2. Stability leftovers + low-hanging
3. Editor chrome split
