

## Diagnóstico: Por qué el canvas no crece con los bloques

### Causa raíz

El `CanvasBlock` (línea 37) tiene `overflow-hidden` en su clase CSS. Esto **recorta** todo contenido que exceda el alto calculado del bloque — especialmente los bloques de evaluación con múltiples preguntas. Como el contenido se recorta en lugar de expandir el bloque, la "hoja" blanca nunca crece porque sus hijos reportan una altura truncada.

En resumen: `overflow-hidden` en cada bloque → los bloques no crecen → la hoja no crece.

### Plan de corrección

#### 1. `src/components/formatos/editor/CanvasBlock.tsx` — Quitar `overflow-hidden`

Cambiar la clase del contenedor principal de:
```
overflow-hidden
```
a:
```
overflow-visible
```

Esto permite que bloques con contenido extenso (evaluación, encuesta, salud) se expandan a su tamaño natural, y la hoja blanca crecerá automáticamente con ellos gracias al `h-fit` que ya tiene el canvas.

#### 2. `src/components/formatos/editor/CanvasRow.tsx` — Mismo ajuste

Si `CanvasRow` también tiene `overflow-hidden`, aplicar el mismo cambio para filas de 2 columnas.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/CanvasBlock.tsx` | `overflow-hidden` → `overflow-visible` |
| `src/components/formatos/editor/CanvasRow.tsx` | Verificar y corregir si aplica |

### Por qué esto resuelve ambos problemas

- **Hoja no crece**: Al dejar de recortar los bloques, su altura real se propaga al contenedor padre (la hoja blanca con `h-fit`), que crecerá naturalmente.
- **Contenido cortado**: Las preguntas de evaluación y otros bloques extensos se mostrarán completos.

