

## Agregar columna "Fecha creación" como primera columna en Cursos

### Cambio

Insertar una nueva columna `fechaCreacion` al inicio del array `DEFAULT_COLUMNS` y su correspondiente definicion en el array `columns`, con formato `dd/MM/yyyy` y ordenamiento habilitado por `createdAt`.

### Archivo: `src/components/cursos/CursosListView.tsx`

**1. DEFAULT_COLUMNS** — Agregar como primera entrada (antes de "curso"):
```
{ key: "fechaCreacion", header: "Fecha Creación", visible: true },
```

**2. Array columns** — Agregar como primera definicion de columna:
```
{
  key: "fechaCreacion",
  header: "Fecha Creación",
  className: "min-w-[120px]",
  sortable: true,
  sortKey: "createdAt",
  render: (c) => format(new Date(c.createdAt), "dd/MM/yyyy"),
},
```

Un solo archivo modificado. La columna sera visible por defecto y ordenable por fecha de creacion.

