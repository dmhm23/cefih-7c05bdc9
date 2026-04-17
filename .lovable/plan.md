

## Continuación: Fases 5-9 del sistema de Backups

### Fase 5: Edge Function `backup-restore`
- Recibe `{ backup_id, modo: 'reemplazar'|'enriquecer', incluir_archivos, confirmacion_texto }`
- Valida superadmin + texto "RESTAURAR"
- Descarga ZIP de `system-backups`, lee `manifest.json`
- Compara esquema actual vs manifest → devuelve diff (tablas faltantes/extras)
- **Modo reemplazar**: borra en orden inverso (respetando FKs) → inserta desde JSON en orden topológico. Saneo de columnas inexistentes (las ignora)
- **Modo enriquecer**: `upsert` con `onConflict: 'id', ignoreDuplicates: true`
- Si `incluir_archivos`: re-sube objetos a buckets (upsert true en reemplazar, skip en enriquecer)
- Registra en `system_backup_restore_logs` con conteos y errores tolerantes

### Fase 6: UI de Importar/Restaurar
**Reemplazar tab "Importar" placeholder en `BackupsPage.tsx`** con `ImportarBackupSection.tsx`:
- Select del backup existente (lista de `system_backups` completados)
- Radio: Reemplazar (rojo, destructivo) | Enriquecer (verde, seguro)
- Checkbox "Incluir archivos del Storage"
- Modal de diff de esquema antes de ejecutar (tablas faltantes/extras)
- Input confirmación textual "RESTAURAR" obligatorio
- Botón ejecutar → invoca `backup-restore` → polling de logs

### Fase 7: Programaciones automáticas
**Edge Function `backup-schedule-manager`** (CRUD de schedules):
- `create`: inserta en `system_backup_schedules` + ejecuta `cron.schedule('backup_<id>', ...)` vía `pg_net.http_post` al `backup-runner`
- `update`: re-programa (unschedule + schedule)
- `delete`/`pause`: `cron.unschedule('backup_<id>')`

**UI nueva** `SchedulesManager.tsx` (reemplaza placeholder):
- Cards por schedule con: nombre, frecuencia legible, alcance, próxima ejecución, retención, switch activo
- Dialog crear/editar: presets (diario 02:00, semanal lunes 02:00, mensual día 1) + cron custom + alcance + `retener_n_ultimos`
- Acciones: pausar, editar, eliminar

### Fase 8: Limpieza por retención
**Edge Function `backup-cleanup`** (sin auth, llamada por cron interno):
- Por cada schedule activo con `retener_n_ultimos`, identifica backups excedentes (más viejos) y los elimina (storage + DB row)
- Cron diario 03:00 vía SQL helper

### Fase 9: Revisión final end-to-end
1. Verificar tablas, bucket, extensiones (`pg_cron`, `pg_net`) habilitadas
2. Listar edge functions desplegadas: `backup-runner`, `backup-restore`, `backup-schedule-manager`, `backup-cleanup`
3. Verificar rutas: `/admin/backups` accesible solo a superadmin
4. Revisar imports de los componentes nuevos sin errores
5. Validar que no se tocó ninguna tabla de negocio existente
6. Confirmar `AppSidebar` muestra item "Backups" solo a superadmin
7. Reportar checklist de cobertura: backup manual ✅, descarga ✅, eliminar ✅, restore reemplazar/enriquecer ✅, schedules ✅, retención ✅

## Archivos a crear

| Archivo | Propósito |
|---|---|
| `supabase/functions/backup-restore/index.ts` | Restauración con modos reemplazar/enriquecer |
| `supabase/functions/backup-schedule-manager/index.ts` | CRUD de schedules + pg_cron |
| `supabase/functions/backup-cleanup/index.ts` | Aplicar retención |
| `src/components/admin/backups/ImportarBackupSection.tsx` | UI restaurar |
| `src/components/admin/backups/SchemaDiffDialog.tsx` | Modal diff antes de restaurar |
| `src/components/admin/backups/SchedulesManager.tsx` | UI programaciones |
| `src/components/admin/backups/ScheduleFormDialog.tsx` | Crear/editar schedule |
| `src/hooks/useBackupSchedules.ts` | Hooks programaciones |
| `src/services/backupScheduleService.ts` | Service programaciones |
| Cron SQL inicial | Job diario `backup-cleanup` 03:00 UTC |

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/admin/BackupsPage.tsx` | Reemplazar placeholders de tabs Programaciones e Importar con componentes reales |
| `src/services/backupService.ts` | Añadir método `restaurar()` |
| `src/hooks/useBackups.ts` | Añadir mutation `restaurar` |
| `src/types/backup.ts` | (ya tiene los tipos necesarios) |

## Garantías

- Cero modificación a tablas/funciones/triggers de negocio
- Restore enriquecer es idempotente (`ON CONFLICT DO NOTHING`)
- Restore reemplazar pide confirmación textual obligatoria
- Diff de esquema bloquea restauraciones incompatibles (tablas críticas faltantes)
- Tolerancia a errores fila a fila: errores se registran pero no abortan el proceso
- Schedules cancelables sin afectar backups históricos
- Limpieza nunca borra backups manuales (solo aquellos vinculados a schedule con retención)

## Resultado esperado

Sistema de backups completo y operativo: crear, listar, descargar, eliminar, programar, retener, restaurar (2 modos), con auditoría completa y aislamiento de seguridad por rol.

