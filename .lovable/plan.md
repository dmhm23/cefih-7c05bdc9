

# Plan: Nivel de Formación como fuente directa en Matrícula

## Problema actual

La tabla `matriculas` no tiene columna `nivel_formacion_id`. El nivel se resuelve indirectamente vía `curso → nivel_formacion_id`, lo que significa que:
- Si no hay curso asignado, no hay nivel → no hay documentos
- El estudiante no puede completar requisitos documentales antes de ser asignado a un curso
- La sincronización depende de que el query del curso haya cargado

## Cambio conceptual

Agregar `nivel_formacion_id` directamente a la tabla `matriculas` como la **fuente de verdad** para requisitos documentales. El curso sigue siendo una asignación operativa independiente.

## Cambios propuestos

### 1. Migración de base de datos

Agregar columna `nivel_formacion_id UUID` a `matriculas`. Poblar las matrículas existentes con el nivel de su curso actual:

```sql
ALTER TABLE public.matriculas ADD COLUMN nivel_formacion_id UUID;

-- Backfill desde cursos existentes
UPDATE public.matriculas m
SET nivel_formacion_id = c.nivel_formacion_id
FROM public.cursos c
WHERE m.curso_id = c.id AND c.nivel_formacion_id IS NOT NULL;
```

### 2. Formulario de creación de matrícula

**Archivo**: `src/pages/matriculas/MatriculaFormPage.tsx`

- Agregar campo **Nivel de Formación** (obligatorio) al formulario, antes del campo de curso
- Al seleccionar un nivel, filtrar los cursos disponibles a los que correspondan a ese nivel
- Guardar `nivel_formacion_id` directamente en la matrícula
- Cuando se selecciona un curso, auto-rellenar el nivel si está vacío

### 3. Hook de creación

**Archivo**: `src/hooks/useMatriculas.ts`

- En `useCreateMatricula`, usar `data.nivelFormacionId` directamente (no resolver desde curso)
- Pasar ese ID a `crearDocumentosMatricula`

### 4. Sincronización en vistas de detalle

**Archivos**: `MatriculaDetallePage.tsx`, `MatriculaDetailSheet.tsx`

- Cambiar `curso?.nivelFormacionId` → `matricula.nivelFormacionId` en el `useEffect` de sincronización
- Eliminar la dependencia de esperar a que cargue el curso
- Sincronización inmediata al cargar la matrícula

### 5. Tipos TypeScript

**Archivo**: `src/types/matricula.ts`

- Agregar `nivelFormacionId?: string` a la interfaz `Matricula`

### 6. Servicio de matrícula

**Archivo**: `src/services/matriculaService.ts`

- Incluir `nivel_formacion_id` en las operaciones de lectura/escritura

### 7. MatriculaDetailSheet (panel lateral)

**Archivo**: `src/components/matriculas/MatriculaDetailSheet.tsx`

- Agregar sincronización de documentos usando `matricula.nivelFormacionId`
- Cargar documentos individuales via `useMatricula(id)` en vez de depender de la lista

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar columna `nivel_formacion_id` + backfill |
| `src/types/matricula.ts` | Agregar campo `nivelFormacionId` |
| `src/services/matriculaService.ts` | Incluir campo en lectura/escritura |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Campo de nivel de formación obligatorio |
| `src/hooks/useMatriculas.ts` | Usar `nivelFormacionId` directo |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Sincronizar con `matricula.nivelFormacionId` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Agregar sync + mostrar documentos |

## Impacto

- `DocumentosCarga.tsx`, `documentoService.ts`, storage: sin cambios
- La función `get_formatos_for_matricula` ya tiene fallback por `empresa_nivel_formacion`, ahora también podrá usar `nivel_formacion_id` directo
- Las matrículas existentes se llenan automáticamente via backfill en la migración

