

## Plan: Reducir espacio y alinear botones a la derecha

### Cambio en `src/pages/matriculas/MatriculaFormPage.tsx` (líneas 394-413)

Envolver los dos botones ("Ver datos" y "Quitar") en un contenedor `div` con `flex items-center gap-1 shrink-0 ml-auto` para:
- Reducir el espacio entre ambos botones de `gap-3` (heredado del padre) a `gap-1`
- Asegurar alineación a la derecha con `ml-auto`

```text
Antes:  [Avatar] [Texto (flex-1)] ···gap-3··· [Ver datos] ···gap-3··· [Quitar]
Después: [Avatar] [Texto (flex-1)] ···gap-3··· [Ver datos|Quitar]  (gap-1 interno)
```

### Detalle técnico

Después de línea 394 (`</div>` del texto), insertar un `<div className="flex items-center gap-1 shrink-0">` que envuelva ambos botones (líneas 395-413) y cerrar el `</div>` después del botón "Quitar".

