

# Plan: Corregir elegibilidad de certificados y confirmaciones de cartera

## Problema

1. `evaluarElegibilidad()` solo valida `pagado` (booleano) y documentos. No valida estado de cartera ni formatos de formación completados.
2. No hay confirmación al generar certificados cuando la cartera está pendiente/sin facturar.
3. El badge "Listo para certificar" cambia color en hover (comportamiento por defecto de `Badge`).
4. No se validan los formatos de formación completados (la función tiene un `// Future: validate` vacío).

## Cambios

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `src/utils/certificadoGenerator.ts` | Ampliar `evaluarElegibilidad` para recibir `carteraStatus` y `formatosCompletados` como parámetros. Agregar validación de documentos, cartera (`pagado` es el único estado "limpio") y formatos (comparar respuestas completadas vs formatos requeridos). Separar motivos de cartera como "advertencias" (permiten generar con confirmación) vs "bloqueos" (documentos/formatos, impiden generar). |
| 2 | `src/components/cursos/EnrollmentsTable.tsx` | Pasar `carteraStatus` y datos de formatos a `evaluarElegibilidad`. Agregar estado intermedio "advertencia_cartera" que muestra badge "Pendiente de cartera" en vez de "Listo para certificar". Al hacer clic en generar individual con cartera pendiente, mostrar `ConfirmDialog` con el mensaje solicitado. Para generación masiva, filtrar estudiantes con cartera pendiente y mostrar listado antes de proceder. Quitar hover del badge "Listo para certificar" con `hover:bg-blue-500/15` explícito. |
| 3 | `src/components/cursos/EnrollmentsTable.tsx` | Consultar `formato_respuestas` para las matrículas del curso y los formatos asignados al nivel, para determinar si cada estudiante completó todos los formatos requeridos. Usar `useFormatosMatricula` o query directa. |
| 4 | `src/components/cursos/GeneracionMasivaDialog.tsx` | Agregar un paso previo de confirmación cuando hay estudiantes con cartera pendiente: listar los afectados con su estado de cartera (usando las etiquetas de `StatusBadge`) y botones "Sí, generar certificados" / "Cancelar". |

## Detalle de la nueva elegibilidad

```typescript
interface ElegibilidadResult {
  elegible: boolean;        // true solo si todo está OK
  advertenciaCartera: boolean; // cartera no pagada pero no es bloqueo duro
  motivos: string[];        // bloqueos duros (docs, formatos)
  motivosCartera: string[]; // advertencias de cartera
}

// Bloqueos duros (impiden generar):
// - Documentos obligatorios pendientes
// - Formatos de formación no completados

// Advertencias (permiten generar con confirmación):
// - Cartera sin_facturar, facturado, abonado, vencido, por_pagar
```

## Badge sin hover

Reemplazar el badge "Listo para certificar" para que use clases estáticas sin transición hover:
```tsx
<Badge className="bg-blue-500/15 text-blue-700 border-blue-200 hover:bg-blue-500/15 text-xs cursor-default">
```

## Flujo individual con cartera pendiente

Al hacer clic en "Generar certificado" si `advertenciaCartera === true`:
- Mostrar `ConfirmDialog` con mensaje: "Este estudiante tiene la cartera pendiente o sin facturar. ¿Desea generar el certificado de todas formas?"
- Botones: "Sí, generar certificado" / "Cancelar"

## Flujo masivo con cartera pendiente

Antes de ejecutar la generación masiva, filtrar los seleccionados que tienen `advertenciaCartera`. Si hay alguno:
- Mostrar diálogo previo listando cada estudiante afectado con su estado de cartera (label del `StatusBadge`).
- Mensaje: "Los siguientes estudiantes tienen la cartera pendiente, sin facturar o con pagos incompletos. ¿Desea generar los certificados de todas formas?"
- Botones: "Sí, generar certificados" / "Cancelar"
- Si confirma, procede con la generación (excluyendo los que tienen bloqueos duros).

## Validación de formatos de formación

Consultar `formato_respuestas` por `matricula_id` con estado `completado` y comparar contra los formatos asignados al nivel del curso (vía `get_formatos_for_matricula` o similar). Si faltan formatos por completar, agregar motivo "Formatos de formación incompletos" como bloqueo duro.

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `src/utils/certificadoGenerator.ts` | Ampliar `evaluarElegibilidad` con cartera y formatos |
| `src/components/cursos/EnrollmentsTable.tsx` | Integrar nueva elegibilidad, confirmaciones, badges sin hover, consulta de formatos |
| `src/components/cursos/GeneracionMasivaDialog.tsx` | Agregar paso de confirmación previo para cartera |

**Total: 3 archivos editados, 0 migraciones**

