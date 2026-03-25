

## Plan: Renombrar "Documentos" → "Requisitos documentales" en toda la aplicación

### Alcance

Se identificaron todas las etiquetas visibles al usuario que usan "Documentos" en contexto de requisitos de matrícula/nivel. Las referencias a "Documentos Adjuntos" en personal se mantienen sin cambio (son adjuntos genéricos, no requisitos).

### Cambios por archivo

1. **`src/components/matriculas/MatriculaDetailSheet.tsx`** (línea 499)
   - `DetailSection title="Documentos"` → `"Requisitos documentales"`

2. **`src/pages/matriculas/MatriculaDetallePage.tsx`** (línea 573)
   - `Documentos Requeridos` → `Requisitos documentales`

3. **`src/components/matriculas/DocumentosCarga.tsx`** (líneas 218, 336)
   - `{completados}/{total} documentos` → `{completados}/{total} requisitos`
   - `Documentos incluidos en el PDF` → `Requisitos incluidos en el PDF`

4. **`src/pages/matriculas/MatriculasPage.tsx`** (líneas 43, 116, 278-279)
   - Column header y filter label: `"Estado Documental"` se mantiene (describe el estado, no la sección)

5. **`src/components/cursos/EnrollmentsTable.tsx`** (línea 115)
   - Filter label `"Estado Documental"` se mantiene (mismo criterio)

### Archivos modificados
- `src/components/matriculas/MatriculaDetailSheet.tsx`
- `src/pages/matriculas/MatriculaDetallePage.tsx`
- `src/components/matriculas/DocumentosCarga.tsx`

