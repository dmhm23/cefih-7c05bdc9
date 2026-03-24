

## Plan: Completar búsqueda por nombre completo, cédula y teléfono en Personas y Matrículas

### Estado actual

| Campo | Personas | Matrículas |
|-------|----------|------------|
| Número de documento (cédula) | ✅ | ✅ |
| Nombres | ✅ | ✅ |
| Apellidos | ✅ | ✅ |
| Nombre completo (ej. "Juan Pérez") | ❌ | ❌ |
| Teléfono | ❌ | ❌ |

Ambos módulos buscan nombres y apellidos por separado, pero no permiten buscar por nombre completo concatenado (ej. "Juan Pérez") ni por teléfono.

### Cambios

**1. `src/pages/personas/PersonasPage.tsx`** — filtro de búsqueda
- Agregar `\`${p.nombres} ${p.apellidos}\`.toLowerCase().includes(query)` para nombre completo.
- Agregar `(p.telefono?.includes(searchQuery) ?? false)` para teléfono.

**2. `src/pages/matriculas/MatriculasPage.tsx`** — filtro de búsqueda
- Agregar `\`${persona?.nombres} ${persona?.apellidos}\`.toLowerCase().includes(query)` para nombre completo.
- Agregar `(persona?.telefono?.includes(searchQuery) ?? false)` para teléfono.

### Archivos a tocar
- `src/pages/personas/PersonasPage.tsx` (1 bloque, ~2 líneas)
- `src/pages/matriculas/MatriculasPage.tsx` (1 bloque, ~2 líneas)

