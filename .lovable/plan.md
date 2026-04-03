

## Plan: Resolver las 10 inconsistencias técnicas (Sección 16)

### Resumen

Corregir las 10 inconsistencias activas documentadas en REGLAS_NEGOCIO_v3.md, organizadas por prioridad.

---

### INC-001 — Auditoría incompleta

**Problema:** `TipoEntidad` no incluye `empresa`, `formato_formacion`, `tarifa_empresa`, `factura`, `pago`, `grupo_cartera`.

**Solución:**
- Agregar los 6 valores faltantes a `TipoEntidad` en `src/types/audit.ts`
- Agregar llamadas a `mockAuditLogs.push(...)` en los servicios que no registran auditoría: `empresaService.ts`, `formatoFormacionService.ts`, `carteraService.ts` (crear/editar/eliminar facturas, pagos, grupos)

| Archivo | Cambio |
|---|---|
| `src/types/audit.ts` | Ampliar `TipoEntidad` |
| `src/services/empresaService.ts` | Agregar logs de auditoría en create/update/delete |
| `src/services/formatoFormacionService.ts` | Agregar logs de auditoría |
| `src/services/carteraService.ts` | Agregar logs en operaciones de facturas, pagos y grupos |

---

### INC-002 — Duplicidad de datos de empresa en matrícula (sin cambio)

**Problema:** Matrícula almacena campos planos de empresa además de `empresaId`.

**Decisión:** Mantener como está — es un snapshot intencional. Documentar que al editar `empresaId`, se deben re-copiar los campos. No requiere cambio de código en esta fase; se resolverá en backend real.

---

### INC-003 — Datos de cartera duplicados en matrícula (sin cambio)

**Problema:** Campos de cartera (`valorCupo`, `abono`, etc.) existen tanto en matrícula como en el módulo de Cartera.

**Decisión:** Mantener como está — el módulo de Cartera es la fuente de verdad. Los campos en matrícula son legacy. Se resolverá con la migración a backend real. No requiere cambio ahora.

---

### INC-004 — Contacto de emergencia sin validación

**Problema:** `contactoEmergencia` es obligatorio en el tipo TypeScript pero el servicio no lo valida.

**Solución:** Agregar validación en `personaService.create()` y `personaService.update()` — si `contactoEmergencia` no tiene nombre ni teléfono, lanzar `ApiError`.

| Archivo | Cambio |
|---|---|
| `src/services/personaService.ts` | Validar `contactoEmergencia.nombre` y `.telefono` en create/update |

---

### INC-005 — Integridad referencial ausente

**Problema:** Al eliminar persona/empresa/curso/nivel, no se verifican referencias en otras entidades.

**Solución:** Agregar verificaciones en los métodos `delete()` de cada servicio:
- `personaService.delete` → verificar que no tenga matrículas activas
- `empresaService.delete` → verificar que no tenga matrículas o grupos de cartera vinculados
- `cursoService.delete` → verificar que no tenga matrículas
- `nivelFormacionService.delete` → verificar que no tenga cursos vinculados

| Archivo | Cambio |
|---|---|
| `src/services/personaService.ts` | Verificar referencias antes de eliminar |
| `src/services/empresaService.ts` | Verificar referencias antes de eliminar |
| `src/services/cursoService.ts` | Verificar referencias antes de eliminar |
| `src/services/nivelFormacionService.ts` | Verificar referencias antes de eliminar |

---

### INC-006 — Tarifas sin validación de unicidad

**Problema:** Se pueden crear dos tarifas para la misma combinación empresa+curso.

**Solución:** Agregar validación de duplicidad al crear/editar tarifas en `empresaService.ts`.

| Archivo | Cambio |
|---|---|
| `src/services/empresaService.ts` | Validar unicidad empresa+curso al agregar tarifa |

---

### INC-007 — `TipoFormacion` como union abierta

**Problema:** `TipoFormacion = 'jefe_area' | 'trabajador_autorizado' | 'reentrenamiento' | 'coordinador_ta' | string` — el `| string` anula el tipado.

**Solución:** Eliminar `| string` de `TipoFormacion` en `src/types/curso.ts`. Hacer lo mismo con `NivelFormacionEmpresa` en `src/types/matricula.ts` que tiene el mismo problema. Corregir cualquier error de compilación resultante.

| Archivo | Cambio |
|---|---|
| `src/types/curso.ts` | Eliminar `| string` de `TipoFormacion` |
| `src/types/matricula.ts` | Eliminar `| string` de `NivelFormacionEmpresa` |

---

### INC-008 — Campo `matriculaId` genérico en Comentario

**Problema:** El campo `matriculaId` en `Comentario` se usa como ID genérico pero su nombre sugiere solo matrículas.

**Solución:** Renombrar `matriculaId` → `entidadId` en el tipo `Comentario` y actualizar todas las referencias.

| Archivo | Cambio |
|---|---|
| `src/types/comentario.ts` | Renombrar `matriculaId` → `entidadId` |
| `src/services/comentarioService.ts` | Actualizar referencias |
| `src/hooks/useComentarios.ts` | Actualizar referencias |
| `src/components/shared/ComentariosSection.tsx` | Actualizar prop/referencias |
| Cualquier componente que pase `matriculaId` a comentarios | Actualizar prop |

---

### INC-009 — MetodoPago divergente

**Problema:** `MetodoPago` en Cartera tiene 8 valores (ya actualizado), pero `FormaPago` en Matrícula tiene su propia definición.

**Solución:** Eliminar `FormaPago` de `src/types/matricula.ts` y reemplazarlo por una importación de `MetodoPago` desde `src/types/cartera.ts`. Actualizar las referencias.

| Archivo | Cambio |
|---|---|
| `src/types/matricula.ts` | Eliminar `FormaPago`, importar `MetodoPago` de cartera |
| Archivos que importen `FormaPago` | Cambiar a `MetodoPago` |

---

### INC-010 — Empresas inactivas seleccionables

**Problema:** El autocomplete de empresas en matrícula no filtra empresas con `activo: false`.

**Solución:** En el componente de selección de empresa dentro del formulario de matrícula, filtrar `empresas.filter(e => e.activo)`.

| Archivo | Cambio |
|---|---|
| `src/pages/matriculas/MatriculaFormPage.tsx` | Filtrar empresas inactivas en el selector |

---

### Orden de implementación

1. **INC-007** (tipos estrictos) — base para los demás cambios
2. **INC-009** (unificar FormaPago/MetodoPago)
3. **INC-008** (renombrar matriculaId → entidadId)
4. **INC-001** (ampliar auditoría)
5. **INC-004** (validación contacto emergencia)
6. **INC-005** (integridad referencial)
7. **INC-006** (unicidad tarifas)
8. **INC-010** (filtrar empresas inactivas)
9. **INC-002 y INC-003** — sin cambio de código, solo documentar decisión

### Archivos totales afectados: ~15

