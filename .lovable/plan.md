

# Fix: Evento `firma_completada` sin implementar — formatos automáticos no se generan ni autocompletan firma

## Diagnóstico

Hay **tres problemas encadenados**:

### 1. `firmas_matricula` está vacía
La firma de Thomas Doe se capturó antes de que el fix anterior (eliminar `autorizaReutilizacion`) estuviera activo en el navegador. La firma quedó en `documentos_portal.firma_data` pero nunca se persistió en `firmas_matricula`.

### 2. No existe handler para el evento `firma_completada`
Los formatos "PTA" y "Registro de Asistencia" tienen `eventos_disparadores: ["firma_completada"]`, pero **no existe ningún trigger ni código** que procese este evento. Los triggers existentes solo manejan `asignacion_curso` y `cierre_curso`.

Cuando el estudiante firma y envía "Información del Aprendiz", debería ocurrir:
1. La firma se guarda en `firmas_matricula` ✓ (ya corregido)
2. Se crean `formato_respuestas` para los formatos disparados por `firma_completada` ✗ (no implementado)
3. Esos `formato_respuestas` se auto-completan con la firma reutilizada ✗ (no implementado)

### 3. Los formatos tienen `es_automatico = false`
Incluso si existiera el trigger, el trigger `autogenerar_formato_respuestas` filtra por `es_automatico = TRUE`.

## Plan de corrección

### Paso 1: Backfill — Persistir firma existente en `firmas_matricula`
Usar la herramienta de inserción de datos para mover la firma de Thomas Doe desde `documentos_portal` a `firmas_matricula`.

### Paso 2: Corregir `es_automatico` en los formatos afectados
Actualizar los dos formatos ("PTA" y "Registro de Asistencia") para que tengan `es_automatico = true`, ya que su `modo_diligenciamiento` es `automatico_sistema`.

### Paso 3: Implementar handler `firma_completada` en `portalDinamicoService.ts`
Después de persistir la firma en `firmas_matricula` (paso 3 actual del servicio), agregar lógica que:

1. Consulte `formatos_formacion` que tengan `eventos_disparadores @> '["firma_completada"]'` y coincidan con el nivel de la matrícula
2. Para cada formato encontrado, cree un `formato_respuestas` con estado `completado` y answers que incluyan la firma en el blockId correspondiente al bloque `signature_capture` del formato destino
3. Use `ON CONFLICT DO NOTHING` para idempotencia

```typescript
// Después de persistir firma en firmas_matricula:
if (firmaPayload && firmaPayload.esOrigenFirma) {
  // ... upsert firma existente ...
  
  // Disparar evento firma_completada
  await this.procesarEventoFirmaCompletada(
    matriculaId, formatoId, firmaPayload.firmaBase64, firmaPayload.tipoFirmante
  );
}
```

### Paso 4: Nueva función `procesarEventoFirmaCompletada`
En `portalDinamicoService.ts`:

1. Consultar formatos con `eventos_disparadores @> '["firma_completada"]'`, activos, no eliminados
2. Para cada formato, buscar el bloque `signature_capture` en sus `bloques`
3. Crear/actualizar `formato_respuestas` con `estado: 'completado'` y `answers: { [signatureBlockId]: firmaBase64 }`

### Paso 5: Backfill de formato_respuestas para Thomas Doe
Insertar las entradas `formato_respuestas` faltantes para los dos formatos automáticos, con la firma incluida en answers.

## Archivos afectados

| Recurso | Cambio |
|---|---|
| `src/services/portalDinamicoService.ts` | Agregar `procesarEventoFirmaCompletada` y llamarlo tras persistir firma |
| Data insert | Backfill `firmas_matricula` desde `documentos_portal` para casos existentes |
| Data update | Corregir `es_automatico = true` en los dos formatos |
| Data insert | Backfill `formato_respuestas` para Thomas Doe con firma en answers |

