

# Plan: Resolver la resolución de nombres de nivel en toda la plataforma

## Causa raíz

Hay **un solo problema** que se manifiesta en múltiples lugares: las funciones `resolveNivelCursoLabel()` y `resolveNivelFormacionLabel()` dependen de un **caché síncrono global** que puede no estar cargado al momento del render. Cuando el caché está vacío, reciben un UUID y lo devuelven tal cual, o reciben un slug legacy como `"trabajador_autorizado"` y lo mapean al label hardcoded (de ahí que todo diga "Trabajador Autorizado").

El fix aplicado a `CourseInfoCard` y `CursoDetailSheet` (usar niveles del hook local) fue correcto pero **no se propagó** a todos los puntos que usan estas funciones.

## Lugares afectados

| Archivo | Línea | Problema |
|---|---|---|
| `CourseHeader.tsx` | 27 | Usa `resolveNivelCursoLabel(curso.tipoFormacion)` — pasa slug legacy, no UUID |
| `CursosListView.tsx` | 113, 305 | `getCursoLabel` y columna "Tipo Formación" usan cache síncrono |
| `MatriculasPage.tsx` | 405 | Columna "Nivel Formación" usa `resolveNivelFormacionLabel` con cache |
| `MatriculaDetailSheet.tsx` | 276, 427 | Título y campo usan cache síncrono |
| `MatriculaDetallePage.tsx` | 701 | Campo nivel usa cache síncrono |
| `PersonaDetailSheet.tsx` | 321 | Historial de matrículas usa cache |
| `PersonaDetallePage.tsx` | 290 | Historial de matrículas usa cache |
| `CursosCalendarioView.tsx` | (pendiente revisar) | Posiblemente afectado también |

## Solución: helper local reutilizable

En lugar de repetir el `useMemo` en cada componente, crear **un hook** que encapsule la resolución:

```typescript
// src/hooks/useResolveNivel.ts
export function useResolveNivel() {
  const { data: niveles = [] } = useNivelesFormacion();
  
  const resolve = useCallback((id?: string, legacySlug?: string) => {
    if (id) {
      const found = niveles.find(n => n.id === id);
      if (found) return found.nombreNivel;
    }
    if (legacySlug) {
      const found = niveles.find(n => n.id === legacySlug);
      if (found) return found.nombreNivel;
    }
    return LEGACY_LABELS[legacySlug || ''] || legacySlug || id || '';
  }, [niveles]);
  
  return resolve;
}
```

Luego reemplazar todas las llamadas a `resolveNivelCursoLabel` y `resolveNivelFormacionLabel` por este hook en los componentes que ya tienen acceso a React.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useResolveNivel.ts` | **Nuevo** — hook que resuelve nivel usando datos del query |
| `src/components/cursos/CourseHeader.tsx` | Usar hook, pasar `nivelFormacionId` en vez de `tipoFormacion` |
| `src/components/cursos/CursosListView.tsx` | Usar hook para `getCursoLabel` y columna "Tipo Formación" |
| `src/components/cursos/CursosCalendarioView.tsx` | Usar hook para labels en calendario |
| `src/components/cursos/CourseInfoCard.tsx` | Simplificar: usar hook en vez de `useMemo` manual |
| `src/components/cursos/CursoDetailSheet.tsx` | Simplificar: usar hook |
| `src/pages/matriculas/MatriculasPage.tsx` | Columna "Nivel Formación": usar hook |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Título y campo: usar hook |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Campo nivel: usar hook |
| `src/components/personas/PersonaDetailSheet.tsx` | Historial: usar hook |
| `src/pages/personas/PersonaDetallePage.tsx` | Historial: usar hook |

## Lo que NO se toca

- `resolveNivelLabel.ts` — se mantiene para contextos no-React (CSV export, etc.)
- Base de datos — no requiere cambios
- Servicios — no requiere cambios
- El `useNivelesFormacion` subyacente comparte cache de React Query, así que no hay queries duplicadas

