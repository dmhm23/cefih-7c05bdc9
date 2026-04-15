

# Fix: Documentos duplicados al cambiar nivel de formación

## Causa raíz

El `useEffect` en `MatriculaDetallePage.tsx` que llama a `sincronizarDocumentos` se dispara dos veces antes de que `docsSynced` se actualice (React 18 batching + re-renders por cambio de `nivelFormacionId`). Ambas ejecuciones ven los mismos documentos existentes, ambas insertan los mismos documentos nuevos → duplicados.

**Evidencia**: Los duplicados tienen timestamps separados por ~133ms, confirmando dos llamadas concurrentes.

La tabla `documentos_matricula` no tiene constraint `UNIQUE(matricula_id, tipo)`, así que la base de datos no impide las inserciones duplicadas.

## Solución (dos capas)

### 1. DB: Constraint UNIQUE en `documentos_matricula`

Agregar un constraint `UNIQUE(matricula_id, tipo)` que impida duplicados a nivel de base de datos. Antes de crearlo, limpiar los duplicados existentes (conservar el más antiguo de cada tipo por matrícula).

```sql
-- Limpiar duplicados existentes (conservar el más antiguo)
DELETE FROM documentos_matricula
WHERE id NOT IN (
  SELECT DISTINCT ON (matricula_id, tipo) id
  FROM documentos_matricula
  ORDER BY matricula_id, tipo, created_at ASC
);

-- Prevenir duplicados futuros
ALTER TABLE documentos_matricula
  ADD CONSTRAINT uq_documentos_matricula_tipo
  UNIQUE (matricula_id, tipo);
```

### 2. Código: Usar `ON CONFLICT` en las inserciones

**`documentoService.ts`** — En `crearDocumentosMatricula` y `sincronizarDocumentos`, cambiar los `.insert()` para usar upsert o ignorar conflictos:

```typescript
// crearDocumentosMatricula: usar upsert con onConflict
const { data, error } = await supabase
  .from('documentos_matricula')
  .upsert(rows, { onConflict: 'matricula_id,tipo', ignoreDuplicates: true })
  .select();
```

Lo mismo en `sincronizarDocumentos` para la inserción de documentos nuevos.

### 3. Código: Guard de concurrencia en el useEffect

**`MatriculaDetallePage.tsx`** y **`MatriculaDetailSheet.tsx`** — Agregar un `useRef` de "syncing" para evitar llamadas concurrentes:

```typescript
const syncingRef = useRef(false);
useEffect(() => {
  if (!matricula?.id || syncingRef.current) return;
  if (docsSynced && nivelId === lastSyncedNivel) return;
  syncingRef.current = true;
  sincronizarDocumentos(matricula.id, nivelId)
    .then(...)
    .finally(() => { syncingRef.current = false; });
}, [...]);
```

## Archivos afectados

| Recurso | Cambio |
|---|---|
| DB migration | Limpiar duplicados + `UNIQUE(matricula_id, tipo)` |
| `src/services/documentoService.ts` | Upsert con `ignoreDuplicates` en ambas funciones |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Guard con `useRef` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Guard con `useRef` |

