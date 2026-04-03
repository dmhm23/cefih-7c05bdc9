# Plan: Corregir persistencia de País/RH y título de matrículas en perfil persona

## Diagnóstico

### Problema 1: País de nacimiento y Grupo sanguíneo no se guardan

La tabla `personas` en la base de datos **no tiene** las columnas `pais_nacimiento` ni `rh`. El formulario las captura y el servicio `personaService.ts` las ignora silenciosamente (hardcodea `paisNacimiento: ''` y `rh: ''` en `mapPersonaRow`, y `mapPersonaToDb` no las incluye). Se necesita una migración para agregar estas columnas.

### Problema 2: Matrícula aparece sin título en el perfil de persona

El campo `empresa_nivel_formacion` en la tabla `matriculas` ahora almacena un **UUID** del nivel de formación (ej: `349b6196-bacc-40cc-b903-111ebf10a810`), pero el código de visualización usa `NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion]`, que es un diccionario de enums antiguos (`jefe_area`, `trabajador_autorizado`, etc.). El UUID no coincide con ninguna clave del diccionario, por lo que devuelve `undefined` y se muestra vacío.

## Solución

### Paso 1: Migración SQL — Agregar columnas `pais_nacimiento` y `rh`

```sql
ALTER TABLE public.personas ADD COLUMN pais_nacimiento text DEFAULT NULL;
ALTER TABLE public.personas ADD COLUMN rh text DEFAULT NULL;
```

### Paso 2: Actualizar `personaService.ts`

- En `mapPersonaRow`: leer `row.pais_nacimiento` y `row.rh` en lugar de hardcodear `''`
- En `mapPersonaToDb`: agregar mapeo de `paisNacimiento` → `pais_nacimiento` y `rh` → `rh`

### Paso 3: Resolver nombre del nivel de formación en matrículas

En `PersonaDetallePage.tsx` y `PersonaDetailSheet.tsx`, reemplazar el uso de `NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion]` por una resolución dinámica usando `resolveNivelLabel(m.empresaNivelFormacion)` (que ya consulta la tabla `niveles_formacion` con cache). Revisar que sucede en `niveles_formacion` . No traer  diccionario legacy.

## Archivos afectados


| Paso | Archivo                                          | Cambio                                              |
| ---- | ------------------------------------------------ | --------------------------------------------------- |
| 1    | 1 migración SQL                                  | Agregar `pais_nacimiento` y `rh` a `personas`       |
| 2    | `src/services/personaService.ts`                 | Mapear las 2 columnas nuevas en lectura y escritura |
| 3    | `src/pages/personas/PersonaDetallePage.tsx`      | Usar `resolveNivelLabel` para título de matrícula   |
| 3    | `src/components/personas/PersonaDetailSheet.tsx` | Usar `resolveNivelLabel` para título de matrícula   |


**Total: 1 migración, 3 archivos editados**