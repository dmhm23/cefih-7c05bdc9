

# Plan: Sistema de Backups programables (DB + Storage)

## 1. Diagnóstico del proyecto

| Componente | Volumen actual | Crece con |
|---|---|---|
| Base de datos PostgreSQL | 37 tablas, 29 funciones, 31 enums, 14 triggers, RLS en todas | Matrículas, audit_logs, formato_respuestas |
| `audit_logs` | Tabla con mayor crecimiento (cada cambio en 22 entidades) | Uso diario |
| Storage (7 buckets) | ~14 MB hoy (firmas, documentos, certificados, adjuntos personal/MinTrabajo, facturas, logos) | Cada matrícula, certificado, evidencia |
| Datos críticos no en DB | Archivos binarios en buckets (firmas, PDFs, imágenes) | — |

**Conclusión:** un backup completo = **dump SQL del esquema `public`** + **copia de los 7 buckets**. Ambos componentes deben coordinarse en un mismo "snapshot" para que la restauración sea consistente (las rutas `storage_path` en DB deben corresponder a archivos existentes en buckets).

---

## 2. Arquitectura propuesta

```text
┌──────────────────────────────────────────────────────────────┐
│  UI Admin → /admin/backups                                   │
│    • Tabla de backups (fecha, tipo, tamaño, estado, descarga)│
│    • Botón "Crear backup ahora"                              │
│    • Programador (frecuencia + alcance)                      │
│  /admin/backups/importar                                     │
│    • Subir backup .zip → validar → restaurar                 │
│    • Modo: REEMPLAZAR (wipe+restore) | ENRIQUECER (upsert)   │
└──────────────────────────────────────────────────────────────┘
            │ invoke                          │ invoke
            ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────────┐
│ Edge: backup-runner  │         │ Edge: backup-restore     │
│  (service_role)      │         │  (service_role)          │
│  • Exporta DB → JSON │         │  • Lee manifest          │
│  • Copia buckets→ZIP │         │  • Valida versión        │
│  • Sube a bucket     │         │  • Restaura DB + Storage │
│    "system-backups"  │         │                          │
└──────────────────────┘         └──────────────────────────┘
            │                                 ▲
            ▼                                 │
┌──────────────────────────────────────────────────────────────┐
│ Bucket privado: system-backups/                              │
│   YYYY/MM/backup_<id>.zip   (manifest.json + data/ + files/) │
└──────────────────────────────────────────────────────────────┘
            ▲
            │
┌──────────────────────────────────────────────────────────────┐
│ pg_cron + pg_net  → llama edge function en horario programado│
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Formato del backup (clave para compatibilidad futura)

Usamos **export lógico en JSON** (no `pg_dump` binario), ya que Supabase Edge Functions no tienen acceso a `pg_dump`. Esto además garantiza **portabilidad entre versiones de Postgres y entre proyectos**.

**Estructura del .zip generado:**
```
backup_2026-04-16_uuid.zip
├── manifest.json          ← metadata: versión schema, fecha, tablas, conteos, hashes
├── schema.sql             ← snapshot del DDL actual (informativo, no se ejecuta en restore)
├── data/
│   ├── personas.json
│   ├── matriculas.json
│   ├── cursos.json
│   ├── ... (37 tablas)
│   └── audit_logs.json
└── files/                 ← solo si alcance = "completo"
    ├── firmas/...
    ├── documentos-matricula/...
    └── ...
