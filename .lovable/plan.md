

## Ordenamiento por defecto y sort interactivo en columnas

### Problema

Los registros nuevos aparecen al final de la tabla. No existe funcionalidad de ordenamiento (sort) en ninguna columna.

### Solucion

Agregar logica de ordenamiento al componente `DataTable` con sort por defecto en `createdAt` descendente, y headers clicables con indicador visual de direccion en columnas marcadas como ordenables.

### Cambios por archivo

**1. `src/components/shared/DataTable.tsx`**

Ampliar la interfaz `Column<T>` con propiedades opcionales de sort:

```
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;           // campo real del objeto (si difiere de key)
  sortValue?: (item: T) => string | number;  // extractor custom
}
```

Agregar props al `DataTable`:

| Prop | Tipo | Default | Descripcion |
|---|---|---|---|
| `defaultSortKey` | `string` | `"createdAt"` | Columna de sort inicial |
| `defaultSortDirection` | `"asc" \| "desc"` | `"desc"` | Direccion inicial |

Logica interna:
- Estado: `sortKey` y `sortDirection` (`asc`/`desc`).
- Antes de renderizar, ordenar `data` usando el `sortValue` custom si existe, o accediendo al campo via `sortKey` / `column.key`.
- Para fechas (strings ISO), comparar directamente como strings.
- Para strings generales, usar `localeCompare`.
- Para numeros, comparar numericamente.

Header interactivo:
- Columnas con `sortable: true` muestran un icono `ArrowUpDown` (sin sort activo), `ArrowUp` o `ArrowDown` (con sort activo).
- Click en header alterna: sin sort -> desc -> asc -> desc.
- Cursor pointer solo en headers ordenables.

**2. `src/pages/personas/PersonasPage.tsx`**

- Agregar `sortable: true` a columnas: `numeroDocumento`, `nombre` (con `sortValue` que concatene nombres+apellidos), `sector`, `email`, `genero`, `nivelEducativo`, `fechaNacimiento`.
- Pasar `defaultSortKey="createdAt"` y `defaultSortDirection="desc"` al `DataTable`.

**3. `src/pages/matriculas/MatriculasPage.tsx`**

- Agregar `sortable: true` a columnas: `fechaCreacion`, `empresa`, `asistente`, `fechaArl`, `fechaExamen`, `estadoDocumental`, `estadoFinanciero`.
- `fechaCreacion` usa `sortValue` que extraiga `createdAt` del objeto.
- Pasar `defaultSortKey="createdAt"` y `defaultSortDirection="desc"`.

**4. `src/components/cursos/CursosListView.tsx`**

- Agregar `sortable: true` a columnas: `curso` (con `sortValue` que use el label), `entrenador`, `fechas` (con `sortValue` que use `fechaInicio`), `duracion`, `estado`.
- Pasar `defaultSortKey="createdAt"` y `defaultSortDirection="desc"`.

### Comportamiento

- Al cargar cualquier tabla, los registros se muestran ordenados por fecha de creacion descendente (mas reciente primero).
- El usuario puede hacer clic en cualquier header con icono de sort para cambiar el ordenamiento.
- El indicador visual (flecha) muestra la direccion activa.
- El sort se aplica sobre los datos ya filtrados, antes de renderizar.
- La columna `actions` y el checkbox nunca son ordenables.

