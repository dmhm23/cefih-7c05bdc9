

# Plan: Corregir formato del nombre del curso y dropdown vacío de niveles

## Problemas identificados

### 1. Orden del nombre del curso
En `CursosListView.tsx` (línea 107) y `CursoDetailSheet.tsx` (línea 58), el label se construye como:
```
{nivelNombre} — #{numeroCurso}
```
El usuario necesita:
```
{numeroCurso}—{nivelNombre}
```

### 2. Dropdown de niveles vacío
En `CursoDetailSheet.tsx` (línea 32) y `CourseInfoCard.tsx` (línea 10), las opciones se calculan **una sola vez al cargar el módulo**:
```typescript
const TIPO_FORMACION_OPTIONS = getNivelesAsOptions();
```
`getNivelesAsOptions()` lee de `_cache`, que se llena de forma asíncrona. Si el módulo se importa antes de que la cache esté lista, `_cache` es `null` y retorna `[]`. Como es una constante a nivel de módulo, nunca se recalcula.

---

## Solución

### 1. Invertir el orden del label (3 archivos)

En `CursosListView.tsx`, `CursoDetailSheet.tsx` y `CursosCalendarioView.tsx`, cambiar el formato de:
```typescript
`${resolveNivelCursoLabel(...)} — #${curso.numeroCurso}`
```
a:
```typescript
`${curso.numeroCurso}—${resolveNivelCursoLabel(...)}`
```

### 2. Mover las opciones del dropdown dentro del componente (2 archivos)

En `CursoDetailSheet.tsx` y `CourseInfoCard.tsx`, mover `getNivelesAsOptions()` de constante de módulo a un `useMemo` dentro del componente, recalculándose cuando la cache de niveles cambie:

```typescript
// Antes (nivel de módulo, se ejecuta 1 vez):
const TIPO_FORMACION_OPTIONS = getNivelesAsOptions();

// Después (dentro del componente, se recalcula):
const tipoFormacionOptions = useMemo(() => getNivelesAsOptions(), [nivelesLoaded]);
```

Para detectar cuándo la cache está lista, usar `useNivelesFormacion()` (que ya existe y hace la query con React Query) y derivar las opciones de esos datos, o simplemente llamar `getNivelesAsOptions()` dentro del render (ya que para ese momento la cache estará poblada por la precarga que ocurre en la app).

La solución más simple y robusta: usar el hook `useNivelesFormacion` que ya existe y derivar las opciones directamente de sus datos:

```typescript
const { data: niveles = [] } = useNivelesFormacion();
const tipoFormacionOptions = useMemo(
  () => niveles.map(n => ({ value: n.id, label: n.nombre })),
  [niveles]
);
```

Esto elimina la dependencia de la cache síncrona y siempre tendrá datos actualizados.

---

## Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/cursos/CursosListView.tsx` | Invertir orden del label a `{numero}—{nivel}` |
| `src/components/cursos/CursoDetailSheet.tsx` | Invertir orden del label + mover opciones a `useNivelesFormacion` |
| `src/components/cursos/CourseInfoCard.tsx` | Mover opciones a `useNivelesFormacion` |
| `src/components/cursos/CursosCalendarioView.tsx` | Invertir orden del label (si aplica) |

**Total: 3-4 archivos editados, 0 migraciones**

