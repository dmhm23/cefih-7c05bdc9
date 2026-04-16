

# Plan: Detección de duplicados en importación de personas

## Resumen

Agregar detección anticipada de duplicados tanto dentro del archivo como contra la base de datos, con opciones para fusionar (intra-archivo) y omitir/actualizar (contra BD).

## Flujo propuesto

```text
1. Usuario carga archivo
2. Parser detecta duplicados intra-archivo
   → Badge amarillo: "X duplicados en archivo"
   → Botón "Fusionar duplicados" (conserva primer registro, elimina los demás)
3. Consulta batch a BD por numero_documento
   → Filas que ya existen se marcan con warning "Ya existe en el sistema"
   → Badge amarillo: "X ya existen en BD"
4. Usuario decide:
   - Omitir existentes (default) → solo importa nuevas
   - Actualizar existentes → checkbox global para sobrescribir datos
5. Importar
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/utils/personaPlantilla.ts` | Separar duplicados intra-archivo como warnings (no errors). Agregar tipo `PersonaImportRow.warnings`. |
| `src/components/personas/ImportarPersonasDialog.tsx` | Agregar fase de validación contra BD post-parse. UI para fusionar duplicados del archivo. Checkbox "Actualizar existentes". Nuevo tab "Duplicados". |
| `src/services/personaService.ts` | Agregar método `checkExisting(documentos: string[])` que consulta la BD en batch. Agregar método `upsertBulk` que usa `update` para existentes. |

## Detalle técnico

### 1. Detección intra-archivo con fusión

En `personaPlantilla.ts`:
- Los duplicados intra-archivo pasan de `errors` a `warnings` (nuevo campo).
- La fila duplicada se marca con `duplicadoEnArchivo: true` y referencia a la fila original.

En el diálogo:
- Cuando hay duplicados intra-archivo, mostrar badge warning + botón **"Fusionar (conservar primeros)"**.
- Al hacer clic, filtra `rows` eliminando las filas marcadas como duplicadas (conserva la primera aparición).

### 2. Validación contra BD

Después de parsear el archivo, el diálogo ejecuta una consulta batch:

```typescript
// personaService.ts
async checkExisting(documentos: string[]): Promise<Set<string>> {
  const { data } = await supabase
    .from('personas')
    .select('numero_documento')
    .in('numero_documento', documentos)
    .is('deleted_at', null);
  return new Set((data || []).map(r => r.numero_documento));
}
```

Las filas cuyo documento ya existe se marcan con `existeEnBD: true` y un warning visible.

### 3. Opciones de importación

- **Switch "Actualizar existentes"** (default: off): Si está activo, las personas que ya existen se actualizan con los datos del archivo en lugar de omitirse.
- Al importar con actualización, se usa `personaService.update()` para los existentes y `personaService.create()` para los nuevos.

### 4. UI del diálogo

- Nuevo tab: **"Duplicados (X)"** junto a Todas/Válidas/Errores.
- Filas existentes en BD: fondo amarillo claro con badge "Ya existe".
- Filas duplicadas en archivo: fondo amarillo con badge "Duplicado fila X".
- Resumen: `✓ X nuevas | ⚠ X duplicadas archivo | ⚠ X ya en BD | ✗ X con errores`.

