

# Plan: Impedir eliminación de personas con matrículas asociadas

## Problema

El servicio `personaService.delete` ejecuta un soft-delete sin verificar si la persona tiene matrículas activas. Además, el `catch` en `PersonasPage` muestra un mensaje genérico "Error al eliminar".

## Solución

Agregar una verificación en `personaService.delete` que consulte la tabla `matriculas` antes de proceder. Si existen matrículas asociadas (no eliminadas), lanzar un `ApiError` con mensaje descriptivo. Luego, en `PersonasPage`, mostrar `err.message` en el toast (mismo patrón ya aplicado en niveles y tarifas).

## Cambios

### 1. `src/services/personaService.ts` — Verificar matrículas antes de eliminar

```typescript
async delete(id: string): Promise<void> {
  // Verificar si tiene matrículas asociadas
  const { count, error: countError } = await supabase
    .from('matriculas')
    .select('id', { count: 'exact', head: true })
    .eq('persona_id', id)
    .is('deleted_at', null);

  if (countError) handleSupabaseError(countError);
  if ((count ?? 0) > 0) {
    throw new ApiError(
      'No se puede eliminar: esta persona tiene matrículas asociadas',
      400,
      'PERSONA_CON_MATRICULAS'
    );
  }

  // Soft delete
  const { error } = await supabase
    .from('personas')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
},
```

### 2. `src/pages/personas/PersonasPage.tsx` — Mostrar mensaje específico en ambos catch

En `handleDelete` y `handleBulkDelete`, cambiar el catch genérico por:

```typescript
} catch (err: any) {
  toast({ title: err?.message || "Error al eliminar", variant: "destructive" });
}
```

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/services/personaService.ts` | Verificar matrículas antes del soft-delete |
| `src/pages/personas/PersonasPage.tsx` | Usar `err.message` en catch de delete individual y masivo |

**Total: 2 archivos editados, 0 migraciones**

