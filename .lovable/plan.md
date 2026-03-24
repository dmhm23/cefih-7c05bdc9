

## Plan: Eliminar campo "Fecha de certificación" de Historial de formación previa

Eliminar el campo `fechaCertificacionPrevia` de las tres vistas donde aparece:

### 1. `src/pages/matriculas/MatriculaFormPage.tsx`
- Quitar `fechaCertificacionPrevia` del schema zod, valores por defecto, pre-llenado desde historial, envío de datos, y el `<FormField>` del formulario.

### 2. `src/pages/matriculas/MatriculaDetallePage.tsx`
- Quitar el `<EditableField>` de "Fecha Certificación" (~líneas 453-458).

### 3. `src/components/matriculas/MatriculaDetailSheet.tsx`
- Quitar el bloque condicional `{matricula.fechaCertificacionPrevia && ...}` (~líneas 420-425).
- Actualizar la condición del `if` en línea 404 para no incluir `fechaCertificacionPrevia`.

No se elimina el campo del tipo `Matricula` para mantener compatibilidad con datos existentes.

