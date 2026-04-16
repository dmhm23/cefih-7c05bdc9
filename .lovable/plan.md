

## Análisis del problema

Mirando `ImportarEmpresasDialog.tsx` (mismo patrón en `ImportarPersonasDialog.tsx`), la estructura del `DialogContent` es:

```
DialogHeader
{contenido condicional: dropzone | result | tabla con ScrollArea max-h-[45vh]}
{importing && <ImportProgress />}   ← se inserta aquí como hermano
DialogFooter
```

**Causas raíz:**

1. **No hay reserva de espacio**: `ImportProgress` se monta como hermano flex-item dentro del `DialogContent` (que es `flex flex-col`). El `ScrollArea` de la tabla tiene `max-h-[45vh]` fijo y el `DialogContent` tiene `max-h-[85vh]`. Cuando aparece la barra, el contenido total puede exceder el alto del modal y la barra termina visualmente solapada con la tabla porque el contenedor padre del bloque de tabla (`flex-1 min-h-0`) no cede espacio.

2. **Sin separador visual**: `ImportProgress` solo tiene `bg-muted/30` con borde sutil; no se distingue del fondo del modal.

3. **Posicionamiento ambiguo**: Al estar entre el contenido y el footer sin un separador, parece "flotar" sobre la tabla en lugar de ser una sección propia.

4. **En el screenshot**: La barra (h-2) queda detrás del texto de las filas porque el contenedor scrolleable de la tabla extiende su altura y la barra se renderiza encima visualmente.

## Solución propuesta

**Estrategia**: Convertir el `ImportProgress` durante el estado `importing` en una **sección fija anclada arriba del footer**, con separador visual claro, y reducir el `max-h` de la tabla cuando está activa para garantizar que no haya solapamiento.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/shared/ImportProgress.tsx` | Mejorar estilo: fondo más sólido (`bg-background`), borde superior marcado, padding generoso, barra más gruesa (`h-3`), tipografía más jerárquica. |
| `src/components/personas/ImportarPersonasDialog.tsx` | Envolver el bloque de tabla en un contenedor que reduzca su `max-h` cuando `importing` es true. Agregar separador (`border-t`) antes del `ImportProgress`. Asegurar que el progress quede entre el contenido y el footer con margen claro. |
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Mismo ajuste. |

### Detalle visual

**ImportProgress mejorado:**
- Quitar el `border` propio y `bg-muted/30`
- Usar `border-t-2 border-primary/20 bg-card px-6 py-4` para que sea una franja horizontal completa anclada al ancho del modal
- Barra de progreso `h-3` (más visible)
- Layout: ícono + label a la izquierda, contador a la derecha, barra debajo

**Diálogo:**
- Cambiar la `ScrollArea` de la tabla de `max-h-[45vh]` a una clase condicional: `max-h-[35vh]` cuando `importing`, `max-h-[45vh]` normal — para liberar espacio vertical
- El `ImportProgress` se renderiza con `-mx-6` (compensando el padding del DialogContent) para ocupar todo el ancho como franja
- Footer queda separado naturalmente

### Resultado esperado

```text
┌─────────────────────────────────┐
│ Importar Personas           [X] │
├─────────────────────────────────┤
│ archivo.xlsx              [X]   │
│ [badges] [tabs]                 │
│ ┌─────────────────────────────┐ │
│ │ tabla con scroll (35vh)     │ │
│ └─────────────────────────────┘ │
├═════════════════════════════════┤  ← franja completa
│ ⟳ Importando personas... 71/2600│
│ ████████░░░░░░░░░░░░░░░░░ 3%   │
├─────────────────────────────────┤
│              [Cancelar][Importando]│
└─────────────────────────────────┘
```

