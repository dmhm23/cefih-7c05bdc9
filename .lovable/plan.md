

# Diagnóstico: Dependencias de datos mock en la plataforma

## Hallazgos

Se encontraron **7 archivos de producción** que aún importan datos desde archivos mock (`@/data/mockData`, `@/data/mockCartera`, `@/data/mockDashboard`):

### Grupo 1: `mockNivelesFormacion` desde `mockData.ts` (3 archivos)

| Archivo | Uso | Reemplazo |
|---------|-----|-----------|
| `src/utils/resolveNivelLabel.ts` | Busca niveles por ID/nombre para resolver labels | Consultar tabla `niveles_formacion` via Supabase (con cache) |
| `src/components/portal-admin/NivelesHabilitacionGrid.tsx` | Lista IDs de niveles para columnas de la grilla | Recibir niveles como prop o consultar DB |
| `src/components/portal-admin/DocumentoConfigDialog.tsx` | Lista IDs de niveles para checkboxes de habilitación | Recibir niveles como prop o consultar DB |

### Grupo 2: `mockGruposCartera` desde `mockCartera.ts` (1 archivo)

| Archivo | Uso | Reemplazo |
|---------|-----|-----------|
| `src/pages/matriculas/MatriculasPage.tsx` | Busca grupo de cartera por matrícula para mostrar estado financiero | Consultar tabla `grupos_cartera` con join a `facturas` via Supabase |

### Grupo 3: `mockDashboard.ts` (3 archivos) — PARCIALMENTE MIGRADO

| Archivo | Uso | Estado |
|---------|-----|--------|
| `src/pages/Dashboard.tsx` | `fetchDashboardStats` | Ya usa RPCs de Supabase (el archivo se llama "mock" pero las funciones consultan DB). **Solo renombrar.** |
| `src/components/dashboard/DashboardCharts.tsx` | Tipos + `fetchDashboardCharts` | Igual — ya usa RPCs. **Solo renombrar.** |
| `src/components/dashboard/TodoWidget.tsx` | `loadTodos/saveTodos` (localStorage) | Diseño intencional (localStorage). **Solo renombrar.** |

### Error TS actual

Los errores de build (`"universitario"` / `"bachiller"`) vienen de `mockData.ts` líneas 21, 63, 101+ donde los mock de personas aún tienen esos valores legacy. Estos datos mock ya no se usan en producción (los servicios consultan Supabase), pero el archivo se importa por `mockNivelesFormacion`, lo que obliga a que compile.

## Plan de implementación

### Paso 1: Corregir errores TS inmediatos en `mockData.ts`
- Reemplazar todas las instancias de `"universitario"` → `"profesional"` y `"bachiller"` → `"secundaria"` en el archivo (el reemplazo previo no se aplicó correctamente)

### Paso 2: Extraer `mockNivelesFormacion` a un hook de Supabase
- Crear o actualizar `useNivelesFormacion` para que exporte también una función síncrona de cache
- Modificar `resolveNivelLabel.ts` para que use la tabla `niveles_formacion` de Supabase en lugar del array mock
- Modificar `NivelesHabilitacionGrid.tsx` y `DocumentoConfigDialog.tsx` para recibir niveles desde el hook

### Paso 3: Eliminar `mockGruposCartera` de `MatriculasPage.tsx`
- La función `getEstadoCartera()` debe consultar la tabla `grupos_cartera` (ya existe en DB) via el hook `useCartera` o una query directa

### Paso 4: Renombrar `mockDashboard.ts` → `dashboardData.ts`
- Renombrar el archivo ya que su contenido es 100% funciones que consultan Supabase RPCs + localStorage
- Actualizar las 3 importaciones en Dashboard, DashboardCharts y TodoWidget

### Paso 5: Limpiar archivos mock no referenciados
- Verificar si `mockData.ts`, `mockCartera.ts`, `mockEmpresas.ts`, `mockCertificados.ts` tienen otros consumidores
- Si ya no los tienen (post pasos 2-3), eliminarlos o marcarlos como deprecated

## Archivos afectados

| Paso | Archivos |
|------|----------|
| 1 | `src/data/mockData.ts` (fix TS errors) |
| 2 | `src/utils/resolveNivelLabel.ts`, `NivelesHabilitacionGrid.tsx`, `DocumentoConfigDialog.tsx`, `useNivelesFormacion.ts` |
| 3 | `src/pages/matriculas/MatriculasPage.tsx` |
| 4 | Renombrar `mockDashboard.ts` → `dashboardData.ts`, actualizar 3 importadores |
| 5 | Eliminar archivos mock sin consumidores |

**Total: ~10 archivos editados, 0 migraciones SQL (las tablas ya existen)**

