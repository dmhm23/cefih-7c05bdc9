

## Cambios solicitados

### 1. Ocultar el panel de logs en frontend

En ambos diálogos de importación (`ImportarPersonasDialog.tsx` y `ImportarEmpresasDialog.tsx`) la llamada a `<ImportProgress>` pasa `logs={logger.logs}`. Eso hace que `ImportProgress` renderice el `<ImportLogsPanel>` debajo de la barra.

**Acción:** quitar la prop `logs` (no pasarla) en ambos diálogos. El `useImportLogger` se conserva activo para que la lógica de `personaService.upsertBulk` / `empresaService.createBulk` siga funcionando sin romperse, pero el panel desaparece de la UI.

### 2. Estado "Completada" en verde cuando termina la carga

En `ImportProgress.tsx` cambiar el comportamiento visual cuando `current === total && total > 0`:

- Reemplazar el `Loader2` (spinner) por `CheckCircle2` en color verde (`text-green-600`).
- Cambiar el texto `"Importando…"` por `"Completada"`.
- Cambiar la barra `<Progress>` a un fondo verde (clase con `bg-green-500` aplicada al indicator vía `[&>div]:bg-green-500`).
- El conteo `X / Y (100%)` se mantiene, pero el `(100%)` también pasa a verde.

**Lógica:**
```tsx
const isComplete = total > 0 && current >= total;
// Render condicional según isComplete
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/shared/ImportProgress.tsx` | Estado "Completada" en verde cuando `current === total` |
| `src/components/personas/ImportarPersonasDialog.tsx` | Quitar prop `logs` del `<ImportProgress>` |
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Quitar prop `logs` del `<ImportProgress>` |

### Resultado

- Durante la importación: barra azul con spinner y "Importando personas… 145/660 (22%)"
- Al terminar: barra verde con check y "Completada 660/660 (100%)"
- Sin panel de logs en pantalla en ningún momento

