

# Plan: Detalle de errores en importación masiva de empresas

## Problema

La tabla de previsualización muestra los errores en una columna estrecha ("Estado") como texto rojo comprimido. Cuando hay múltiples errores por fila, se concatenan con `;` y resultan ilegibles. El usuario no puede identificar fácilmente qué empresa falló ni por qué.

## Solución

Mejorar la UX de la tabla de previsualización en `ImportarEmpresasDialog.tsx` con tres cambios:

### 1. Filtro rápido: ver solo filas con errores

Agregar tabs o toggle para alternar entre "Todas", "Válidas" y "Con errores", para que el usuario pueda concentrarse en las filas problemáticas sin buscar entre cientos de registros.

### 2. Errores expandibles por fila

Reemplazar el texto rojo comprimido en la columna "Estado" por un ícono clickeable que expanda una fila detalle debajo mostrando cada error como un item separado con descripción clara. Cada error aparecerá en su propia línea con un bullet.

### 3. Resaltar campos problemáticos

Agregar columnas adicionales a la tabla (Sector, ARL) para que el usuario vea los valores que causaron error. Los valores inválidos se mostrarán con fondo rojo suave.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Agregar filtro de filas, errores expandibles, columnas adicionales |

## Resultado esperado

- El usuario ve un resumen claro: "15 válidas, 3 con errores"
- Puede filtrar para ver solo las 3 con errores
- Al hacer clic en una fila con error, ve los problemas desglosados: "NIT duplicado en fila 5", "ARL 'Seguros X' no reconocida"
- Los campos con valores inválidos se resaltan visualmente

