

## Plan: Renombrar "Financiero" a "Cartera" y sincronizar estados

### Cambios

#### 1. `src/components/cursos/EnrollmentsTable.tsx`

- **Columna**: Renombrar encabezado "Financiero" → "Cartera" (línea 367)
- **Filtro**: Renombrar `"Estado Financiero"` → `"Estado de Cartera"` (línea 116), cambiar key de `financiero` a `cartera`
- **Opciones del filtro**: Reemplazar las 3 opciones actuales (pagado/abonado/sin pagar) por los 5 estados de cartera: sin facturar, facturado, abonado, pagado, vencido
- **Función `getFinancialStatus`** (líneas 105-109): Renombrar a `getCarteraStatus` y derivar el estado desde el módulo de Cartera consultando el `GrupoCartera` asociado a la matrícula (via `mockGruposCartera` o un hook). Si la matrícula pertenece a un grupo, usar `grupo.estado`; si no, devolver `'sin_facturar'`
- **Badge visual** (líneas 422-434): Usar `StatusBadge` (ya existente con los estados de cartera) en lugar del Badge manual, para consistencia visual
- **Estado inicial de filtros**: Actualizar de `{ documental: "todos", financiero: "todos" }` a `{ documental: "todos", cartera: "todos" }`

#### 2. `src/pages/cartera/CarteraPage.tsx`

- **Filtro**: Renombrar label `"Estado"` → `"Estado de Cartera"` (línea 29)

### Archivos modificados
- `src/components/cursos/EnrollmentsTable.tsx` — renombrar columna, filtro y sincronizar estados desde cartera
- `src/pages/cartera/CarteraPage.tsx` — renombrar label del filtro de estado

