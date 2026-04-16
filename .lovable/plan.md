

# Plan: Celdas copiables en importación de empresas

## Cambio

Hacer que las celdas de **Nombre**, **NIT** y los **errores expandidos** sean copiables con un clic, reutilizando el componente `CopyableCell` que ya existe en el proyecto.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Reemplazar texto plano de Nombre y NIT por `CopyableCell`. Agregar botón de copiar en la zona expandida de errores que copie todos los errores de esa fila como texto. |

## Detalle

1. **Nombre y NIT**: Envolver el valor con `<CopyableCell value={...} />` para que al hover aparezca el ícono de copiar (mismo patrón usado en otras tablas del sistema).

2. **Errores expandidos**: Agregar un botón pequeño "Copiar errores" en la fila expandida que copie al portapapeles el texto formateado: `Fila X: Error 1; Error 2`.

