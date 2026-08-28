# Refactoring & Code Quality Execution Plan

**Goal:** Refactor the codebase to eliminate bundler warnings, resolve potential AutoSave dirty state desynchronization, harden font detection against false positives, account for redo stack memory in undo history, and improve modularity in `Editor.tsx`.

**Constraints:**
- No commit or push until explicitly requested.
- Ensure all 87 test suites and 972+ tests pass without warnings or regressions.
- Keep behavior strictly non-breaking.

---

### Task 1: Clean Up Duplicate Mock Keys in Test Suites

**Objective:** Eliminate Vite/esbuild bundler warnings during test execution caused by duplicate `toggleFormatBrush` property keys in test fixture factories.

**Files:**
- Modify: `src/modules/view/commands.test.ts`
- Modify: `src/modules/insert/commands.test.ts`
- Modify: `src/modules/table/commands.test.ts`
- Modify: `src/modules/history/commands.test.ts`

**Steps:**
1. Locate redundant duplicate `toggleFormatBrush: vi.fn()` entries in the default context mock objects across the 4 test files.
2. Remove duplicate declarations.
3. Run `npx vitest run src/modules/` and verify zero warning logs.

---

### Task 2: Fix AutoSave Multi-Page Snapshot Dirty Flag Handling

**Objective:** Prevent `documentDirtyRef.current` from being prematurely marked clean during the comparison getter pass in `Editor.tsx`.

**Files:**
- Modify: `src/components/Editor.tsx`
- Modify: `src/hooks/useAutoSave.ts`
- Test: `src/hooks/useAutoSave.test.tsx` and `src/components/Editor.test.tsx`

**Steps:**
1. In `Editor.tsx`, adjust `readAutoSaveMultiPageSnapshot` so reading the current snapshot does not reset `documentDirtyRef.current = false` prematurely.
2. Reset `documentDirtyRef.current = false` when `onAutoSave` completes successfully or when a save action actually persists.
3. Verify with `npx vitest run src/components/Editor.test.tsx src/hooks/useAutoSave.test.tsx`.

---

### Task 3: Improve Font Detection Fast-Path in `fontFamily.ts`

**Objective:** Make `fontFamilyUsedInHtml` pre-checking stricter to avoid triggering `DOMParser` + `TreeWalker` on generic words matching font names in plain document text.

**Files:**
- Modify: `src/core/fontFamily.ts`
- Test: `src/core/fontFamily.test.ts`

**Steps:**
1. Update `fontFamilyUsedInHtml` to test for style or tag font occurrences (e.g., regex matching `font-family:` declarations, `face=` attributes, or CSS definitions) before constructing a full DOM tree.
2. Add unit tests in `fontFamily.test.ts` covering plain-text words matching font names (e.g. `<p>We live in modern times</p>` should not detect `Times New Roman` unless declared in style attributes).
3. Run `npx vitest run src/core/fontFamily.test.ts`.

---

### Task 4: Include Redo Future Stack in History Memory Budget

**Objective:** Ensure `DocumentHistory` tracks both `past` and `future` stacks against the total byte/character budget to prevent memory accumulation during repeated undo/redo sequences with large payloads.

**Files:**
- Modify: `src/modules/history/history.ts`
- Test: `src/modules/history/history.test.ts`

**Steps:**
1. In `createDocumentHistory`, maintain a combined character count or trim `future` entries if total retained characters exceed `HISTORY_MAX_TOTAL_CHARS`.
2. Add unit tests in `src/modules/history/history.test.ts` verifying that large payloads in the redo stack are also budgeted.
3. Run `npx vitest run src/modules/history/history.test.ts`.

---

### Task 5: Add Zoom Delta Threshold (Hysteresis) in `measurePageZoom`

**Objective:** Prevent sub-pixel micro-oscillations when workspace scrollbars appear/disappear during resize events.

**Files:**
- Modify: `src/core/pageZoom.ts`
- Modify: `src/components/Editor.tsx`
- Test: `src/core/pageZoom.test.ts`

**Steps:**
1. In `measurePageZoom` / `Editor.tsx`, check if `Math.abs(currentScale - nextScale) < 0.005`. If the difference is negligible, avoid updating `pageZoomScale`.
2. Run `npx vitest run src/core/pageZoom.test.ts src/components/Editor.test.tsx`.

---

### Verification & Validation

1. **Full Test Suite Execution:**
   - Run `npm test` to verify all 87 test files pass cleanly without Vite warnings.
2. **Type Checking & Lint:**
   - Run `npx tsc --noEmit` to verify type safety.
