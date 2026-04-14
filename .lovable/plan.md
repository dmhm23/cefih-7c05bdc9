

# Plan: Corregir error de guardado de formatos

## Causa raíz confirmada

El error proviene de un **desajuste entre el frontend y la base de datos** en el campo `asignacion_scope`:

- **Frontend** define `AsignacionScope = 'todos' | 'nivel_formacion'` y el store tiene como valor por defecto `'todos'`
- **Base de datos** el enum `scope_formato` solo acepta `'nivel_formacion'` y `'tipo_curso'`

Cuando se intenta insertar un formato nuevo, Postgres rechaza el valor `'todos'` con un error de violación de enum. El `catch` genérico en `FormatoEditorPage.tsx` (línea 188) descarta el mensaje real y muestra solo "Error al guardar".

## Segundo problema: error opaco

El `catch` no captura ni muestra el mensaje del error de Supabase, por lo que es imposible diagnosticar desde la UI.

## Solución

### 1. Alinear el enum de BD con el frontend

Agregar el valor `'todos'` al enum `scope_formato` en la base de datos. Esto es correcto semánticamente: un formato con scope `'todos'` aplica sin restricción de nivel ni tipo.

```sql
ALTER TYPE public.scope_formato ADD VALUE IF NOT EXISTS 'todos';
```

### 2. Mejorar la observabilidad del error de guardado

En `FormatoEditorPage.tsx`, capturar el mensaje real del error y mostrarlo en el toast:

```typescript
} catch (err: any) {
  const msg = err?.message || 'Error al guardar';
  toast({ title: msg, variant: 'destructive' });
}
```

## Archivos que se modifican

| Archivo | Cambio |
|---|---|
| Migración SQL | `ALTER TYPE scope_formato ADD VALUE 'todos'` |
| `src/pages/formatos/FormatoEditorPage.tsx` | Capturar y mostrar el mensaje real del error |
| `src/types/formatoFormacion.ts` | Agregar `'tipo_curso'` a `AsignacionScope` para paridad completa con BD |

## Archivos que NO se tocan

Todo lo demás permanece igual. No se requieren cambios en el store, el servicio ni los componentes del editor.

