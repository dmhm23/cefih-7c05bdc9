

## Hacer interactivos los campos adicionales en NivelFormPage

### Causa raiz

El componente `CampoPreview` (`src/components/niveles/CampoPreview.tsx`) renderiza todos los controles con la prop `disabled` y los envuelve en un `div` con las clases `pointer-events-none opacity-75` (linea 76). Esto bloquea toda interaccion del usuario.

### Solucion

Modificar `CampoPreview` para que los controles sean interactivos:

1. **Eliminar `pointer-events-none opacity-75`** del div contenedor (linea 76).
2. **Eliminar la prop `disabled`** de todos los controles (Input, Textarea, Switch, Select, Checkbox).
3. **Agregar estado local** para cada tipo de control, de modo que el usuario pueda interactuar con ellos. Dado que `CampoPreview` recibe un solo campo y se monta una vez por campo, se usara `useState` interno para manejar el valor de cada control.

### Detalle tecnico

**Archivo:** `src/components/niveles/CampoPreview.tsx`

- Agregar un `useState` generico para el valor del campo (string, boolean, string[], etc.).
- Cada control usara `value`/`checked`/`onChange` conectados a ese estado local.
- Para `select_multiple`, el estado sera un array de strings manejado via checkboxes con toggle.
- Para `estado` y `booleano`, el estado sera un boolean conectado al `Switch`.
- Para `archivo`, `Input type="file"` no necesita estado controlado, solo quitar `disabled`.

Estos valores locales son efimeros (no se persisten); sirven para que el usuario vea y pruebe el control funcional dentro del flujo de configuracion del nivel.

### Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/niveles/CampoPreview.tsx` | Eliminar `disabled` y `pointer-events-none`, agregar estado local para interactividad |

