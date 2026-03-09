

## Plan: Reemplazar Select por FilterPopover en EnrollmentsTable

### Cambio en `src/components/cursos/EnrollmentsTable.tsx`

Reemplazar los dos `<Select>` independientes (líneas 268-288) por un único `<FilterPopover>` con el mismo patrón visual usado en CursosListView, MatriculasPage y PersonasPage.

**Cambios concretos:**

1. **Imports**: Agregar `FilterPopover`, `FilterConfig` de `@/components/shared/FilterPopover` y `Filter` de lucide-react. Eliminar imports de `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`.

2. **Estado**: Agregar `filterOpen` (boolean). Reemplazar `filterDocumental` y `filterFinanciero` por un objeto `filters: Record<string, string | string[]>` con keys `documental` y `financiero`, ambos inicializados en `"todos"`.

3. **FilterConfig**: Definir array de configs:
   - `{ key: "documental", label: "Estado Documental", type: "select", options: [Pendiente, Completo] }`
   - `{ key: "financiero", label: "Estado Financiero", type: "select", options: [Pagado, Abonado, Sin pagar] }`

4. **Header**: Reemplazar los dos `<Select>` por un `<FilterPopover>` con trigger tipo `<Button variant="outline" size="sm">` con icono `Filter` y badge de conteo activo, idéntico al de CursosListView.

5. **Lógica de filtrado**: Adaptar `filtered` para leer de `filters.documental` y `filters.financiero` en lugar de los estados individuales.

### Resultado
El filtro en la tabla de inscritos tendrá exactamente la misma UI que el botón "Filtro" de las demás tablas del sistema.

