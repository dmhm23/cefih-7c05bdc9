

## Plan: Ajustes en EnrollmentsTable — Botón, Badges y Filtros

### Cambios en `src/components/cursos/EnrollmentsTable.tsx`

#### 1. Botón "Generar certificados" siempre visible
- Mover el botón fuera del condicional `selectedIds.size > 0`
- Mantenerlo siempre renderizado con `disabled={selectedIds.size === 0 || masivaGenerating}`
- Texto: "Generar certificados" cuando no hay selección, "Generar (N)" cuando hay seleccionados

#### 2. Badges con estilos consistentes con Matrículas
Adoptar exactamente los mismos estilos de `/matriculas`:
- **Completo**: `variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"`
- **Pendiente** (documental): `variant="secondary" className="bg-amber-500/10 text-amber-600"`
- **Pagado**: `variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"`
- **Abonado**: `variant="secondary" className="bg-blue-500/10 text-blue-600"` (nuevo, no existe en Matrículas pero es un estado intermedio)
- **Sin pagar**: `variant="secondary" className="bg-amber-500/10 text-amber-600"`

#### 3. Reemplazar toggle "Todos/Pendientes" por dos filtros Select
- Eliminar el toggle actual y su estado `filter`
- Agregar dos estados: `filterDocumental` y `filterFinanciero` (valores: `"todos"` | opciones específicas)
- Dos `<Select>` compactos en el header:
  - **Documental**: Todos, Pendiente, Completo
  - **Financiero**: Todos, Pagado, Abonado, Sin pagar
- La lógica de `filtered` combinará ambos filtros simultáneamente
- Usar `Select` de radix (componente existente) con tamaño compacto (`text-xs`)

### Resultado
Botón siempre visible (disabled sin selección), badges idénticos a Matrículas, y filtrado combinable por estado documental y financiero.

