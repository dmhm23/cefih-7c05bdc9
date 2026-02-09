
# Buscador en dropdowns y apertura hacia abajo

## Resumen

Los dropdowns del panel lateral usan el componente `Select` de Radix, que no tiene buscador y puede abrirse hacia arriba. La solucion es modificar el componente `EditableField` para que:

1. Cuando un dropdown tiene **mas de 5 opciones**, use el componente `Combobox` (ya existente en el proyecto) que incluye un campo de busqueda integrado.
2. Cuando tiene **5 o menos opciones**, siga usando `Select` pero forzando la apertura hacia abajo con `side="bottom"`.

## Dropdowns afectados

| Campo | Opciones | Componente a usar |
|---|---|---|
| Tipo de Documento | 5 | Select (hacia abajo) |
| Genero | 2 | Select (hacia abajo) |
| Pais de Nacimiento | 44 | Combobox (con buscador) |
| Grupo Sanguineo | 8 | Combobox (con buscador) |
| Nivel Educativo | 10 | Combobox (con buscador) |
| Area de Trabajo | 2 | Select (hacia abajo) |
| Sector Economico | 20 | Combobox (con buscador) |

## Detalle tecnico

### Archivo: `src/components/shared/EditableField.tsx`

1. Importar el componente `Combobox` de `@/components/ui/combobox`
2. En el bloque `type === "select"` (lineas 141-163), agregar logica condicional:
   - Si `options.length > 5`: renderizar `Combobox` con las mismas props (`value`, `onValueChange`, `options`)
   - Si `options.length <= 5`: mantener `Select` actual pero agregar `side="bottom"` al `SelectContent`
3. Aplicar estilos consistentes al `Combobox` para que se integre visualmente (altura `h-8`, sin borde, hover sutil)

### Archivo: `src/components/ui/combobox.tsx`

No requiere cambios funcionales. El componente ya soporta busqueda y las props necesarias (`options`, `value`, `onValueChange`, `placeholder`).

### Cambio en SelectContent

```typescript
<SelectContent side="bottom">
```

Esto fuerza a Radix a abrir el dropdown hacia abajo siempre, evitando que se abra hacia arriba y oculte opciones.
