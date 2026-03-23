

## Plan: Filtrar matrículas ya vinculadas a facturas anteriores

### Problema
Al crear una nueva factura, el listado de matrículas disponibles muestra todas las del grupo, incluyendo las que ya están vinculadas a facturas previas, permitiendo duplicación.

### Solución
En `GrupoCarteraDetallePage.tsx`, calcular las matrículas ya vinculadas a facturas existentes y pasar solo las disponibles al dialog de creación.

### Cambio único: `src/pages/cartera/GrupoCarteraDetallePage.tsx`

1. Crear un `useMemo` que recopile todos los `matriculaIds` ya asignados en las facturas existentes del grupo.
2. Filtrar `matriculasGrupo` para excluir esas matrículas ya vinculadas.
3. Pasar el listado filtrado como prop `matriculas` a `CrearFacturaDialog`.

```text
// Pseudocódigo del cambio
const matriculasYaFacturadas = new Set(facturas.flatMap(f => f.matriculaIds));
const matriculasDisponibles = matriculasGrupo.filter(m => !matriculasYaFacturadas.has(m.id));

// En el JSX:
<CrearFacturaDialog matriculas={matriculasDisponibles} ... />
```

Un solo archivo modificado, ~5 líneas de código.

