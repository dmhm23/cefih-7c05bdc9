

# Plan: Sincronizar catálogo de documentos del Portal Estudiante con Gestión de Formatos

## Problema actual

El catálogo de documentos del Portal Estudiante (`portal_config_documentos`) permite crear documentos manualmente con clave, nombre y tipo arbitrarios. No está vinculado a la tabla `formatos_formacion`, que ya contiene los formatos reales del sistema (evaluación de reentrenamiento, participación PTA/ATS, etc.).

El usuario necesita que al agregar un documento al portal, se seleccione de una lista de formatos existentes que tengan `visible_en_portal_estudiante = true` y `activo = true`.

## Enfoque

Reemplazar el formulario manual de "Agregar documento" por un selector que consulta `formatos_formacion` filtrando por `visible_en_portal_estudiante = true` y `activo = true`. Al seleccionar un formato, se auto-completan la clave (`formato_id`), nombre, tipo (derivado de categoría) y firma requerida.

## Cambios

### 1. `DocumentoConfigDialog.tsx` — Reemplazar campos manuales por selector de formatos

- Agregar un query con `useFormatos()` (o directo a Supabase) para obtener formatos con `visible_en_portal_estudiante = true` y `activo = true`
- En modo "Agregar" (no editar): mostrar un `Select` o `Combobox` con los formatos disponibles, filtrando los que ya están en el catálogo
- Al seleccionar un formato:
  - `key` = formato.id (UUID)
  - `nombre` = formato.nombre
  - `tipo` = derivado de `formato.categoria` (evaluacion→evaluacion, formacion→formulario, etc.) o `formato.modoDiligenciamiento`
  - `requiereFirma` = `formato.requiereFirmaAprendiz`
- Los campos de nombre y tipo se auto-completan pero permiten ajuste del tipo y firma
- Eliminar el campo de "Clave única" manual
- Mantener: dependencias, habilitación por nivel, orden

### 2. `portalAdminService.ts` — Enriquecer `saveDocumentoConfig` 

- Al guardar, almacenar el `formato_id` como referencia en `portal_config_documentos` (actualmente usa campo `key` que puede ser el formato ID)
- Sin cambios estructurales mayores, el campo `key` almacenará el ID del formato

### 3. `DocumentosCatalogoTable.tsx` — Ajuste menor

- Sin cambios estructurales, los documentos ya se muestran por nombre

### 4. Migración SQL (opcional pero recomendada)

- Agregar columna `formato_id UUID REFERENCES formatos_formacion(id)` a `portal_config_documentos` para mantener la referencia formal
- Esto permite que si un formato cambia de nombre, el catálogo se actualice automáticamente

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| 1 migración SQL | Agregar `formato_id` a `portal_config_documentos` |
| `DocumentoConfigDialog.tsx` | Reemplazar form manual por selector de formatos |
| `portalAdminService.ts` | Guardar `formato_id` en la referencia |
| `DocumentosCatalogoTable.tsx` | Ajuste menor de labels si aplica |

