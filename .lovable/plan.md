

## Plan: Cambiar Tarifas Especiales de "por curso" a "por nivel de formación"

### Contexto

Actualmente las tarifas se asocian a cursos individuales (`cursoId`, `cursoNombre`). Esto no tiene sentido de negocio: la tarifa negociada aplica al **tipo/nivel de formación** (ej. "Trabajador Autorizado"), no a un curso específico. Se debe migrar a `nivelFormacionId` + `nivelFormacionNombre`.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/types/empresa.ts` | Reemplazar `cursoId`/`cursoNombre` por `nivelFormacionId`/`nivelFormacionNombre` en `TarifaEmpresa` |
| `src/data/mockEmpresas.ts` | Actualizar mocks con IDs de niveles de formación en vez de cursos |
| `src/pages/empresas/EmpresaDetallePage.tsx` | Cambiar el Combobox de "cursos" a "niveles de formación" usando `useNivelesFormacion()`, renombrar estados y labels |
| `src/services/empresaService.ts` | Actualizar imports (el servicio ya es genérico, solo ajustar tipos) |
| `src/hooks/useEmpresas.ts` | Sin cambios (ya es genérico) |

### Detalle

**Tipo** — `TarifaEmpresa`:
```typescript
// Antes
cursoId: string;
cursoNombre: string;

// Después
nivelFormacionId: string;
nivelFormacionNombre: string;
```

**Mock** — usar niveles existentes (`nf1`, `nf2`, etc.) con sus nombres.

**UI** — En `EmpresaDetallePage.tsx`:
- Reemplazar `useCursos()` por `useNivelesFormacion()` para las opciones del Combobox
- Renombrar estado `tarifaCursoId` → `tarifaNivelId`
- Columna de tabla: "Curso" → "Nivel de Formación"
- Label del dialog: "Curso" → "Nivel de Formación"
- Placeholder: "Seleccionar nivel..." / "Buscar nivel..."

