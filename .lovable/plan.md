

## Anchos minimos para columnas de tabla

### Problema

Cuando el usuario activa columnas adicionales, las celdas se comprimen y el texto hace saltos de linea, aumentando la altura de las filas y reduciendo la legibilidad. En lugar de comprimir, la tabla debe mantener anchos minimos razonables y delegar el exceso al scroll horizontal que ya esta funcionando.

### Solucion

Aplicar `whitespace-nowrap` a nivel de la tabla para evitar saltos de linea en las celdas, y agregar `className` con anchos minimos (`min-w-[...]`) a las columnas que contienen texto largo o que requieren espacio fijo. Esto fuerza a la tabla a expandirse horizontalmente en lugar de comprimir verticalmente.

### Cambios por archivo

**1. `src/components/ui/table.tsx`**

Agregar `whitespace-nowrap` a `TableCell` para que por defecto ninguna celda haga salto de linea:

- Antes: `"px-3 py-2.5 align-middle text-sm ..."`
- Despues: `"px-3 py-2.5 align-middle text-sm whitespace-nowrap ..."`

**2. `src/pages/personas/PersonasPage.tsx`**

Agregar `className` con anchos minimos a las columnas que lo necesitan:

| Columna | className |
|---|---|
| nombre | `min-w-[200px]` |
| sector | `min-w-[140px]` |
| email | `min-w-[200px]` |
| contactoEmergencia | `min-w-[200px]` |

**3. `src/pages/matriculas/MatriculasPage.tsx`**

Agregar `className` con anchos minimos a columnas clave:

| Columna | className |
|---|---|
| empresa | `min-w-[180px]` |
| asistente | `min-w-[180px]` |
| fechaArl | `min-w-[140px]` |
| fechaExamen | `min-w-[120px]` |
| eps | `min-w-[140px]` |
| arl | `min-w-[140px]` |

Tambien eliminar el `truncate block max-w-[180px]` de la celda "empresa" ya que el `whitespace-nowrap` global y el `min-w` lo hacen innecesario.

**4. `src/components/cursos/CursosListView.tsx`**

Agregar `className` con anchos minimos a columnas clave:

| Columna | className |
|---|---|
| curso | `min-w-[250px]` |
| entrenador | `min-w-[160px]` |
| fechas | `min-w-[180px]` |

### Resultado esperado

- Las celdas nunca se comprimen al punto de perder legibilidad.
- El texto no hace saltos de linea dentro de las celdas.
- Cuando las columnas visibles exceden el ancho disponible, el scroll horizontal de la tabla absorbe el exceso.
- La altura de las filas se mantiene compacta y uniforme.

