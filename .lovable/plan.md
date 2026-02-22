

## Corregir Title Case con vocales acentuadas

### Problema

La funcion `capitalize()` usa la regex `\b\w` para detectar inicio de palabra. En JavaScript, `\b` (word boundary) no reconoce caracteres acentuados (o, e, i, n) como parte de una palabra. Esto causa que la letra despues de una vocal con tilde sea tratada como inicio de nueva palabra y se convierta a mayuscula.

Ejemplo: "construccion" → "ConstruccioN", "electrico" → "EleCTrico"

### Solucion

Reemplazar la regex por una que use un patron Unicode-aware, detectando solo el inicio real de cada palabra (despues de espacio o inicio de cadena):

```typescript
function capitalize(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
```

Esta regex `(^|\s)\S` solo convierte a mayuscula el primer caracter no-espacio que aparece despues de un espacio o al inicio de la cadena, evitando falsos positivos con vocales acentuadas.

### Archivo a modificar

- `src/utils/csvMinTrabajo.ts` — lineas 15-20, reemplazar la funcion `capitalize()`

