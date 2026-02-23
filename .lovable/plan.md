

## Renderizado dinamico de Campos Adicionales en el formulario de Curso

### Resumen

Cuando el usuario selecciona un "Tipo / Nivel de Formacion" en el formulario de Nuevo Curso, el sistema cargara los `camposAdicionales` configurados en ese nivel y los renderizara como campos funcionales dentro de una nueva Card "Campos Adicionales". Cada campo se comportara exactamente segun su tipo y configuracion (obligatoriedad, opciones, etc.). Se elimina el campo "Valor por defecto" del modal de configuracion en Niveles.

---

### 1. Eliminar "Valor por defecto" del modal de Niveles

**Archivo:** `src/components/niveles/CampoAdicionalModal.tsx`

- Eliminar completamente el estado `valorPorDefecto` y toda la UI relacionada (lineas 53, 67, 74, 132-135, 196-224).
- Eliminar la propiedad `valorPorDefecto` del objeto `campo` que se construye en `doSave()`.
- Simplificar la logica: ya no se necesitan las variables `hideValorDefecto` ni `showEstadoDefault`.

**Archivo:** `src/types/nivelFormacion.ts`

- Eliminar `valorPorDefecto?: string` de la interfaz `CampoAdicional` (linea 33).

---

### 2. Agregar `camposAdicionales` al modelo de Curso

**Archivo:** `src/types/curso.ts`

- Agregar al `Curso` interface: `camposAdicionalesValores?: Record<string, any>` -- un mapa donde la key es el `id` del campo adicional y el value es el valor ingresado por el usuario.
- Incluirlo tambien en `CursoFormData`.

---

### 3. Renderizado dinamico en CursoFormPage

**Archivo:** `src/pages/cursos/CursoFormPage.tsx`

**A) Cargar campos adicionales al seleccionar nivel:**

En `handleTipoFormacionChange`, cuando se selecciona un nivel, extraer `nivel.camposAdicionales` y guardarlos en un estado local `camposAdicionales` (useState).

**B) Construir schema zod dinamico:**

Reemplazar el schema estatico por uno que se reconstruya cuando cambien los campos adicionales. Para cada campo:

| Tipo | Validacion zod |
|---|---|
| `texto_corto` | `z.string()` + `.min(1)` si obligatorio |
| `texto_largo` | `z.string()` + `.min(1)` si obligatorio |
| `numerico` | `z.coerce.number()` + `.min(0)` si obligatorio |
| `select` | `z.string()` + `.min(1)` si obligatorio |
| `select_multiple` | `z.array(z.string())` + `.min(1)` si obligatorio |
| `estado` | `z.string()` (default `"inactivo"`) |
| `fecha` | `z.string()` + `.min(1)` si obligatorio |
| `fecha_hora` | `z.string()` + `.min(1)` si obligatorio |
| `booleano` | `z.boolean()` (default `false`) |
| `archivo` | `z.string()` (solo placeholder, no upload real) + `.min(1)` si obligatorio |
| `url` | `z.string().url()` o `.optional()` segun obligatorio |
| `telefono` | `z.string()` + `.min(1)` si obligatorio |
| `email` | `z.string().email()` o `.optional()` segun obligatorio |

Se usara `z.object()` con spread del schema base + los campos dinamicos, recalculado via `useMemo`.

**C) Renderizar nueva Card "Campos Adicionales":**

Solo visible cuando `camposAdicionales.length > 0`. Cada campo se renderiza con `FormField` segun su tipo:

| Tipo | Componente UI |
|---|---|
| `texto_corto` | `<Input type="text" />` |
| `texto_largo` | `<Textarea />` |
| `numerico` | `<Input type="number" />` |
| `select` | `<Select>` con las opciones configuradas |
| `select_multiple` | Multiples `<Checkbox>` con las opciones |
| `estado` | `<Switch>` con labels Activo/Inactivo |
| `fecha` | `<Input type="date" />` |
| `fecha_hora` | `<Input type="datetime-local" />` |
| `booleano` | `<Switch>` |
| `archivo` | `<Input type="file" />` (placeholder visual) |
| `url` | `<Input type="url" />` |
| `telefono` | `<Input type="tel" />` |
| `email` | `<Input type="email" />` |

Los labels mostraran `*` si el campo es obligatorio. Los mensajes de error provienen de la validacion zod.

**D) Incluir valores en el payload:**

En `onSubmit`, recopilar los valores de los campos adicionales en un objeto `camposAdicionalesValores` y enviarlo como parte del payload de creacion del curso.

**E) Limpiar al cambiar de nivel:**

Cuando el usuario cambia de nivel, resetear los valores de campos adicionales y recargar los nuevos.

---

### 4. Actualizar NivelDetallePage

**Archivo:** `src/pages/niveles/NivelDetallePage.tsx`

- Eliminar la referencia a `valorPorDefecto` en el renderizado de campos adicionales (si existe).

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/types/nivelFormacion.ts` | Eliminar `valorPorDefecto` de `CampoAdicional` |
| `src/components/niveles/CampoAdicionalModal.tsx` | Eliminar toda la UI y logica de "Valor por defecto" |
| `src/types/curso.ts` | Agregar `camposAdicionalesValores?: Record<string, any>` |
| `src/pages/cursos/CursoFormPage.tsx` | Schema dinamico, renderizado por tipo, integracion con react-hook-form |
| `src/pages/niveles/NivelDetallePage.tsx` | Eliminar referencia a `valorPorDefecto` |

