

## Plan: Unificar "Estado de Pago" / "Estado Financiero" → "Estado de Cartera"

### Problema
En MatriculasPage hay dos inconsistencias:
1. **Filtro** dice "Estado de Pago" y **columna** dice "Estado Financiero" — nombres distintos para lo mismo.
2. Ambos usan `m.pagado` (booleano local) con valores "Pagado"/"Pendiente", en lugar de los estados reales de Cartera (`sin_facturar`, `facturado`, `abonado`, `pagado`, `vencido`).

### Solución

**Archivo: `src/pages/matriculas/MatriculasPage.tsx`**

1. **Importar datos de cartera** — traer `mockGruposCartera` y `ESTADO_GRUPO_CARTERA_LABELS` para derivar el estado real.

2. **Crear función `getEstadoCartera(matricula)`** que busque el grupo de cartera que contiene esa matrícula y devuelva su `estado` (`sin_facturar`, `facturado`, etc.). Si no está en ningún grupo, devuelve `sin_facturar`.

3. **Renombrar filtro y columna a "Estado de Cartera"**:
   - `filterConfigs`: cambiar label de `"Estado de Pago"` a `"Estado de Cartera"`, y las opciones pasan a ser los 5 estados de `EstadoGrupoCartera`.
   - `DEFAULT_COLUMNS`: cambiar `estadoFinanciero` → header `"Estado de Cartera"`.
   - `columns`: cambiar header y render para usar `getEstadoCartera()` + `StatusBadge` en vez del badge manual basado en `m.pagado`.

4. **Actualizar lógica de filtrado** — `filteredMatriculas` usará `getEstadoCartera(m)` en lugar de `m.pagado`.

### Detalle técnico
- Las opciones del filtro serán: Sin facturar, Facturado, Abonado, Pagado, Vencido (los 5 de `EstadoGrupoCartera`).
- La columna usará `StatusBadge` con los mismos colores ya definidos para esos estados.
- No se toca el tipo `Matricula` ni el campo `pagado` (se mantiene por compatibilidad), solo se deja de usar como fuente visual.

