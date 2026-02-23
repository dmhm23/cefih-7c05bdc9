

## Renderizado funcional de Campos Adicionales

### Problema

En `/niveles/nuevo`, al guardar un campo adicional solo se muestra el nombre y un badge con el tipo ("Texto corto"), pero no se renderiza el control funcional correspondiente (input, textarea, switch, etc.). El usuario espera ver el campo listo para usarse.

Hay dos contextos donde esto debe funcionar:

1. **NivelFormPage** (definicion del nivel): Mostrar una vista previa funcional del campo configurado, con su control real renderizado. Estos campos no almacenan valores aqui, sirven como previsualizacion de la estructura.

2. **CursoFormPage** (creacion de curso): Los campos ya se renderizan via `CamposAdicionalesCard`, pero hay un problema tecnico: el `zodResolver` se configura una sola vez al inicializar `useForm` y no se actualiza cuando cambia el schema dinamico.

---

### Cambio 1: Renderizar controles funcionales en NivelFormPage

**Archivo:** `src/pages/niveles/NivelFormPage.tsx` (lineas 253-285)

Reemplazar la lista actual de badges por una lista que muestre cada campo con:
- El badge del tipo como referencia visual (conservar)
- Los botones de editar/eliminar (conservar)
- El control funcional real renderizado debajo, segun el tipo del campo

El renderizado se hara con un componente inline o reutilizando la logica de `CamposAdicionalesCard`, pero en modo "preview" (sin conexion a un form de react-hook-form). Se usara un estado local simple para mostrar los controles funcionales con valores vacios, sin validacion.

La estructura visual de cada campo sera:

```text
+--------------------------------------------------+
| [Nombre del campo]  [Badge tipo] [Obligatorio]   |
|                              [Editar] [Eliminar]  |
| [Control funcional segun tipo]                    |
+--------------------------------------------------+
```

Se reutilizara la logica de mapeo tipo-componente ya definida en `CamposAdicionalesCard.tsx`, creando una funcion de renderizado reutilizable o un componente de preview.

---

### Cambio 2: Corregir actualizacion dinamica del resolver en CursoFormPage

**Archivo:** `src/pages/cursos/CursoFormPage.tsx`

El `zodResolver` se pasa a `useForm` una sola vez en la inicializacion (linea 131-146). Cuando el usuario selecciona un nivel y `camposAdicionales` cambia, el schema se recalcula via `useMemo` (linea 121-124), pero el resolver dentro de `useForm` no se actualiza.

**Solucion:** Usar la propiedad `resolver` del metodo `form` de forma que se actualice. Se puede lograr de dos formas:
- Mover la creacion del form fuera del componente y recrearlo cuando cambia el schema (no recomendado)
- Usar un wrapper de resolver que consulte el schema actual via ref

La solucion sera crear un resolver wrapper que use una referencia (`useRef`) al schema actual, de modo que cuando el schema cambie, la validacion siempre use la version mas reciente sin necesidad de recrear el form.

```
const schemaRef = useRef(schema);
schemaRef.current = schema;

const dynamicResolver = useCallback(
  (values, context, options) => zodResolver(schemaRef.current)(values, context, options),
  []
);
```

Esto asegura que al seleccionar un nivel con campos obligatorios, la validacion funcione correctamente al intentar guardar el curso.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/niveles/NivelFormPage.tsx` | Renderizar controles funcionales junto a los badges en la lista de campos adicionales |
| `src/pages/cursos/CursoFormPage.tsx` | Corregir resolver dinamico con useRef para que la validacion se actualice al cambiar de nivel |

