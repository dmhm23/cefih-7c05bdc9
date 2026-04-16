

## Análisis de los logs

**Diagnóstico:**
- Throughput estable en **~4 reg/s** (~230ms/registro)
- ETA total: ~165 segundos para 660 registros (~2:45 min)
- Cada `INSERT` ejecuta: 1 round-trip HTTP a Supabase + RLS + trigger de auditoría + trigger de validación de contacto emergencia + retorno con `.select()`

**¿Es normal?** Sí, dado que el código actual hace **1 request HTTP por fila secuencialmente**. Los 230ms son razonables (50-100ms latencia red + 100-150ms procesamiento DB con triggers). El cuello de botella **no es la base de datos**, es la **arquitectura del cliente**.

**Cálculo:** 660 reqs × 230ms = ~152s (coincide con la ETA observada).

## Oportunidades de optimización

| Estrategia | Mejora estimada | Complejidad |
|---|---|---|
| **A. Batch inserts** (50-100 filas por request) | 10-20× más rápido (~10-15s para 660) | Media |
| **B. Concurrencia limitada** (5-10 inserts en paralelo) | 3-5× más rápido (~30-50s) | Baja |
| **C. RPC server-side** (función plpgsql que recibe array y hace bulk insert) | 20-30× más rápido (~5-8s) | Alta |

**Recomendación: combinar A + B.** Batch insert de Supabase (`.insert([...])` acepta arrays) elimina N round-trips, y procesar varios batches en paralelo aprovecha mejor la conexión.

## Plan de implementación

### 1. Refactor `personaService.createBulk` y `upsertBulk`

Reemplazar el `for` secuencial por procesamiento en **chunks de 100 filas** con inserción batch:

```typescript
// Pseudocódigo
const CHUNK_SIZE = 100;
for (chunk of chunks(personas, CHUNK_SIZE)) {
  const t0 = performance.now();
  onLog('debug', `Insertando lote de ${chunk.length} registros...`);
  const { data, error } = await supabase
    .from('personas')
    .insert(chunk.map(mapPersonaToDb))
    .select('id, numero_documento');
  
  if (error) {
    // Fallback: si el lote falla, reintentar fila por fila para identificar la culpable
    onLog('warn', `Lote falló, reintentando individualmente...`);
    for (row of chunk) { await this.create(row).catch(...) }
  } else {
    onLog('success', `Lote OK: ${data.length} en ${dt}ms (${Math.round(dt/data.length)}ms/reg)`);
  }
}
```

**Ventajas:**
- Reduce 660 requests → ~7 requests
- Mantiene logging detallado por lote + tiempos por registro promedio
- Si un lote falla, hace fallback individual para no perder los buenos
- Compatible con la lógica de `existingDocs` (filtrar antes de batchear)

### 2. Mismo patrón en `empresaService`

Replicar el cambio para mantener paridad.

### 3. Logs ajustados

Los logs actuales son por fila — al usar batches se vuelven menos granulares pero más útiles:

```
[00:00.500] info Lote 1/7 (100 reg) → OK en 1.2s (12ms/reg)
[00:01.700] info Lote 2/7 (100 reg) → OK en 1.1s (11ms/reg)
...
[00:08.000] info ✓ 660 creados | Tiempo total: 7.8s | Promedio: 12ms/reg
```

Si un lote tiene errores, se loggea fila por fila como hoy.

### 4. Configuración

Constante exportada `BULK_CHUNK_SIZE = 100` para ajustar fácilmente. Supabase soporta hasta ~1000 filas por insert pero 100 es un buen equilibrio entre throughput y memoria/payload.

## Resultado esperado

- **Antes:** 660 registros en ~2:45 min (4 reg/s)
- **Después:** 660 registros en ~8-15 segundos (50-80 reg/s)
- **Mejora:** ~15-20× más rápido

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/services/personaService.ts` | Refactor `createBulk` y `upsertBulk` con batch inserts + fallback individual |
| `src/services/empresaService.ts` | Mismo patrón |

