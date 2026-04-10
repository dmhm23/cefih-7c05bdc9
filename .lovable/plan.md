

# Plan: Mostrar formatos en estado "borrador" en las matrículas

## Diagnóstico

En `formatoFormacionService.getForMatricula()` (línea 177), la consulta incluye `.eq('estado', 'activo')`, lo que excluye cualquier formato con `estado = 'borrador'`. 

El badge "Borrador/Completo" que se muestra en la lista de formatos de una matrícula NO corresponde al estado del formato como plantilla, sino al estado de diligenciamiento del formato por el estudiante (calculado por `resolveFormatoEstado`). Por lo tanto, un formato en estado `borrador` (aún no publicado oficialmente) debería poder mostrarse en la matrícula si cumple las demás condiciones (`activo = true`, `visible_en_matricula = true`).

La misma restricción existe en la función de base de datos `get_formatos_for_matricula`, que también filtra `f.estado = 'activo'`.

## Cambio

| Archivo / Recurso | Cambio |
|---|---|
| `src/services/formatoFormacionService.ts` | Línea 177: reemplazar `.eq('estado', 'activo')` por `.in('estado', ['activo', 'borrador'])` para incluir formatos en ambos estados. |
| Función SQL `get_formatos_for_matricula` | Cambiar `f.estado = 'activo'` por `f.estado IN ('activo', 'borrador')` para mantener consistencia con el servicio del frontend. Se actualiza vía migración. |

**Total: 1 archivo editado, 1 migración**

