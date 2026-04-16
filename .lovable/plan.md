

## Diagnóstico

**Causa raíz confirmada (vía consulta a BD):**
- `personas` en BD: **3.287 registros activos**
- Vista muestra: máx **1.000**

**Por qué:** PostgREST (la API REST de Supabase) aplica un **límite máximo por defecto de 1000 filas** a cualquier `.select()` que no use paginación explícita. No es un problema del código de Lovable — es un guardrail del servidor para evitar respuestas gigantes.

**Por qué buscar por documento desde matrículas SÍ encuentra a todos:**
- `MatriculaFormPage` usa `personaService.getByDocumento()` que hace `.eq('numero_documento', ...)` → consulta puntual a BD, no afectada por el límite.
- `PersonasPage` filtra **client-side** sobre los 1.000 que ya cargó `getAll()` → los que están en BD pero no llegaron al cliente nunca aparecen ni en la lista ni en el buscador.

**Servicios afectados (mismo patrón `select('*')` sin paginación):**

| Servicio | Filas en BD hoy | ¿Afectado hoy? | ¿Riesgo futuro? |
|---|---|---|---|
| `personaService.getAll()` | 3.287 | **Sí, ahora mismo** | Crítico |
| `empresaService.getAll()` | 546 | No | Sí (al crecer) |
| `matriculaService.getAll()` | 1 | No | Sí |
| `cursoService.getAll()` | 2 | No | Sí |
| `certificadoService.getAll()` | 0 | No | Sí |
| `personalService.getAll()` | 3 | No | Bajo |
| `nivelFormacionService.getAll()` | pocos | No | Bajo |
| `plantillaService.getAll()` | pocos | No | Bajo |
| `excepcionCertificadoService.getAll()` | pocos | No | Bajo |
| `rolesService.getAll()` | pocos | No | Bajo |

También `personaService.search()` y `empresaService.search()` tienen el mismo techo de 1000 → registros recientes pueden no aparecer en el buscador.

`checkExisting()` ya está bien (chunkea de a 500 con `.in()`).

## Solución

Implementar **paginación interna automática** en los `getAll()` y `search()` de los servicios afectados: hacer múltiples requests con `.range(from, to)` en bloques de 1000 hasta agotar los datos. El cliente sigue recibiendo el array completo (transparente para hooks, tablas, exports).

### Helper centralizado

Nuevo archivo `src/services/_paginated.ts`:

```ts
// Ejecuta un select paginado en bloques de 1000 hasta traer todo
export async function fetchAllPaginated<T>(
  buildQuery: (from: number, to: number) => any,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break; // última página
    from += pageSize;
  }
  return all;
}
```

### Patrón de uso en cada servicio

Reemplazar:
```ts
const { data, error } = await supabase.from('personas').select('*').is('deleted_at', null).order('nombres');
```
por:
```ts
const data = await fetchAllPaginated<any>((from, to) =>
  supabase.from('personas').select('*').is('deleted_at', null).order('nombres').range(from, to)
);
```

### Servicios a actualizar

| Archivo | Métodos a paginar |
|---|---|
| `src/services/personaService.ts` | `getAll`, `search` |
| `src/services/empresaService.ts` | `getAll`, `search` |
| `src/services/matriculaService.ts` | `getAll`, `getByPersonaId` |
| `src/services/cursoService.ts` | `getAll` |
| `src/services/certificadoService.ts` | `getAll` |
| `src/services/personalService.ts` | `getAll`, `getAllCargos` (defensivo) |
| `src/services/carteraService.ts` | listados de grupos/facturas/pagos |

> No tocamos `nivelFormacionService`, `plantillaService`, `rolesService`, `excepcionCertificadoService` — datasets siempre pequeños (<200), pero quedan listos para envolver si crecen.

### Verificación posterior

Tras el cambio, en el módulo Personas:
- El contador inferior (ya implementado con lazy load) mostrará **"Mostrando 100 de 3.287 personas"** en vez de "1.000".
- El buscador encontrará registros recientes porque el dataset filtrado client-side estará completo.
- El lazy render de `DataTable` (ya implementado) sigue intacto: solo renderiza 100 filas en DOM, pero el array fuente ya tiene los 3.287.

### Consideraciones

- **Performance:** 3.287 personas → 4 requests paralelos secuenciales de ~150-300ms = ~1s total. Aceptable; se ejecuta una sola vez al cargar la página y queda en caché de React Query.
- **Memoria:** ~3.000 objetos JSON ligeros = <5MB en memoria. Sin problema.
- **Compatibilidad:** Los hooks (`usePersonas`, `useEmpresas`, etc.), las tablas, exports y bulk actions no requieren cambios — siguen recibiendo `T[]` completo.
- **Sin cambios de schema/RLS/migraciones** — solo client-side.

### Mejora adicional opcional (no en este PR)

Para escala futura (>10.000 registros) se recomendaría:
- Mover búsqueda a server-side (PostgREST query con `.ilike` + `.range`) en lugar de filtrar en cliente.
- Índices `pg_trgm` sobre `numero_documento`, `nombres`, `apellidos` para acelerar `ILIKE`.

Lo dejamos documentado pero no implementamos ahora para no introducir cambios estructurales.

## Resultado esperado

- Personas: ven los 3.287 (y los que entren después).
- Buscador encuentra registros recientes.
- Mismo patrón aplicado preventivamente a empresas, matrículas, cursos, cartera, certificados, personal.
- Cero regresiones en lazy render, bulk actions, exports ni navegación.

