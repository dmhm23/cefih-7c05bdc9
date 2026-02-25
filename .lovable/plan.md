

## Fix: Content Overflow + Nivel de Formacion Dropdown in Matriculas

### Problem 1 — Content overflows to the right in the detail sheet

The `DetailSheet` uses a fixed width of 480px (`w-[480px]`). Inside, the content uses `grid grid-cols-2 gap-4` which works fine for most fields, but some fields (like long labels, Combobox triggers, or the "Sector Economico" span-2) push content beyond the panel width.

**Root cause**: The `ScrollArea` content div (`px-6 py-4`) doesn't constrain its children's width. Combined with some fields not having `min-w-0` or `overflow-hidden`, text and interactive elements overflow horizontally.

**Fix**: Add `overflow-hidden` to the content wrapper inside `DetailSheet.tsx` and ensure the children container constrains width properly. Also add `min-w-0` to grid children in `MatriculaDetailSheet.tsx` where needed.

---

### Problem 2 — Nivel de Formacion shows a text input instead of dropdown

In both `MatriculaDetailSheet.tsx` (lines 448-454) and `MatriculaDetallePage.tsx` (lines 480-485), the "Nivel de Formacion" `EditableField` is missing `type="select"` and `options` props. Without these, `EditableField` defaults to `type="text"` rendering a plain text input.

The fix already exists in `MatriculaFormPage.tsx` which correctly fetches niveles and maps them to options:
```typescript
const { data: nivelesFormacion = [] } = useNivelesFormacion();
const nivelesOptions = nivelesFormacion.map((n) => ({
  value: n.id,
  label: n.nombreNivel,
}));
```

**Fix**: Apply the same pattern to both the detail sheet and the detail page:
1. Import `useNivelesFormacion` hook
2. Build `nivelesOptions` array from the fetched data
3. Add `type="select"` and `options={nivelesOptions}` to the "Nivel de Formacion" `EditableField`

---

### Files to modify

| File | Change |
|---|---|
| `src/components/shared/DetailSheet.tsx` | Add `overflow-hidden` and `min-w-0` to the ScrollArea content wrapper to prevent horizontal overflow |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | 1) Import `useNivelesFormacion`, build options array. 2) Add `type="select"` and `options` to "Nivel de Formacion" field. 3) Add `overflow-hidden min-w-0` to the main content div |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | 1) Import `useNivelesFormacion` (already imported), build options array from hook data. 2) Add `type="select"` and `options` to "Nivel de Formacion" field |

### What does NOT change
- EditableField component logic (already supports select with Combobox for 4+ options)
- Sheet width or layout structure
- Any other fields or sections

