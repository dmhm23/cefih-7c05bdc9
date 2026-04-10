# Plan: Corregir búsqueda de personas con nombres compuestos

## Diagnóstico

`personaService.search()` pasa la query completa (ej: "Juan Perez") a un `.or()` que busca ese texto exacto en cada columna individual. Como "Juan" está en `nombres` y "Perez" en `apellidos`, no encuentra resultados. Además, los espacios interfieren con la sintaxis PostgREST del `.or()`.

## Solución

Tokenizar la query por espacios. Para cada token, aplicar un `.or()` que busque en `nombres`, `apellidos`, `numero_documento` y `telefono`. Al encadenar múltiples `.or()` se logra AND entre tokens.

Ejemplo: "Juan Perez" → token "Juan" (OR en 4 columnas) AND token "Perez" (OR en 4 columnas).

## Cambios


| Archivo                          | Cambio                                                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/personaService.ts` | Refactorizar `search()` (líneas 108-118): dividir `query` en tokens por espacios, filtrar vacíos, y encadenar un `.or(...)` por cada token sobre la query de Supabase. Si la query no tiene tokens válidos, retornar array vacío. |


**Total: 1 archivo editado, 0 migraciones**