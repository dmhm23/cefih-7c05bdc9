

# Plan: Corregir nombre del nivel de formación en vistas de curso

## Causa raíz

Hay dos problemas distintos:

1. **Panel deslizable (`CursoDetailSheet.tsx`, línea 150)**: Pasa `getValue("tipoFormacion")` a `resolveNivelCursoLabel()`. El campo `tipoFormacion` contiene un key legacy como `"trabajador_autorizado"`, no el UUID del nivel. Debería usar `curso.nivelFormacionId` (el UUID) para resolver el nombre correcto, igual que hace `CourseInfoCard`.

2. **Vista completa (`CourseInfoCard.tsx`, línea 88)**: Usa correctamente `curso.nivelFormacionId || getValue("tipoFormacion")`, pero `resolveNivelCursoLabel()` depende de un **caché síncrono** que puede no estar cargado cuando el componente renderiza. Cuando el caché está vacío, la función recibe un UUID y no lo encuentra, así que lo devuelve crudo (el UUID como texto).

   Ambos componentes ya tienen `useNivelesFormacion()` cargado con los datos de niveles. La solución correcta es **usar los niveles del hook directamente** para resolver el nombre, en lugar de depender de la función de caché global.

## Solución

### `CursoDetailSheet.tsx`
- Línea 150: Cambiar `resolveNivelCursoLabel(getValue("tipoFormacion"))` por una resolución local usando el array `niveles` que ya tiene cargado el componente.
- Línea 76 (título): Ya usa `curso.nivelFormacionId || curso.tipoFormacion` — verificar que también se resuelva con datos locales.

### `CourseInfoCard.tsx`
- Línea 88: Reemplazar `resolveNivelCursoLabel(...)` por una resolución local: buscar el nivel en el array `niveles` por UUID y mostrar `nombreNivel`.

### Lógica de resolución local (ambos archivos)
```typescript
const nivelLabel = useMemo(() => {
  const id = curso.nivelFormacionId;
  if (id) {
    const found = niveles.find(n => n.id === id);
    if (found) return found.nombreNivel;
  }
  // Fallback legacy
  return resolveNivelCursoLabel(curso.tipoFormacion);
}, [curso.nivelFormacionId, curso.tipoFormacion, niveles]);
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/cursos/CursoDetailSheet.tsx` | Usar `niveles` del hook para resolver el displayValue del campo "Tipo de Formación" y el título |
| `src/components/cursos/CourseInfoCard.tsx` | Usar `niveles` del hook para resolver el displayValue en lugar de `resolveNivelCursoLabel` |

## Archivos que NO se tocan
- `resolveNivelLabel.ts` — se mantiene para otros contextos donde no hay hook disponible.
- No se modifica ningún servicio ni base de datos.

