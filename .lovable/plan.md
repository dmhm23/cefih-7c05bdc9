

## Diagnóstico

**El campo SÍ se está guardando** — pero como texto crudo en lugar de código ISO, así que la UI no lo puede mostrar.

**Evidencia (consulta a BD `personas.pais_nacimiento`):**

| Valor en BD | Cantidad |
|---|---|
| `COLOMBIA` | 2.598 |
| `Colombia` | 637 |
| `VENEZUELA` | 23 |
| `Venezuela` | 20 |
| `CO` | 8 |
| `República Dominicana` | 1 |

**Por qué se ve vacío:**
- El catálogo `PAISES` en `formOptions.ts` usa códigos ISO como `value` (`CO`, `VE`, `EC`...) y el nombre como `label` (`Colombia`, `Venezuela`...).
- En `PersonaDetailSheet`, `MatriculaFormPage` y `MatriculaDetallePage`, el campo País se renderiza como `<select>` cuyas opciones son `PAISES`. Si el valor almacenado es `"COLOMBIA"`, el `<select>` no encuentra una opción con `value === "COLOMBIA"` → muestra blanco.
- Otros campos (género, RH, nivel educativo) **sí funcionan** porque la plantilla los pasa por `findEnumValue()` que normaliza label→value.

**Causa raíz** (`src/utils/personaPlantilla.ts` línea 139):
```ts
const paisNacimiento = String(row[6] || '').trim();  // ❌ texto crudo, sin mapear
```

A diferencia de:
```ts
genero = GENERO_LABEL_TO_VALUE[generoRaw.toLowerCase()];   // ✅ mapeado
rh = findEnumValue(rhRaw, GRUPOS_SANGUINEOS);              // ✅ mapeado
nivelEducativo = findEnumValue(nivelRaw, NIVELES_EDUCATIVOS); // ✅ mapeado
```

## Solución

### 1. Normalizar país en el parser de plantilla

En `src/utils/personaPlantilla.ts`:

- Aplicar `findEnumValue(paisRaw, PAISES)` igual que con RH/nivel.
- Aceptar cualquier variante: `"Colombia"`, `"COLOMBIA"`, `"colombia"`, `"CO"`, `"co"` → siempre se guarda `"CO"`.
- Si no se reconoce, agregar **warning** (no error) y guardar el texto tal cual, para no bloquear cargas con países raros (ej. "Eslovaquia" si no está en el catálogo).

### 2. Mejorar la plantilla XLSX

En `descargarPlantillaPersonas()`:

- Agregar **dropdown de validación** en la columna País (igual que tipo doc, género, RH, nivel) con la lista `PAISES.map(p => p.label)`.
- Cambiar el ejemplo de `"Colombia"` (ya está así, queda igual).
- Esto previene que el usuario escriba variantes inconsistentes.

### 3. Migración one-shot para limpiar datos existentes

Normalizar los 3.287 registros ya cargados:

```sql
UPDATE personas SET pais_nacimiento = 'CO' 
  WHERE upper(trim(pais_nacimiento)) IN ('COLOMBIA', 'CO');
UPDATE personas SET pais_nacimiento = 'VE' 
  WHERE upper(trim(pais_nacimiento)) IN ('VENEZUELA', 'VE');
-- + República Dominicana → 'DO'
-- + cualquier otro label que se detecte
```

Construir el UPDATE dinámicamente desde `PAISES` para cubrir los 50 países del catálogo.

### 4. Defensa en UI (opcional pero recomendado)

En el `<select>` de País, si el valor almacenado no coincide con ninguna opción, mostrar el valor crudo en vez de blanco. Esto evita que datos legados parezcan "perdidos" mientras se migran.

Implementación: en `EditableField` (modo select), agregar como opción adicional el `value` actual si no está en la lista.

## Resultado

- **Importaciones nuevas:** "Colombia", "COLOMBIA", "CO" → todos quedan como `"CO"` y se ven correctamente.
- **Datos existentes:** migración los normaliza, ~3.287 personas pasan a mostrar país correctamente.
- **Plantilla:** dropdown evita errores futuros.
- **UI defensiva:** si entra un país no catalogado, no desaparece visualmente.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/utils/personaPlantilla.ts` | Normalizar `paisNacimiento` con `findEnumValue(raw, PAISES)`; agregar validación dropdown en `descargarPlantillaPersonas` |
| `src/components/shared/EditableField.tsx` | (opcional) si valor no está en options, agregarlo como fallback para que se muestre |
| Migración SQL | UPDATE masivo `personas.pais_nacimiento` para mapear labels existentes a códigos ISO |

