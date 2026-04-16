
## Análisis

Reviso la captura y el código:

1. **Tamaño del adjunto**: El `FileDropZone` actual ocupa ~150px de alto con padding generoso (`p-6` o similar) e ícono grande. Se ve desproporcionado para este contexto donde solo se suben capturas pequeñas.

2. **Orden actual** en `CursoDetallePage`: necesito confirmar dónde está hoy `MinTrabajoCard` vs `EnrollmentsTable` para reordenar.
<lov-tool-use id="toolu_vrtx_01CJNoQzkh3cDgPCn3fLq2uc" name="code--search_files" integration-id="code" data="{\"query\": \"MinTrabajoCard|EnrollmentsTable\", \"include_patterns\": \"src/pages/cursos/CursoDetallePage.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Hgy9JvFFNuub3nuDzi7oYe" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/shared/FileDropZone.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01XbhKhkkFQMxnvfBUG6VbT3" name="code--search_files" integration-id="code" data="{\"query\": \"MinTrabajoCard|EnrollmentsTable\", \"include_patterns\": \"src/pages/cursos/CursoDetallePage.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EHBbrxXfcY7psxj7CHwaRz" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/shared/FileDropZone.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_016NUfqZFJoWFMx2iDKRobSS" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/cursos/CursoDetallePage.tsx\", \"lines\": \"140-200\"}">
</lov-tool-use>
<lov-plan>

## Cambios

### 1. Mover sección "Registro MinTrabajo" debajo de "Estudiantes Inscritos"

En `src/pages/cursos/CursoDetallePage.tsx`, reordenar los componentes:

```
1. CourseInfoCard
2. EnrollmentsTable        ← antes era MinTrabajo
3. MinTrabajoCard          ← ahora va aquí (mantiene el ref para scroll)
4. CourseStatsChips
5. CourseObservations
```

El `ref={minTrabajoRef}` se mantiene para que el botón "Ir a MinTrabajo" del diálogo de cierre siga funcionando.

### 2. Hacer el componente de adjuntos más sutil

En `src/components/cursos/AdjuntosMinTrabajoSection.tsx`, reducir el tamaño visual de la zona de carga:

- Usar `FileDropZone` en modo **`compact`** (botón outline pequeño en vez de drop zone grande de 6 niveles de padding).
- Etiqueta breve: *"Subir archivos (PDF/JPG/PNG)"*.
- Mover el hint *"Máx. 5 MB · Hasta 10 archivos"* a una línea pequeña al lado del contador `X / 10 archivos`, no debajo.
- Quitar el mensaje *"Aún no hay archivos adjuntos"* (innecesario cuando ya hay un botón compacto).
- Reducir padding del contenedor (de `space-y-3` a `space-y-2`).

**Antes (visible en screenshot):** zona de drop de ~150px de alto con icono de upload grande, label, hint y borde punteado.

**Después:** una sola fila con el botón compacto + contador a la derecha + lista de archivos debajo si los hay.

### 3. Sin cambios en lógica

- Límite de 10 archivos, 5 MB, validación, signed URLs, vista previa inline, eliminación: todo se conserva.
- En `AddFechaMinTrabajoDialog.tsx` ya usaba `FileDropZone` directamente — no se toca para mantener visibilidad clara durante la creación de fecha (donde sí tiene sentido el drop zone grande porque es un dialog dedicado).

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/cursos/CursoDetallePage.tsx` | Reordenar: EnrollmentsTable antes de MinTrabajoCard |
| `src/components/cursos/AdjuntosMinTrabajoSection.tsx` | `FileDropZone` en modo `compact`, layout más sutil |

## Resultado esperado

- "Registro MinTrabajo" aparece debajo de "Estudiantes Inscritos".
- La sección de adjuntos ocupa ~40px en lugar de ~180px cuando está vacía.
- Al subir archivos, la lista compacta sigue mostrándose igual (ya era pequeña).
- Toda la funcionalidad existente intacta (drag & drop disponible vía dialog de fecha adicional).

