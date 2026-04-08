

# Plan: Agregar indicador de carga al subir documentos en AdjuntosPersonal

## Problema

Cuando se suben archivos, el único feedback es que el texto del dropzone cambia a "Subiendo...", pero no hay indicación visual en la lista de archivos. El usuario no percibe claramente que algo está sucediendo.

## Solución

Agregar un indicador de carga sutil debajo del dropzone cuando `isUploading` es `true`: una barra de progreso indeterminada con un texto informativo. Usaré el componente `Progress` existente con una animación de pulso, más un icono `Loader2` girando.

### Archivo: `src/components/personal/AdjuntosPersonal.tsx`

- Importar `Loader2` de lucide-react y `Progress` de `@/components/ui/progress`
- Después del `FileDropZone`, agregar un bloque condicional cuando `isUploading === true`:
  - Un contenedor con borde, padding y fondo sutil (`bg-muted/30`)
  - Icono `Loader2` con `animate-spin`
  - Texto "Cargando documentos..."
  - Barra de progreso indeterminada (valor animado con CSS)

```
┌─────────────────────────────────────┐
│  ↻ Cargando documentos...           │
│  ═══════════════════░░░░░░░░        │
└─────────────────────────────────────┘
```

La barra usará una animación CSS de ancho que oscila, dando la sensación de progreso continuo sin necesitar un porcentaje real.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/personal/AdjuntosPersonal.tsx` | Agregar indicador de carga animado cuando `isUploading` |

**Total: 1 archivo editado, 0 migraciones**

