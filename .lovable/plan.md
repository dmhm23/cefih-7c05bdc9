

## Renderizado funcional de Campos Adicionales

### Problema

En `/niveles/nuevo`, al guardar un campo adicional solo se muestra el nombre y un badge con el tipo ("Texto corto"), pero no se renderiza el control funcional correspondiente. En `/cursos/nuevo`, el resolver de validacion no se actualiza al cambiar de nivel.

---

### Cambio 1: Renderizar controles funcionales en NivelFormPage

**Archivo:** `src/pages/niveles/NivelFormPage.tsx`

Agregar un componente `CampoPreview` que renderice el control UI correspondiente al tipo del campo (sin conexion a react-hook-form, solo visual). Se insertara debajo de los badges y botones de cada campo en la lista.

El componente mapeara cada tipo a su control:
- `texto_corto` / `url` / `email` / `telefono`: `Input` con type correspondiente
- `texto_largo`: `Textarea`
- `numerico`: `Input type="number"`
- `select`: `Select` con opciones configuradas
- `select_multiple`: checkboxes con opciones
- `estado`: `Switch` con label Activo/Inactivo
- `booleano`: `Switch`
- `fecha`: `Input type="date"`
- `fecha_hora`: `Input type="datetime-local"`
- `archivo`: `Input type="file"`

El preview se muestra con `pointer-events-none opacity-75` para indicar que es solo una previsualizacion.

---

### Cambio 2: Corregir resolver dinamico en CursoFormPage

**Archivo:** `src/pages/cursos/CursoFormPage.tsx`

Reemplazar el `zodResolver(schema)` estatico y el hack de `clearErrors` por un resolver wrapper con `useRef` + `useCallback`:

```typescript
const schemaRef = useRef(schema);
schemaRef.current = schema;

const dynamicResolver = useCallback(
  (values, context, options) => zodResolver(schemaRef.current)(values, context, options),
  []
);
```

Pasar `dynamicResolver` a `useForm({ resolver: dynamicResolver })`.

Agregar imports de `useRef` y `useCallback`.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/niveles/NivelFormPage.tsx` | Agregar componente `CampoPreview` y renderizarlo debajo de cada campo en la lista |
| `src/pages/cursos/CursoFormPage.tsx` | Reemplazar resolver estatico por wrapper dinamico con useRef/useCallback |

