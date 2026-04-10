

# Plan: Convertir Entrenador y Supervisor a dropdowns en el panel lateral de cursos

## Diagnóstico

En `CursoDetailSheet.tsx` (líneas 147-157), los campos "Entrenador" y "Supervisor" usan `EditableField` sin `type="select"` ni `options`, por lo que se renderizan como inputs de texto libre. Esto contrasta con `CourseInfoCard.tsx`, donde ya se implementó correctamente usando `usePersonalByTipoCargo` para obtener las opciones del dropdown.

## Solución

Replicar el mismo patrón que ya funciona en `CourseInfoCard.tsx`:

1. Importar `usePersonalByTipoCargo` desde `@/hooks/usePersonal`
2. Obtener entrenadores y supervisores con el hook
3. Crear opciones con `useMemo`
4. Cambiar ambos `EditableField` a `type="select"` con las opciones correspondientes
5. Usar `value={getValue("entrenadorId")}` / `getValue("supervisorId")` en lugar de los campos `*Nombre`
6. Al cambiar, actualizar tanto el `Id` como el `Nombre` (igual que en `CourseInfoCard`)

## Cambio

| Archivo | Cambio |
|---------|--------|
| `src/components/cursos/CursoDetailSheet.tsx` | Importar `usePersonalByTipoCargo`, agregar hooks + memos para opciones, convertir Entrenador y Supervisor a `type="select"` con handlers que actualicen id y nombre |

**Total: 1 archivo, 0 migraciones**

