

## Plan: Unificar `tipoCursoKeys` y `nivelFormacionIds` — eliminar redundancia

### Contexto

Como confirmamos, "tipo de curso" y "nivel de formación" son la misma entidad. El campo `tipoCursoKeys` es redundante con `nivelFormacionIds`. Actualmente el scope solo usa `nivelFormacionIds` (los mocks ya tienen `tipoCursoKeys: []` vacío), pero el campo sigue existiendo en tipos, store, schema y servicios, generando confusión.

### Cambios

**1. Eliminar `tipoCursoKeys` del tipo** — `src/types/formatoFormacion.ts`
- Quitar `tipoCursoKeys: TipoFormacion[]` de `FormatoFormacion`
- Actualizar comentario de `nivelFormacionIds` para que sea claro: "IDs de niveles de formación cuando scope = nivel_formacion"

**2. Eliminar del store** — `src/stores/useFormatoEditorStore.ts`
- Quitar `tipoCursoKeys` de `FormatoConfig` y del estado inicial

**3. Eliminar del schema** — `src/schemas/formatoSchema.ts`
- Quitar `tipoCursoKeys` de `formatoConfigSchema`

**4. Eliminar del editor** — `src/pages/formatos/FormatoEditorPage.tsx`
- Quitar referencias a `tipoCursoKeys` en la carga y guardado

**5. Actualizar servicio** — `src/services/formatoFormacionService.ts`
- Quitar `tipoCursoKeys` de los mocks
- Actualizar filtrado en `getForMatricula` para usar solo `nivelFormacionIds`

**6. Actualizar portal estudiante** — `src/services/portalEstudianteService.ts`
- La línea que filtra por `f.tipoCursoKeys.includes(curso.tipoFormacion)` debe cambiar a `f.nivelFormacionIds.includes(nivelId)` (traduciendo `tipoFormacion` del curso al ID de nivel correspondiente)

**7. Actualizar regla de negocio** — `Docs/REGLAS_NEGOCIO_v2.md`
- RN-FMT-009: "Los formatos se asignan por alcance: `todos` (aplica a todos los niveles de formación) o `nivel_formacion` (solo a los niveles seleccionados via `nivelFormacionIds`). No existe un scope separado por 'tipo de curso' ya que ambos conceptos son equivalentes."

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/types/formatoFormacion.ts` | Eliminar `tipoCursoKeys` |
| `src/stores/useFormatoEditorStore.ts` | Eliminar `tipoCursoKeys` del tipo y defaults |
| `src/schemas/formatoSchema.ts` | Eliminar `tipoCursoKeys` |
| `src/pages/formatos/FormatoEditorPage.tsx` | Eliminar referencias |
| `src/services/formatoFormacionService.ts` | Eliminar de mocks |
| `src/services/portalEstudianteService.ts` | Migrar filtro a `nivelFormacionIds` |
| `Docs/REGLAS_NEGOCIO_v2.md` | Actualizar RN-FMT-009 |

