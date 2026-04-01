

## Plan: Añadir "Añadir opción" al selector de Sector Económico en Matrículas

### Enfoque

Replicar el patrón de Cartera: agregar una opción `"otro_sector"` al final del listado de sectores económicos. Al seleccionarla, se muestra un `Input` donde el usuario escribe el nombre del sector personalizado. El valor custom se guarda directamente como string en `sectorEconomico`.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/data/formOptions.ts` | Agregar `{ value: 'otro_sector', label: 'Otro (añadir opción)' }` al final de `SECTORES_ECONOMICOS` |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Agregar estado `sectorOtro`, mostrar Input cuando el valor sea `'otro_sector'`, guardar el valor custom en el submit |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Mismo tratamiento en la vista de edición de detalle: si el valor no está en `SECTORES_ECONOMICOS`, mostrarlo como texto; permitir "otro_sector" con input |

### Detalle de implementación

**`formOptions.ts`**: Agregar al final del array `SECTORES_ECONOMICOS`:
```typescript
{ value: 'otro_sector', label: 'Otro (añadir opción)' },
```

**`MatriculaFormPage.tsx`**:
- Estado `sectorOtro` para el texto personalizado
- Cuando `sectorEconomico === 'otro_sector'`, mostrar un `Input` debajo del Combobox
- En el submit, si `sectorEconomico === 'otro_sector'`, usar `sectorOtro` como valor final

**`MatriculaDetallePage.tsx`**:
- En el `EditableField` de sector, añadir la opción "Otro" y manejar el input adicional si se selecciona

