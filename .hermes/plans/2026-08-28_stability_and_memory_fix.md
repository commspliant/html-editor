# Stability & Memory Leak Fix Plan for WYSIWYG Editor

**Goal:** Eliminate freezing, memory leaks, and browser/system lockups caused by periodic heavy DOM traversal, recursive resize observer measurements, unbounded base64 undo history, and uncontrolled serialization loops.

**Architecture & Approach:**
1. **Decouple Auto-Save from Heavy DOM Parsing:** Transition auto-save comparison from periodic full-DOM serialization (`DOMParser` + tree walker) to a lightweight dirty-flag / event-driven snapshot model.
2. **Eliminate ResizeObserver Layout Thrashing:** Debounce/throttle workspace zoom recalculation and prevent `style.zoom` updates from re-triggering observer loops when content and images are rendered.
3. **Protect Undo/Redo History Memory Footprint:** Implement an aggregate memory/character budget or adaptive stack depth in `DocumentHistory` to avoid holding dozens of megabytes of base64 images in V8 memory.
4. **Optimize Font Family Scanning:** Replace synchronous un-cached `DOMParser` tree-walker passes with lightweight regex/pre-checks or scoped visual root reads.

---

### Task 1: Fix AutoSave Inefficiency & Accidental Recording Loops

**Files:**
- Modify: `src/components/Editor.tsx`
- Modify: `src/hooks/useAutoSave.ts`
- Test: `src/hooks/useAutoSave.test.tsx` and `src/components/Editor.test.tsx`

**Details:**
1. In `Editor.tsx`, `getDocumentHtml()` is currently executed every 1000ms by `useAutoSave`.
   - `getDocumentHtml()` flushes the DOM and calls `collectDocumentFontStylesheets()`.
   - If `serialized !== htmlRef.current`, it calls `recordHtml(serialized, true)`—meaning an idle editor could continuously push state into history every second if DOM serialization has minor normalization differences.
2. Update `Editor.tsx` so `getAutoSaveComparisonHtml` only computes/returns a new HTML string when `documentDirtyRef.current` is true, or uses `htmlRef.current` directly without triggering an unprompted flush/record cycle during idle ticks.
3. Ensure existing auto-save test suite passes.

---

### Task 2: Optimize & Cache `collectDocumentFontStylesheets` / `fontFamilyUsedInHtml`

**Files:**
- Modify: `src/core/fontFamily.ts`
- Test: `src/core/fontFamily.test.ts`

**Details:**
1. `fontFamilyUsedInHtml` currently instantiates `new DOMParser()` and a `TreeWalker` over the entire HTML string on every stylesheet check.
2. Add a quick fast-path check (e.g. `html.includes(family)` or simple case-insensitive substring search) before creating a full DOM tree.
3. Cache parsed results or inspect the live visual DOM root directly when available instead of parsing serialized HTML strings repeatedly.

---

### Task 3: Fix `ResizeObserver` & `measurePageZoom` Feedback Loop

**Files:**
- Modify: `src/components/Editor.tsx`
- Modify: `src/core/pageZoom.ts`
- Test: `src/core/pageZoom.test.ts`

**Details:**
1. In `Editor.tsx`, `ResizeObserver` observes `workspaceRef` and immediately triggers `measurePageZoomRef.current()`.
2. When zoom scale changes, applying `zoom: pageZoomScale` on `.pageCanvasViewport` can trigger another resize event on the workspace container, especially when scrollbars appear/disappear.
3. Wrap `measurePageZoom` with a `requestAnimationFrame` / debounce guard and prevent layout thrashing by ignoring microscopic scale changes or stabilizing scrollbar dimensions.

---

### Task 4: Memory Cap in Undo History for Large Payloads (Images)

**Files:**
- Modify: `src/modules/history/history.ts`
- Test: `src/modules/history/history.test.ts`

**Details:**
1. Currently, `HISTORY_MAX_PAST_ENTRIES = 100` allows 100 copies of the full document in memory regardless of size. With several inserted images or base64 data URLs, 100 snapshots quickly reach 500MB–2GB+, exhausting browser RAM.
2. Introduce a total byte/character budget (e.g., max ~20MB-50MB total history size) alongside entry count capping so when large images are present, older entries are evicted proactively before causing OOM freezes.

---

### Verification & Validation

1. **Unit & Regression Tests:**
   - Run `npm test` or `vitest run` to ensure all existing tests (history, autoSave, editor, fontFamily, pageZoom) pass.
2. **Stress & Stability Verification:**
   - Test idle stability (verify zero CPU/RAM growth over several minutes untouched).
   - Test inserting multiple large images (verify memory stays bounded in history and auto-save doesn't lag).
