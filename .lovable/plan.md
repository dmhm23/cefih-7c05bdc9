

# Plan: Corregir PDF descargable para conservar el formato estructurado

## Problema

El `handlePrint` en `DynamicFormatoPreviewDialog` clona el `innerHTML` del documento y lo inyecta en una ventana nueva con `PRINT_STYLES`. Pero el documento usa **clases de Tailwind CSS** (grid, spacing, borders, font sizes, colors) que no existen en la ventana de impresión. El resultado: todo colapsa en una columna plana sin estructura.

Los componentes legacy no tenían este problema porque usaban **inline styles** directamente (como `DocumentHeader` que ya usa el objeto `styles`).

## Solución

Reescribir `PRINT_STYLES` para incluir reglas CSS que repliquen fielmente todas las clases de Tailwind usadas por `DynamicFormatoDocument` y sus bloques hijos. Esto cubre:

1. **Layout principal**: grid de 2 columnas, gaps, spans
2. **Field cells**: labels en uppercase 9px, valores en 14px, badges
3. **Section titles**: bordes, márgenes, uppercase
4. **Firmas**: boxes con borde dashed, imágenes centradas
5. **Health consent**: cards con bordes, botones Sí/No con colores
6. **Data authorization**: checkbox + label
7. **Evaluation quiz**: preguntas con opciones, badge de resultado
8. **Satisfaction survey**: escala, botones
9. **Attendance table**: tabla con bordes y padding
10. **Signatures**: dashed border boxes

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/matriculas/formatos/DynamicFormatoPreviewDialog.tsx` | Reescribir `PRINT_STYLES` con CSS completo que replica el layout Tailwind. Mejorar `handlePrint` para convertir imágenes (logo, firmas) a data URLs antes de clonar. |

## Detalle técnico

El `PRINT_STYLES` expandido incluirá:

```text
/* Layout principal del documento */
.bg-white          → background: white; padding: 24px;
grid grid-cols-2    → display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px;

/* Field cells */
.field-cell         → padding, font sizes for label/value
.text-\[9px\]      → font-size: 9px
.text-sm            → font-size: 14px

/* Section titles, signatures, tables */
/* Health consent cards, quiz options, survey scales */
/* Badges (umbral, auto) */
```

Se mantendrá el enfoque `window.print()` (consistente con la arquitectura del proyecto) pero con CSS suficiente para que el documento impreso sea fiel a la vista en pantalla.