```

**`manifest.json`** contiene:
- `version_schema`: hash de `information_schema.columns` del esquema public
- `version_app`: del package.json
- `tablas`: `[{ nombre, conteo, columnas: [...] }]`
- `buckets_incluidos`: lista
- `tamano_bytes`, `tamano_db`, `tamano_files`
- `created_at`, `created_by`

**Compatibilidad futura garantizada por:**
1. **JSON tabla por tabla** → si en el futuro agregas columnas, el restore las ignora (campos faltantes quedan en `default`).
2. **Manifest con versión de esquema** → el restore detecta diferencias y avisa antes de ejecutar.
3. **Orden de inserción topológico** definido por dependencias conocidas (personas→matriculas→documentos…) — codificado en una constante editable.
4. **No ejecutamos DDL** en restore: la estructura debe venir del proyecto. Solo se restauran datos.

---

## 4. Componentes a crear

### A. Migración SQL (estructura)

**Tablas nuevas (esquema `public`):**
- `system_backups` — registro de cada backup (id, tipo, alcance, tamano_bytes, tamano_db_bytes, tamano_files_bytes, storage_path, estado, error_msg, created_by, created_at, completed_at, manifest jsonb)
- `system_backup_schedules` — programaciones (id, nombre, frecuencia_cron, alcance: 'db_only'|'completo', activo, ultima_ejecucion, proxima_ejecucion, retener_n_ultimos, created_by)
- `system_backup_restore_logs` — auditoría de restauraciones (id, backup_id, modo: 'reemplazar'|'enriquecer', estado, tablas_afectadas jsonb, ejecutado_por, ejecutado_at)

**Bucket nuevo:**
- `system-backups` (privado)

**RLS:**
- Solo `superadministrador` puede leer/insertar/borrar. `administrador` solo lectura.

**Extensiones a habilitar:** `pg_cron`, `pg_net` (para programación).

### B. Edge Functions

1. **`backup-runner`** (verify_jwt = true, requiere superadmin):
   - Recibe `{ alcance: 'db_only' | 'completo', schedule_id?: uuid }`.
   - Crea fila en `system_backups` con estado `en_progreso`.
   - Para cada tabla pública (lista predefinida en orden seguro): `select * order by created_at` paginado de a 1000 → escribe a un stream JSON.
   - Si `alcance='completo'`: descarga todos los objetos de los 7 buckets vía `storage.from(bucket).list()` recursivo + `download()`.
   - Empaqueta en ZIP con `JSZip` o stream nativo.
   - Sube a `system-backups/YYYY/MM/<id>.zip`.
   - Actualiza `system_backups` con `tamano_bytes`, `manifest`, estado `completado`.
   - Si falla, marca `fallido` con `error_msg`.

2. **`backup-restore`** (verify_jwt = true, superadmin):
   - Recibe `{ backup_id: uuid, modo: 'reemplazar' | 'enriquecer', incluir_archivos: boolean, confirmacion_texto: string }`.
   - Valida que `confirmacion_texto === 'RESTAURAR'`.
   - Descarga el ZIP, lee `manifest.json`.
   - **Compara esquema actual vs manifest** → devuelve diff si hay incompatibilidades graves (tabla faltante en proyecto actual).
   - **Modo `reemplazar`**: por cada tabla, `DELETE FROM` (en orden inverso de dependencias) → luego `INSERT` desde JSON. Triggers se desactivan temporalmente con `ALTER TABLE ... DISABLE TRIGGER ALL` y se reactivan al final.
   - **Modo `enriquecer`**: `INSERT ... ON CONFLICT (id) DO NOTHING` para cada fila. Triggers permanecen activos.
   - Si `incluir_archivos`: re-sube cada archivo del ZIP a su bucket. Modo reemplazar: `upsert: true`. Modo enriquecer: solo si no existe.
   - Registra en `system_backup_restore_logs`.

3. **`backup-cleanup`** (cron interno):
   - Por cada schedule con `retener_n_ultimos`, elimina backups viejos (DB row + storage object).

### C. Programación (pg_cron)

Cuando el usuario crea un schedule en UI, el frontend llama a una edge function `backup-schedule-manager` que ejecuta:
```sql
select cron.schedule('backup_<id>', '<expresion_cron>', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/backup-runner',
    headers := '{"Authorization":"Bearer <service_role>","Content-Type":"application/json"}'::jsonb,
    body := '{"alcance":"completo","schedule_id":"<id>"}'::jsonb
  );
