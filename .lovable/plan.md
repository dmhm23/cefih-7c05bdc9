

## Fix: Content Overflow in All Detail Sheet Panels

### Root Cause

The `DetailSheet` component uses Radix `ScrollArea` whose internal `Viewport` element has `overflow: scroll` on both axes by default. The inner content wrapper already has `overflow-hidden min-w-0`, but this doesn't help because the Viewport itself allows horizontal expansion before that constraint kicks in.

In a flex column layout (`flex flex-col` on SheetContent), the `ScrollArea` (as a flex child with `flex-1`) doesn't have `min-w-0`, so it can grow beyond its parent's width. Combined with grid children (like `grid grid-cols-2`) and long text in `EditableField` / `Combobox` triggers, content overflows to the right.

### Fix

Two targeted CSS changes in `DetailSheet.tsx`:

1. **Add `min-w-0` to the ScrollArea** -- This constrains the flex child so it can't grow wider than the SheetContent.

2. **Force the Radix Viewport to clip horizontal overflow** using a Tailwind selector: `[&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden` on the ScrollArea. This ensures only vertical scrolling is allowed.

These two changes fix the overflow for every module that uses `DetailSheet` (Matriculas, Personas, Cursos, Personal) without modifying any individual sheet component or the shared `scroll-area.tsx`.

### File to modify

| File | Change |
|---|---|
| `src/components/shared/DetailSheet.tsx` | Line 138: Add `min-w-0` and viewport overflow-x constraint to ScrollArea className |

### What does NOT change

- Individual detail sheet components (MatriculaDetailSheet, PersonaDetailSheet, etc.)
- The shared `scroll-area.tsx` component
- Sheet width or layout structure
- EditableField component

