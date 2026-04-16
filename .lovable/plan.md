

## Análisis

**Situación actual:**
- `DataTable` recibe `data: T[]` ya filtrado/ordenado en el padre y renderiza **todas** las filas en el DOM de una vez.
- Con 2000+ registros (típico tras importar personas), el navegador renderiza miles de `<TableRow>` simultáneos → primera pintura lenta, scroll con saltos, interacciones bloqueadas.
- El contador inferior ya muestra `data.length` (total filtrado), eso se conserva.

**Importante:** los datos ya vienen completos del hook (`usePersonas`, `useCursos`, etc.) y se filtran/ordenan client-side. **No vamos a paginar el fetch** — vamos a hacer **virtualización por scroll** (renderizar progresivamente solo los registros visibles). Esto:
- Mantiene búsqueda, filtros, orden, selección masiva y exports funcionando sobre el dataset completo.
- Evita reescribir hooks, RLS y endpoints.
- Da el efecto "cargar 100 por scroll" que pediste.

## Solución

Implementar **lazy render incremental** dentro de `DataTable.tsx`:

1. **Estado interno** `visibleCount` que arranca en `PAGE_SIZE = 100`.
2. **IntersectionObserver** sobre una fila centinela colocada al final del `<tbody>`. Cuando entra al viewport del contenedor scrolleable, suma `+100` al `visibleCount`.
3. **Slice** del array ordenado: `sortedData.slice(0, visibleCount)` es lo único que se renderiza.
4. **Reset** del `visibleCount` cuando cambia el filtro/búsqueda (detectado por cambio en `data.length` o referencia) y cuando cambia el orden, para que al re-ordenar/filtrar arranque de nuevo desde el inicio.
5. **Indicador visual** de "Cargando más..." en la fila centinela mientras quedan registros por mostrar.

## Cambios en el contador inferior

Texto actualizado para diferenciar visibles vs totales:

```
Mostrando 100 de 2.547 personas
```

Cuando ya están todos cargados:

```
2.547 personas
```

Formato con separador de miles (`toLocaleString('es-CO')`).

## Detalle UI del centinela

Última fila del `<tbody>` (cuando `visibleCount < total`):

```
┌────────────────────────────────────────────┐
│         ⟳  Cargando más registros...       │   ← se autoexpande al hacer scroll
└────────────────────────────────────────────┘
```

Usa `IntersectionObserver` con `root` apuntando al div scrolleable de la tabla (`overflow-auto h-full`) y `rootMargin: "200px"` para precargar antes de llegar al fondo (scroll fluido sin parpadeo).

## Comportamiento con interacciones existentes

| Acción | Comportamiento |
|---|---|
| Búsqueda/filtro/orden | Resetea `visibleCount` a 100 |
| Selección masiva ("seleccionar todos") | Sigue marcando **todos** los IDs del dataset filtrado, no solo los visibles |
| Bulk actions | Operan sobre todos los seleccionados (no solo los renderizados) |
| Click en "Ver" | Funciona igual; navegación prev/next sigue usando el array completo |
| Exportar | Exporta el dataset completo filtrado |
| Sticky header | Conservado (ya está implementado) |

## Configuración

Constante exportada en `DataTable.tsx`:

```ts
const PAGE_SIZE = 100; // lazy load chunk
```

Prop opcional `pageSize` por si alguna tabla específica quiere otro valor.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/shared/DataTable.tsx` | Añadir `visibleCount` + `IntersectionObserver` + fila centinela + slice de `sortedData` + actualizar texto del contador inferior |

**No requiere cambios en:** páginas (`PersonasPage`, `EmpresasPage`, `MatriculasPage`, `CursosListView`, `NivelesPage`, `FormatosPage`, `CarteraPage`, `GestionPersonalPage`) — todas usan `DataTable` y heredan la mejora automáticamente.

## Resultado esperado

- 2000 registros: pintura inicial **<150ms** (vs varios segundos hoy)
- Scroll fluido a 60fps
- Contador siempre visible: `Mostrando X de Y registros`
- Compatible con todas las tablas existentes sin regresiones

