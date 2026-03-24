

## Plan: Renombrar "Tipo de Vinculación" → "Responsable del pago"

Cambio exclusivamente de label/texto visible. No se modifica ninguna variable, tipo, ni lógica.

### Archivos a modificar (4 archivos, 1 línea cada uno)

1. **`src/pages/matriculas/MatriculaFormPage.tsx`** (línea 651)
   - `"Tipo de Vinculación"` → `"Responsable del pago"`

2. **`src/pages/matriculas/MatriculaDetallePage.tsx`** (línea 470)
   - `"Tipo de Vinculación"` → `"Responsable del pago"`

3. **`src/components/matriculas/MatriculaDetailSheet.tsx`** (línea 436)
   - `"Tipo de Vinculación"` → `"Responsable del pago"`

4. **`src/data/autoFieldCatalog.ts`** (línea 34)
   - `label: 'Tipo de vinculación'` → `label: 'Responsable del pago'`

### Sin cambios
- Variables (`tipoVinculacion`), tipos (`TipoVinculacion`), constantes (`TIPOS_VINCULACION`, `TIPO_VINCULACION_LABELS`) — se mantienen intactos, solo cambia el texto visible al usuario.

