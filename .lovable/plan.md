

## Plan: Ajustes al inspector del bloque `document_header`

### Cambios

**1. `src/components/formatos/editor/InspectorFields.tsx` — DocumentHeaderInspector**

- Renombrar "Etiqueta" → "Nombre del formato/documento" solo para `document_header`. En `InspectorFields` (línea 37), condicionar el label: si `bloque.type === 'document_header'` mostrar "Nombre del formato/documento", de lo contrario mantener "Etiqueta".
- Reordenar campos: mover "Color de bordes" (actualmente líneas 757-773) después de "Código" y "Versión" (líneas 775-795). El orden final será: Logo → Empresa → SGI → Subsistema → Fechas → Código/Versión → Color de bordes.
- Logo: ya funciona correctamente con carga y preview. Si `logoUrl` tiene valor (ya sea del default del store o cargado por el usuario), se muestra la imagen con botón de eliminar. Si está vacío, se muestra el dropzone. No requiere cambio funcional, solo confirmar que el store default ya trae un `logoUrl` válido (actualmente es `''`). Si se desea que un logo previamente cargado persista, eso depende de la persistencia del formato — no del inspector.

**2. `src/components/formatos/editor/BlockInspector.tsx` — Botón "Config"**

- El botón "Config" abre `FormatoConfigSheet`, que contiene configuración general del formato (nombre, categoría, alcance, visibilidad, firmas). Esta configuración NO se duplica con las propiedades del encabezado — son cosas distintas. **Se conserva el botón** pero se renombra a "Ajustes del formato" para mayor claridad y evitar confusión con las propiedades del bloque.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/InspectorFields.tsx` | Condicionar label "Etiqueta"→"Nombre del formato/documento" para `document_header`; reordenar campos en `DocumentHeaderInspector` |
| `src/components/formatos/editor/BlockInspector.tsx` | Renombrar botón "Config" → "Ajustes del formato" |

