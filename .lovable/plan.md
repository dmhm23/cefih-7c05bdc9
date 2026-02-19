

## Plan: Fix preview dialog closing sheet and stale state bug

### Root Cause

Two issues work together to create this bug:

1. **DetailSheet's outside-click handler** (`src/components/shared/DetailSheet.tsx`, line 48-63) checks for Radix popper/select/menu portals but does NOT detect open **Dialog** portals. When clicking inside a preview dialog, the handler sees the click is outside the sheet and closes it.

2. **Stale `previewFormato` state** (`src/components/matriculas/MatriculaDetailSheet.tsx`, line 110): When the sheet closes, `previewFormato` is never reset to `null`. On the next row click, the sheet reopens with the old value, immediately re-opening the dialog.

### Changes

#### 1. Add Dialog portal detection to outside-click handler (`src/components/shared/DetailSheet.tsx`)

Update the `handleClickOutside` function to also detect open Radix Dialog portals by checking for `[role="dialog"]` elements or `[data-radix-dialog-overlay]`. If a dialog is open, skip the close action.

```
Line ~52-55: Add dialog portal selectors to the hasOpenPortal check
```

#### 2. Reset preview state when sheet closes (`src/components/matriculas/MatriculaDetailSheet.tsx`)

In the existing `useEffect` that resets state when `matricula.id` changes (line 112-117), also reset `previewFormato` to `null`. Additionally, reset it when `open` changes to `false`.

```
Line ~112-117: Add previewFormato reset when sheet closes or matricula changes
```

### Files to modify

| File | Change |
|------|--------|
| `src/components/shared/DetailSheet.tsx` | Add `[role="dialog"]` to the portal detection query in `handleClickOutside` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Reset `previewFormato` to `null` when sheet closes and on matricula change |

