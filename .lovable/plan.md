

# Plan: Corregir filtro de Nivel de Formación en /cursos

## Diagnóstico

El filtro de "Nivel de Formación" no funciona porque hay una incompatibilidad entre el valor que se selecciona y el campo contra el que se compara:

- **Opciones del filtro**: usan el UUID del nivel (`n.id`) como `value` (viene de `getNivelesAsOptions()`).
- **Comparación al filtrar** (línea 117): compara contra `c.tipoFormacion`, que es un enum string (`formacion_inicial`, `reentrenamiento`, etc.), no un UUID.

Resultado: UUID nunca es igual al enum string, por lo que ningún curso coincide al filtrar.

## Solución

En `CursosListView.tsx`, línea 117, cambiar la comparación para que use `nivelFormacionId`:

```typescript
// Antes:
const matchesNivel = filters.tipoFormacion === "todos" || c.tipoFormacion === filters.tipoFormacion;

// Después:
const matchesNivel = filters.tipoFormacion === "todos" || c.nivelFormacionId === filters.tipoFormacion;
```

Adicionalmente, hacer el dropdown reactivo (mismo patrón ya aplicado en `CursoDetailSheet` y `CourseInfoCard`): reemplazar `getNivelesAsOptions()` en `filterConfigs` por opciones derivadas de `useNivelesFormacion`, para evitar que el filtro aparezca vacío si la cache no está lista.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/cursos/CursosListView.tsx` | Comparar filtro contra `nivelFormacionId` en lugar de `tipoFormacion`; usar `useNivelesFormacion` para opciones reactivas del filtro |

**Total: 1 archivo editado, 0 migraciones**

