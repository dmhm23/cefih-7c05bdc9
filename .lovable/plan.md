

# Plan: Filtros dinámicos en el módulo de Matrículas

## Contexto actual

La página `MatriculasPage.tsx` tiene solo 2 filtros estáticos (Estado Documental y Estado de Cartera) definidos en `filterConfigs`. Se necesitan 3 filtros adicionales que reflejen datos reales del sistema:
- **Tipo de Vinculación**: empresa, independiente, ARL, sin asignación
- **Nivel de Formación**: lista dinámica desde la tabla `niveles_formacion`
- **Estado de Curso**: si la matrícula tiene curso asignado o no

## Cambios

### Archivo único: `src/pages/matriculas/MatriculasPage.tsx`

**1. Importar el hook de niveles**
Agregar `useNivelesFormacion` para obtener la lista de niveles en tiempo real.

**2. Agregar estado inicial de filtros**
Extender el estado `filters` con las 3 claves nuevas: `tipoVinculacion`, `nivelFormacion`, `estadoCurso`, todas inicializadas en `"todos"`.

**3. Construir `filterConfigs` dinámicamente**
En vez de un array constante, construir `filterConfigs` con un `useMemo` que incluya:

- **Tipo de Vinculación** (select): opciones fijas `sin_asignar`, `empresa`, `independiente`, `arl`
- **Nivel de Formación** (select): opciones generadas dinámicamente desde `useNivelesFormacion().data`, mapeando `id → nombre`. Esto garantiza que cualquier nivel nuevo aparezca automáticamente.
- **Estado de Curso** (select): dos opciones — `asignado` (tiene `cursoId`) y `sin_asignar` (no tiene `cursoId`)
- Los 2 filtros existentes (Estado Documental, Estado de Cartera) se mantienen sin cambios.

**4. Actualizar la lógica de filtrado en `filteredMatriculas`**
Agregar 3 condiciones al `.filter()`:

```text
tipoVinculacion:
  - "sin_asignar" → !m.tipoVinculacion
  - otro valor    → m.tipoVinculacion === valor

nivelFormacion:
  - "todos" → pasa
  - UUID    → m.nivelFormacionId === valor

estadoCurso:
  - "asignado"    → !!m.cursoId
  - "sin_asignar" → !m.cursoId
```

**5. Actualizar `handleClearFilters`**
Agregar las 3 claves nuevas con valor `"todos"` al reset.

## Verificación
- Crear matrículas con distintos tipos de vinculación → verificar que el filtro las segmenta correctamente.
- Crear un nivel de formación nuevo → verificar que aparece en el filtro sin recargar.
- Filtrar por "Sin curso asignado" → solo deben aparecer matrículas sin `cursoId`.
- Combinar múltiples filtros → deben funcionar en conjunto.

## Impacto
- Cambios limitados a un solo archivo (`MatriculasPage.tsx`).
- Sin cambios en BD, servicios, tipos ni otros componentes.
- Los datos se obtienen de hooks existentes (`useNivelesFormacion`, datos ya cargados de matrículas).

