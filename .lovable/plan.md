## Análisis

Actualmente el flujo de importación masiva (en `ImportarPersonasDialog` y `ImportarEmpresasDialog`) ejecuta un `for` secuencial llamando a `service.create()` o `service.update()` por cada fila. Solo reporta progreso (current/total) pero el usuario no sabe:

- Qué fila se está procesando
- Cuánto tarda cada operación
- Si está creando, actualizando u omitiendo
- Dónde están los cuellos de botella (parseo, check BD, inserts)
- Qué errores específicos ocurrieron

Para procesos de 2600+ registros esto es crítico para diagnosticar lentitud (probable causa: 1 request HTTP por fila a Supabase = ~200-500ms por registro).

## Solución

Crear un **panel de logs en tiempo real** debajo de la barra de progreso, alimentado por un sistema reutilizable de logging.

### Componentes nuevos


| Archivo                                     | Propósito                                                                                                                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useImportLogger.ts`              | Hook que mantiene array de logs en estado, con `log(level, message, meta?)` y `clear()`. Niveles: `info`, `success`, `warn`, `error`, `debug`. Cada entrada incluye timestamp ms relativo al inicio. |
| `src/components/shared/ImportLogsPanel.tsx` | Panel scrolleable con altura fija (~150px), estilo terminal (mono font, fondo oscuro suave). Auto-scroll al final. Icono+color por nivel. Botón "Copiar logs" y "Descargar .txt". Filtro por nivel.  |


### Cambios en componentes existentes


| Archivo                                              | Cambio                                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/shared/ImportProgress.tsx`           | Aceptar prop opcional `logs` y renderizar `ImportLogsPanel` debajo de la barra.                                                                                         |
| `src/components/personas/ImportarPersonasDialog.tsx` | Instanciar `useImportLogger` y emitir logs en cada fase: parseo, check BD, por cada fila (con tiempo de ejecución), errores. Limpiar logs al iniciar nueva importación. |
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Mismo patrón.                                                                                                                                                           |
| `src/services/personaService.ts`                     | Aceptar callback opcional `onLog(level, msg, meta)` en `createBulk` y `upsertBulk` para reportar inicio/fin de cada operación con tiempos.                              |
| `src/services/empresaService.ts`                     | Mismo patrón.                                                                                                                                                           |


### Detalle de logs emitidos

Durante la importación se generarán entradas como:

```
[00:00.000] INFO   Iniciando importación de 2600 registros
[00:00.012] DEBUG  Validando duplicados intra-archivo
[00:00.045] WARN   3 duplicados detectados en archivo
[00:00.089] DEBUG  Consultando BD por documentos existentes...
[00:01.234] INFO   1.1s — 47 registros ya existen en BD
[00:01.235] INFO   Modo: omitir existentes
[00:01.235] INFO   Procesando 2550 nuevos registros
[00:01.456] DEBUG  [1/2550] Insertando "Juan Pérez" (CC 1234)
[00:01.687] SUCCESS [1/2550] OK en 231ms
[00:01.688] DEBUG  [2/2550] Insertando "María Gómez" (CC 5678)
[00:01.912] SUCCESS [2/2550] OK en 224ms
...
[00:02.500] ERROR  [10/2550] Falló "X Y" — duplicate key violation
...
[09:45.000] INFO   ═══ Resumen ═══
[09:45.000] INFO   ✓ 2540 creados | ⚠ 47 omitidos | ✗ 13 errores
[09:45.000] INFO   Tiempo total: 9m 44s — promedio 229ms/registro
```

Cada 10 registros se emitirá también un log de "throughput" (registros/segundo) para identificar degradación.

### UI del panel

```text
┌─ Logs detallados ──────────[Filtro ▾][Copiar][↓]┐
│ [00:01.456] ▶ [1/2550] Insertando "Juan..."     │
│ [00:01.687] ✓ [1/2550] OK en 231ms              │
│ [00:01.688] ▶ [2/2550] Insertando "María..."    │
│ [00:01.912] ✓ [2/2550] OK en 224ms              │
│ [00:02.500] ✗ [10/2550] Falló: duplicate key    │
│   ...                                            │
└──────────────────────────────────────────────────┘
```

- Altura fija ~180px con scroll interno
- Auto-scroll al final mientras hay actividad nueva (se detiene si el usuario hace scroll arriba manualmente)
- Filtro multi-select de niveles
- Botón copiar al portapapeles + descargar como `import-log-{timestamp}.txt`  
`nota adicional. ponle un icono de copiar al darle clic copia todo el log completo disponible`

### Consideraciones de rendimiento

- Usar buffer interno con `flushSync`/throttle a ~10 logs/render para no saturar React con 2600 updates
- Almacenar máximo 5000 entradas en memoria (rotar las más antiguas)
- Los logs se preservan después de terminar la importación para revisión y descarga

### Reutilización futura

El `useImportLogger` + `ImportLogsPanel` quedan en `shared/` listos para conectar a futuros importadores (cursos, matrículas, etc.) con la misma firma.