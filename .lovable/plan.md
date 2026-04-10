

# Plan: Corregir 4 bugs en el registro MinTrabajo de cursos

## Diagnóstico

### Bug 1: Estado "Pendiente para cierre" no se actualiza
**Causa raíz**: `mapCursoRow()` (línea 57-59 de `cursoService.ts`) siempre asigna `minTrabajoRegistro: undefined`, `minTrabajoResponsable: undefined` y `minTrabajoFechaCierrePrincipal: undefined`, ignorando los datos guardados en el campo `observaciones` (donde se almacenan como JSON). La función `getById` los carga correctamente después, pero `getAll()` y otras llamadas no lo hacen, y el badge en `MinTrabajoCard` evalúa `hasMissing = !curso.minTrabajoRegistro || !curso.minTrabajoFechaCierrePrincipal` que siempre resulta `true`.

### Bug 2: Fecha adicional se guarda un día antes
**Causa raíz**: En `MinTrabajoCard.tsx` línea 125, `new Date(f.fecha)` donde `f.fecha` es `"2025-04-08"` (ISO date sin hora) crea un Date en UTC midnight, que al mostrarse en zona horaria Colombia (UTC-5) retrocede al día anterior. El mismo problema ocurre en `AddFechaMinTrabajoDialog` al enviar la fecha. Se debe usar `parseLocalDate()` de `dateUtils.ts` en lugar de `new Date()`.

### Bug 3: No se puede editar la fecha adicional
No existe funcionalidad de edición para fechas adicionales; solo hay agregar y eliminar. Se necesita un flujo de edición.

### Bug 4: "Por:" sin contexto claro
Línea 127 muestra `Por: {f.createdBy}` pero `createdBy` siempre es `''` (línea 102 de `cursoService.ts` lo asigna vacío). Además, la etiqueta "Por:" es ambigua. Se debe resolver el nombre del usuario que creó la fecha y mejorar la etiqueta.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/services/cursoService.ts` | **mapCursoRow**: parsear `row.observaciones` como JSON y extraer `minTrabajoRegistro`, `minTrabajoResponsable`, `minTrabajoFechaCierrePrincipal`. **getById**: al mapear fechas adicionales, resolver `created_by` UUID al nombre desde `perfiles`. **agregarFechaAdicional**: enviar `created_by: (await supabase.auth.getUser()).data.user?.id` en el insert. |
| `src/components/cursos/MinTrabajoCard.tsx` | Reemplazar `new Date(f.fecha)` por `parseLocalDate(f.fecha)` para evitar desfase de timezone. Cambiar label "Por:" a "Agregada por:" con el nombre del usuario. Agregar botón de edición junto al de eliminar, con un diálogo inline para modificar fecha y motivo. |
| `src/components/cursos/AddFechaMinTrabajoDialog.tsx` | Reutilizar como diálogo de edición: aceptar prop opcional `fechaEditar` para precargar valores y llamar a un nuevo método `editarFechaAdicional` del servicio. |
| `src/services/cursoService.ts` | Agregar método `editarFechaAdicional(cursoId, fechaId, data)` que haga `update` en `cursos_fechas_mintrabajo`. |
| `src/hooks/useCursos.ts` | Agregar mutation `useEditarFechaAdicional`. |

**Total: 4 archivos editados, 0 migraciones**

