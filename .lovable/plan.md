# Plan: Sincronizar opciones de Nivel Educativo con el enum de la base de datos

## Problema

El enum `nivel_educativo` en la base de datos tiene estos valores:

```
primaria, secundaria, tecnico, tecnologo, profesional, especializacion, maestria, doctorado, ninguno, otro
```

Pero el frontend (`formOptions.ts`) usa valores diferentes que no existen en el enum:

- `analfabeta` (no existe en DB → crearlo)
- `bachiller` (no existe en DB)
- `universitario` (no existe en DB, el equivalente es `profesional`)

Esto causa el error `invalid input value for enum nivel_educativo: "universitario"` al crear una persona.

## Solución

Actualizar `formOptions.ts` y `src/types/persona.ts` para que los valores coincidan exactamente con el enum de la base de datos.

### Cambios

**1. `src/data/formOptions.ts**` — Corregir `NIVELES_EDUCATIVOS`:

```
ninguno    → "Ninguno"
analfabeta → "Analfabeta"
primaria   → "Primaria"
secundaria → "Secundaria"
tecnico    → "Técnico"
tecnologo  → "Tecnólogo"
profesional→ "Universitario"
especializacion → "Especialización"
maestria   → "Maestría"
doctorado  → "Doctorado"
otro       → "Otro"
```

Eliminar  `bachiller`, `universitario` que no existen en el enum.

**2. `src/types/persona.ts**` — Actualizar el tipo `NivelEducativo` para que refleje los valores reales del enum DB.


| Archivo                   | Cambio                                                         |
| ------------------------- | -------------------------------------------------------------- |
| `src/data/formOptions.ts` | Reemplazar valores de `NIVELES_EDUCATIVOS` con los del enum DB |
| `src/types/persona.ts`    | Actualizar tipo `NivelEducativo`                               |
