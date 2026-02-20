
## Plan: 4 ajustes puntuales al formato de Evaluación Reentrenamiento

### Resumen de cambios

Todos los cambios se concentran en 2 archivos:
- `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx`
- `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx`

---

### Cambio 1 — Letra de la opción en "Respuesta seleccionada"

**Archivo**: `EvaluacionReentrenamientoDocument.tsx`, función `TablaRespuestas` (línea ~329)

Actualmente muestra solo el texto de la opción. Se agrega la letra correspondiente prefijada:

```tsx
// Antes:
{respIdx !== undefined ? p.opciones[respIdx] : "—"}

// Después:
{respIdx !== undefined
  ? `${["a", "b", "c", "d"][respIdx]}. ${p.opciones[respIdx]}`
  : "—"}
```

Las preguntas de Verdadero/Falso tendrán `a. Verdadero` o `b. Falso`. Las de 4 opciones tendrán `a.`, `b.`, `c.`, `d.`. Coherente con la nomenclatura académica estándar.

---

### Cambio 2 — Datos del participante en 3 columnas + "Independiente" + nivel correcto

**Archivo**: `EvaluacionReentrenamientoDocument.tsx`, sección "Datos del Participante" (líneas ~511–531)

**Cambios:**
1. `grid-cols-2` → `grid-cols-3` en la clase del div contenedor y en el `PRINT_STYLES` (`.grid-2` → `.grid-3`).
2. Empresa muestra `"Independiente"` cuando `matricula.empresaNombre` está vacío o ausente:
   ```tsx
   value={matricula.empresaNombre || "Independiente"}
   ```
3. El nivel de formación se toma de `matricula.empresaNivelFormacion` (ya es así actualmente — se mantiene).
4. Reorganización de los campos en 3 columnas para lectura compacta:
   - Col 1: Fecha | Número de documento | Nivel de formación
   - Col 2: Tipo de documento | Nombre completo (span 2 cols restantes) | Empresa

   Distribución final con `col-span` para nombre completo:
   ```
   [Fecha]          [Tipo de documento]   [Número de documento]
   [Nombre completo (span 3 cols)                             ]
   [Nivel de formación]  [Empresa]         [—]
   ```
   
   O más natural con 3 columnas uniformes:
   ```
   [Fecha]          [Tipo de documento]   [Número de documento]
   [Nombre completo (span 2)]             [Nivel de formación]
   [Empresa]
   ```

   La distribución concreta será:
   - Fila 1: Fecha / Tipo de documento / Número de documento
   - Fila 2: Nombre completo (span=3) 
   - Fila 3: Nivel de formación / Empresa

   El `FieldCell` con `span` actualmente aplica `col-span-2`. Se agregará soporte para `span3`:
   ```tsx
   function FieldCell({ label, value, span, span3 }: { ...; span3?: boolean }) {
     return (
       <div className={`field-cell ${span3 ? "col-span-3 field-span3" : span ? "col-span-2 field-span" : ""}`}>
   ```
   
   Y en `PRINT_STYLES` se agrega:
   ```css
   .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 24px; }
   .field-span3 { grid-column: span 3; }
   ```

---

### Cambio 3 — Eliminar "Respuestas correctas X de Y — Mínimo requerido: 70%" en el PDF impreso

**Archivo**: `EvaluacionReentrenamientoPreviewDialog.tsx` → `PRINT_STYLES`

La segunda fila del bloque `.resultado-compacto` (que contiene ese texto) debe ocultarse en print. Se agrega:

```css
/* Ocultar la fila de detalle mínimo requerido en print */
.resultado-compacto > div:nth-child(3),
.resultado-compacto > div:nth-child(4) { display: none; }
```

Esto oculta la segunda fila del grid (fila de "Respuestas correctas") en el documento impreso, manteniendo solo el resultado principal (X/Y + badge Aprobado/No aprobado).

En pantalla (vista admin) esa fila sigue visible normalmente — el CSS está solo en `PRINT_STYLES`.

---

### Cambio 4 — Optimizar espacio en impresión (reducir hojas)

**Archivo**: `EvaluacionReentrenamientoPreviewDialog.tsx` → `PRINT_STYLES`

Cambios en las reglas CSS:

1. **Eliminar `break-inside: avoid` en `.section-group`**: Actualmente `@media print { .section-group { break-inside: avoid; } }` fuerza que cada sección (Datos del participante, Resultado, Preguntas y Respuestas, Encuesta) NO se corte entre páginas, lo que genera saltos prematuros. Se elimina esta regla.

2. **Permitir que la tabla se divida entre páginas**: `.tabla-preguntas tbody tr { break-inside: avoid; }` es correcto a nivel de fila (una fila no se corta a la mitad), pero `.tabla-preguntas { break-inside: auto; }` ya permite que la tabla se divida. Se verifica que la tabla no tenga `break-inside: avoid` global.

3. **Reducir padding del body en print**: `body { padding: 10mm }` → `body { padding: 6mm }`.

4. **Reducir márgenes de `section-group` en print**: `margin-top: 24px` → `margin-top: 14px` dentro del `@media print`.

5. **Reducir padding de celdas de tabla**: `.tabla-preguntas td { padding: 7px 4px; }` → `padding: 5px 4px` en print.

6. **Reducir `font-size` del body en print**: `12px` → `11px`.

```css
@media print { 
  body { padding: 6mm; font-size: 11px; }
  .section-group { margin-top: 14px; }
  .tabla-preguntas td { padding: 5px 4px; }
}
```

Nota: no se toca `break-inside: avoid` del `.resultado-compacto` — ese bloque sí debe mantenerse intacto.

---

### Resumen técnico de archivos y líneas

| Archivo | Cambio | Líneas aproximadas |
|---------|--------|--------------------|
| `EvaluacionReentrenamientoDocument.tsx` | Letra de opción en TablaRespuestas | ~329 |
| `EvaluacionReentrenamientoDocument.tsx` | Grid 3 cols, "Independiente", FieldCell span3 | ~241–250, ~511–531 |
| `EvaluacionReentrenamientoPreviewDialog.tsx` | Ocultar fila mínimo en print (CSS) | PRINT_STYLES ~89–122 |
| `EvaluacionReentrenamientoPreviewDialog.tsx` | Optimización de espacio print (CSS) | PRINT_STYLES ~77, ~187–190 |

**Sin cambios en**: tipos, mockData, servicios, ni ningún otro componente.
