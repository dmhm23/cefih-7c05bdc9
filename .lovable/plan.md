

## Plan: Fix empty Close Course modal

### Root Cause

The `CloseCourseDialog` validates and sets the step (mintrabajo_missing, documentos_incompletos, or confirm) inside `handleOpen`, which is the `onOpenChange` callback. However, the dialog is opened from the parent via `setCloseDialogOpen(true)`, which sets the `open` prop directly. Radix Dialog does NOT call `onOpenChange` when the `open` prop changes programmatically — it only fires on user-initiated close actions.

Result: step remains `"idle"`, and since no content renders for `step === "idle"`, the modal appears empty.

### Fix — `src/components/cursos/CloseCourseDialog.tsx`

Add a `useEffect` that watches the `open` prop. When it becomes `true`, run the validation logic to determine the correct step:

```ts
useEffect(() => {
  if (open) {
    if (!curso.minTrabajoRegistro || !curso.minTrabajoFechaCierrePrincipal) {
      setStep("mintrabajo_missing");
    } else {
      const incompletos = getDocsIncompletos();
      if (incompletos.length > 0) {
        setMatriculasConDocsIncompletos(incompletos);
        setStep("documentos_incompletos");
      } else {
        setStep("confirm");
      }
    }
  } else {
    setStep("idle");
  }
}, [open]);
```

Simplify `handleOpen` to just forward to `onOpenChange` (reset step on close only).

### Single file change
- `src/components/cursos/CloseCourseDialog.tsx`