$$);
```
Al desactivar/eliminar un schedule, ejecuta `cron.unschedule('backup_<id>')`.

### D. UI

**`/admin/backups`** (nueva ruta dentro de `AdminGuard`):
- **Tabs:**
  - **Listado**: tabla con columnas `Fecha · Alcance · Tamaño · DB / Archivos · Estado · Origen (manual/programado) · Acciones (descargar, eliminar)`. Tamaño mostrado en GB/MB con color según volumen.
  - **Programaciones**: cards con cada schedule (nombre, próxima ejecución, frecuencia legible, alcance, retención). Botones crear/editar/pausar/eliminar.
  - **Importar**: zona de carga ZIP + selector de modo + checkbox "Incluir archivos" + input de confirmación + botón "Restaurar". Modal con diff de esquema antes de ejecutar.
- **Botón flotante "Crear backup ahora"** → invoca `backup-runner` con elección de alcance.

**Componentes nuevos:**
- `src/pages/admin/BackupsPage.tsx`
- `src/components/admin/backups/BackupsTable.tsx`
- `src/components/admin/backups/SchedulesManager.tsx`
- `src/components/admin/backups/ImportarBackupSection.tsx`
- `src/components/admin/backups/SchemaDiffDialog.tsx`
- `src/components/admin/backups/CrearBackupDialog.tsx`
- `src/hooks/useBackups.ts`
- `src/services/backupService.ts`
- `src/types/backup.ts`

**Acceso restringido**: solo `superadministrador` ve el tab/menú.

---

## 5. Almacenamiento — cómo funciona

- Los backups viven en **el mismo proyecto Supabase** (Lovable Cloud), bucket privado `system-backups`. Esto significa:
  - **Costo**: cada backup ocupa espacio en el plan de storage del proyecto. Hoy con ~14MB de archivos y ~37 tablas con poco volumen, un backup completo pesará pocos MB. A futuro crecerá con `audit_logs` y `documentos-matricula`.
  - **Riesgo**: si el proyecto Supabase se elimina, los backups se pierden. **Mitigación**: el botón "Descargar" permite bajar el ZIP localmente; recomendaremos al usuario descargar copias periódicamente o configurar un job futuro que las suba a un destino externo (Google Drive / S3) — esto queda como mejora opcional, no incluida en esta versión para evitar credenciales adicionales.
- **Política de retención**: cada schedule define `retener_n_ultimos` (ej: 7 diarios + 4 semanales). Job de limpieza borra los excedentes.
- **Cifrado**: Supabase Storage cifra en reposo por defecto. URLs de descarga son **firmadas (1h)**.

---

## 6. Garantías de seguridad para no afectar la plataforma

| Riesgo | Mitigación |
|---|---|
| Restore destruye datos productivos | Confirmación textual obligatoria (`escribir "RESTAURAR"`) + modo `enriquecer` por defecto + log permanente en `system_backup_restore_logs` |
| Restore con esquema incompatible | Diff de esquema antes de ejecutar; bloqueo si falta una tabla; warning si sobran columnas |
| Triggers disparan cascadas durante restore reemplazo | Se desactivan con `DISABLE TRIGGER ALL` y reactivan al final. Para enriquecer permanecen activos (correcto: queremos validaciones). |
| Backup en horario laboral satura DB | Lectura paginada de 1000 filas + sleep 50ms entre páginas |
| Ejecución concurrente | `system_backups` con índice único parcial sobre `estado='en_progreso'` para impedir dos backups simultáneos |
| Permisos | Solo superadmin puede crear/restaurar; edge functions verifican rol con JWT antes de ejecutar |
| Datos sensibles en backup descargable | El ZIP incluye PII; advertencia explícita en la UI antes de descargar |

---

## 7. Compatibilidad con futuras versiones

- **Agregar columnas a una tabla**: el restore lee JSON e inserta solo columnas existentes. Las nuevas columnas quedan en `default`. ✅
- **Agregar tablas**: backups antiguos no las contienen → quedan vacías al restaurar. ✅
- **Renombrar columnas**: requiere mapping. Definimos `manifest.migrations[]` con reglas de remapeo opcionales por versión.
- **Eliminar columnas**: el restore las ignora. ✅
- **Cambios de enums**: si un valor desaparece, el restore captura el error por fila y lo registra en `error_log` del restore sin abortar (modo tolerante).
- **Cambios en `auth.users`**: NO respaldamos `auth.*` porque es gestionado por Supabase. Solo respaldamos `perfiles` y `user_roles`. Los UUIDs deben coincidir con usuarios existentes; advertimos en restore.

---

## 8. Plan de implementación (orden)

| # | Paso | Notas |
|---|---|---|
| 1 | Migración SQL: tablas `system_backups`, `system_backup_schedules`, `system_backup_restore_logs`, bucket `system-backups`, RLS, habilitar `pg_cron`+`pg_net` | Sin riesgo, solo añade |
| 2 | Tipos TS + service + hooks | Capa de datos |
| 3 | Edge function `backup-runner` | Probar con backup manual pequeño |
| 4 | UI listado + crear backup manual + descarga + eliminar | Validar end-to-end |
| 5 | Edge function `backup-restore` con modos reemplazar/enriquecer + diff | Probar en proyecto de prueba primero |
| 6 | UI importar/restaurar | Con confirmación textual |
| 7 | Edge function `backup-schedule-manager` + UI de programaciones | Cron real |
| 8 | Edge function `backup-cleanup` + retención | Limpieza automática |
| 9 | Item en `AppSidebar` (solo superadmin) | Acceso |

---

## 9. Lo que NO se toca

- Ninguna tabla existente del negocio.
- Ninguna función o trigger existente.
- Ningún flujo de matrícula, cartera, certificación, portal estudiante.
- Ningún bucket existente (solo se crea `system-backups` nuevo).

---

## 10. Aclaración importante antes de implementar

El alcance es grande (3 edge functions, 9 archivos UI nuevos, 3 tablas, programación cron). Implementar todo en un solo paso es viable pero arriesgado. **Recomendación**: ejecutar los pasos 1–4 en una primera entrega (backup manual completo y funcional) y validar en producción antes de continuar con restauración (5–6) y programación (7–9).

¿Implementamos completo o por fases?

