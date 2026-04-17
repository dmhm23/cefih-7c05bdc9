# Sistema de Backups — Documentación técnica

> Última actualización: 2026-04-17
> Alcance: explicar de forma exhaustiva cómo funciona el sistema de respaldos y restauración de la plataforma, cómo se implementó, y qué se debe hacer para mantenerlo cubriendo nuevas tablas, buckets o funcionalidades a futuro.

---

## 1. Visión general

El sistema permite generar **copias de seguridad lógicas** (no binarias) de toda la plataforma, almacenarlas dentro del propio proyecto Supabase (Lovable Cloud), descargarlas, eliminarlas, programarlas de forma recurrente, retenerlas con políticas configurables y restaurarlas posteriormente en dos modos: **reemplazo** (destructivo) o **enriquecimiento** (no destructivo).

Un backup es un **archivo ZIP** con tres partes:

```
backup_<fecha>_<uuid>.zip
├── manifest.json     ← metadata: versión, alcance, conteos, tablas y buckets incluidos
├── data/             ← un .json por cada tabla pública respaldada
│   ├── personas.json
│   ├── matriculas.json
│   └── ... (33 tablas)
└── files/            ← solo si alcance = "completo"
    ├── firmas/...
    ├── documentos-matricula/...
    └── ... (7 buckets)
```

Se eligió **export lógico en JSON** (en lugar de `pg_dump` binario) porque:

1. Las Edge Functions de Supabase no tienen acceso a `pg_dump`.
2. Garantiza **portabilidad entre versiones de Postgres** y entre proyectos.
3. Permite **tolerancia a cambios de esquema**: si una columna nueva se agrega después de generar el backup, el restore simplemente la deja con su valor `default` y sigue funcionando.

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│  UI Admin → /admin/backups   (visible solo a superadministrador) │
│   • Tab "Listado": tabla con backups históricos + descarga       │
│   • Tab "Programaciones": cards con schedules cron               │
│   • Tab "Importar": restauración con modo y confirmación         │
└──────────────────────────────────────────────────────────────────┘
            │  invoke                          │  invoke
            ▼                                  ▼
┌────────────────────────┐         ┌──────────────────────────────┐
│ Edge: backup-runner    │         │ Edge: backup-restore         │
│  • Valida superadmin   │         │  • Valida superadmin         │
│  • Exporta DB → JSON   │         │  • Exige texto "RESTAURAR"   │
│  • Copia buckets→ZIP   │         │  • Compara esquema vs manifest│
│  • Sube a              │         │  • Inserta/upsert por tabla  │
│   "system-backups"     │         │  • Re-sube archivos          │
└────────────────────────┘         └──────────────────────────────┘
            │                                 ▲
            ▼                                 │
┌──────────────────────────────────────────────────────────────────┐
│ Bucket privado: system-backups/                                  │
│   YYYY/MM/backup_<id>.zip                                        │
└──────────────────────────────────────────────────────────────────┘
            ▲
            │
┌──────────────────────────────────────────────────────────────────┐
│ pg_cron + pg_net  →  llaman edge functions en horarios programados│
│   • Cada schedule tiene su propia entrada en cron                │
│   • backup-cleanup corre diario 03:00 UTC para aplicar retención │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Componentes

| Componente | Tipo | Propósito |
|---|---|---|
| `system_backups` | Tabla DB | Registro de cada backup generado |
| `system_backup_schedules` | Tabla DB | Programaciones recurrentes |
| `system_backup_restore_logs` | Tabla DB | Auditoría de cada restauración |
| `system-backups` | Bucket privado | Almacena los ZIP generados |
| `backup-runner` | Edge Function | Genera un backup (manual o programado) |
| `backup-restore` | Edge Function | Restaura un backup en uno de dos modos |
| `backup-schedule-manager` | Edge Function | CRUD de schedules + manipula `pg_cron` |
| `backup-cleanup` | Edge Function | Aplica políticas de retención |
| `exec_sql` | RPC SQL (service_role) | Permite a las edge functions ejecutar SQL dinámico para `cron.schedule` / `cron.unschedule` |
| `pg_cron`, `pg_net` | Extensiones Postgres | Permiten programación nativa y llamadas HTTP desde la DB |

---

## 3. Modelo de datos

### 3.1 `system_backups`

Registro maestro de cada backup. Campos clave:

| Campo | Descripción |
|---|---|
| `alcance` | `db_only` o `completo` (incluye archivos de Storage) |
| `origen` | `manual` o `programado` |
| `estado` | `en_progreso`, `completado` o `fallido` |
| `schedule_id` | FK opcional al schedule que lo originó |
| `storage_path` | Ruta dentro del bucket `system-backups` |
| `tamano_bytes`, `tamano_db_bytes`, `tamano_files_bytes` | Métricas de tamaño |
| `tablas_count`, `filas_count`, `archivos_count` | Métricas de contenido |
| `manifest` | Snapshot JSON con la metadata completa del backup |
| `error_msg` | Mensaje de error si falló |
| `created_by`, `created_by_email` | Usuario que disparó el backup |

Se usa un **índice único parcial** sobre `estado='en_progreso'` para impedir que se ejecuten dos backups simultáneos.

### 3.2 `system_backup_schedules`

Programaciones recurrentes.

| Campo | Descripción |
|---|---|
| `nombre` | Etiqueta humana |
| `frecuencia_cron` | Expresión cron en **UTC** |
| `frecuencia_legible` | Descripción para mostrar (ej. "Diario a las 02:00 (Colombia)") |
| `alcance` | `db_only` o `completo` |
| `activo` | Si está activo, hay un job en `pg_cron`; si se pausa, se desprograma |
| `retener_n_ultimos` | Cantidad de backups a mantener (los más viejos se eliminan) |
| `ultima_ejecucion` | Timestamp de la última corrida |
| `created_by` | Usuario creador |

> **Zona horaria:** la UI permite elegir período (Diario/Semanal/Mensual) y hora en **zona horaria Colombia (UTC-5)**. Internamente se convierte a UTC antes de generar la cron, porque `pg_cron` opera siempre en UTC.

### 3.3 `system_backup_restore_logs`

Auditoría inmutable de cada intento de restauración.

| Campo | Descripción |
|---|---|
| `backup_id` | Backup utilizado como fuente |
| `modo` | `reemplazar` o `enriquecer` |
| `estado` | `en_progreso`, `completado`, `fallido` o `parcial` |
| `incluyo_archivos` | Si se restauraron también archivos de Storage |
| `tablas_afectadas` | JSON con conteos por tabla (`{ insertadas, omitidas, errores }`) |
| `filas_insertadas`, `filas_omitidas`, `archivos_restaurados` | Totales |
| `errores` | Array de mensajes registrados sin abortar |
| `ejecutado_por`, `ejecutado_por_email` | Quién ejecutó la restauración |

---

## 4. Generación de backups (`backup-runner`)

### 4.1 Disparadores

- **Manual**: desde la UI, un superadministrador presiona "Crear backup ahora" → `useBackups.createBackup()` → `supabase.functions.invoke("backup-runner", { body: { alcance } })`.
- **Programado**: `pg_cron` ejecuta `pg_net.http_post()` apuntando a `…/functions/v1/backup-runner` con `Authorization: Bearer <SERVICE_ROLE>` y body `{ alcance, schedule_id, origen: "programado" }`.

### 4.2 Validación

1. Si el token es el `SERVICE_ROLE_KEY`, se considera **programado** y se permite.
2. Si es un JWT de usuario, se decodifica y se verifica que el rol del perfil sea `superadministrador`. Cualquier otro rol → `403`.

### 4.3 Proceso

1. **Crear fila** en `system_backups` con estado `en_progreso` (esto puede fallar con `409` si ya hay otro en curso por el índice único parcial).
2. **Iterar `TABLAS_BACKUP`** (lista ordenada topológicamente por dependencias FK):
   - Para cada tabla, paginar `SELECT *` de a 1000 filas (hay un `await sleep(30ms)` entre páginas para no saturar la DB).
   - Serializar a JSON y guardar como `data/<tabla>.json` dentro del ZIP.
   - Acumular conteos (filas, bytes).
3. **Si alcance = `completo`**, recorrer `BUCKETS`:
   - Listar recursivamente los objetos con `storage.list(prefix)`.
   - Descargar cada uno con `storage.download(path)`.
   - Guardar como `files/<bucket>/<path>` en el ZIP.
4. **Generar `manifest.json`** con versión, fecha, alcance, conteos por tabla, buckets incluidos y totales.
5. **Empaquetar el ZIP** con `JSZip` (compresión DEFLATE nivel 6).
6. **Subir** el ZIP a `system-backups/YYYY/MM/<filename>.zip`.
7. **Actualizar la fila** del backup con métricas, `storage_path`, `manifest` y `estado='completado'`.

Si algo falla en el camino, se actualiza la fila con `estado='fallido'` y `error_msg`.

> Toda la generación se ejecuta dentro de `EdgeRuntime.waitUntil(...)` cuando está disponible, para devolver `202 Accepted` inmediatamente al cliente y procesar en background.

### 4.4 Tablas y buckets actualmente cubiertos

**Tablas (33):**

```
roles, rol_permisos, perfiles, cargos, personal, personal_adjuntos,
personas, empresas, contactos_empresa, responsables_pago,
niveles_formacion, curso_consecutivos, cursos, cursos_fechas_mintrabajo,
cursos_mintrabajo_adjuntos, formatos_formacion, plantillas_certificado,
plantilla_certificado_versiones, portal_config_documentos,
matriculas, documentos_matricula, documentos_portal, firmas_matricula,
formato_respuestas, certificados, excepciones_certificado,
grupos_cartera, grupo_cartera_matriculas, facturas, factura_matriculas,
pagos, actividades_cartera, comentarios, audit_logs
```

**Buckets (7):**

```
firmas, documentos-matricula, adjuntos-personal, facturas,
certificados, logos-formatos, adjuntos-mintrabajo
```

> **Importante:** las tres tablas del propio sistema de backups (`system_backups`, `system_backup_schedules`, `system_backup_restore_logs`) y el bucket `system-backups` **no se respaldan** intencionalmente, para evitar bucles. Tampoco se respaldan tablas de los esquemas `auth.*`, `storage.*`, `realtime.*`, `vault.*`, etc., porque son gestionados por Supabase.

---

## 5. Programaciones automáticas

### 5.1 Flujo

1. El superadmin abre la UI → tab "Programaciones" → "Nueva programación".
2. Elige **período** (Diario/Semanal/Mensual), **hora en Colombia**, **alcance** y **retención**.
3. La UI construye:
   - `frecuencia_cron` en **UTC** (sumando 5 horas a la hora local: `(hora_col + 5) mod 24`).
   - `frecuencia_legible` en hora Colombia para mostrar.
4. Llama a `backup-schedule-manager` con `action: "create"`.
5. La edge function:
   - Inserta una fila en `system_backup_schedules`.
   - Ejecuta vía `exec_sql` un `cron.schedule('backup_<uuid>', '<cron>', $$ select net.http_post(...) $$)` que llamará al `backup-runner` cada vez que toque.

### 5.2 Acciones soportadas

| Acción | Efecto |
|---|---|
| `create` | Inserta schedule + programa en `pg_cron` |
| `update` | Actualiza la fila + reprograma (`unschedule` + `schedule`) |
| `toggle` | Cambia `activo`. Si `false`, hace `cron.unschedule`; si `true`, lo vuelve a programar |
| `delete` | Elimina la fila + `cron.unschedule` |
| `run_now` | Llama directamente a `backup-runner` y actualiza `ultima_ejecucion` |

> Los backups históricos generados por una programación **no se eliminan** al borrar el schedule. Solo desaparece la programación futura.

---

## 6. Limpieza por retención (`backup-cleanup`)

Una entrada en `pg_cron` ejecuta esta función **diariamente a las 03:00 UTC** (22:00 Colombia).

Para cada schedule activo con `retener_n_ultimos = N`:

1. Lista los backups completados de ese schedule, ordenados por fecha descendente.
2. Identifica los excedentes (los que están en posición `> N`).
3. Por cada excedente:
   - Elimina el objeto del bucket `system-backups`.
   - Elimina la fila de `system_backups`.

> **Los backups manuales (origen='manual') nunca son eliminados por este proceso.** Solo se borran si el superadmin lo hace explícitamente desde la UI.

---

## 7. Restauración (`backup-restore`)

Operación crítica con múltiples capas de protección.

### 7.1 Validaciones previas

1. Sólo `superadministrador` puede invocarla.
2. La UI exige escribir literalmente la palabra `RESTAURAR` en un input antes de habilitar el botón.
3. Antes de ejecutar, la UI llama a `compararEsquema(backup_id)` que abre el `manifest.json` y lo compara con el esquema actual:
   - **Tablas críticas faltantes** en la DB actual → bloqueo total (no se puede restaurar).
   - **Tablas extras** o **columnas extras** en cualquiera de los lados → warning visual, pero se permite continuar.

### 7.2 Modos

#### Modo `enriquecer` (no destructivo, recomendado)

- Para cada tabla en orden topológico:
  - Lee `data/<tabla>.json`.
  - Sanea cada fila eliminando columnas que **ya no existen** en la tabla actual.
  - `INSERT ... ON CONFLICT (id) DO NOTHING` (vía `upsert({ ignoreDuplicates: true })`).
- Triggers permanecen **activos** (queremos que las validaciones se ejecuten).
- Si `incluir_archivos = true`: re-sube cada archivo del ZIP solo si **no existía** previamente.
- Errores fila a fila se registran pero **no abortan** el proceso → estado final puede ser `parcial`.

#### Modo `reemplazar` (destructivo)

- Triggers se desactivan globalmente con `ALTER TABLE ... DISABLE TRIGGER ALL` para evitar cascadas (esto requiere extensión y se hace por tabla).
- Para cada tabla en **orden inverso** (hojas primero), `DELETE FROM ...`.
- Para cada tabla en orden topológico, `INSERT` masivo desde el JSON.
- Triggers se reactivan al final con `ENABLE TRIGGER ALL`.
- Si `incluir_archivos = true`: re-sube cada archivo con `upsert: true` (sobrescribe).

### 7.3 Auditoría

Cada ejecución crea una fila en `system_backup_restore_logs` con:

- Backup fuente, modo, si incluyó archivos.
- Conteos finales por tabla.
- Errores tolerados (array de strings).
- Estado: `completado`, `parcial` (hubo errores no fatales) o `fallido`.

---

## 8. Seguridad

| Capa | Mecanismo |
|---|---|
| Acceso UI | Solo `superadministrador` ve el item "Backups" en `AppSidebar` |
| Acceso ruta | `AdminGuard` + verificación de rol antes de invocar funciones |
| Edge Functions | Cada una valida JWT y rol; las que se llaman desde cron aceptan `SERVICE_ROLE` |
| RLS en tablas | Solo `superadministrador` puede leer/insertar/eliminar; `administrador` solo lectura |
| RLS en bucket | `system-backups` es **privado**; URLs de descarga son **firmadas (1h)** |
| `exec_sql` RPC | Solo `service_role` puede invocarla; bloqueada para `authenticated` y `anon` |
| Confirmación restore | Texto literal `"RESTAURAR"` obligatorio |
| Cifrado en reposo | Por defecto en Supabase Storage |

---

## 9. Compatibilidad con el esquema y evolución del producto

Esta sección es clave: explica **qué pasa cuando agregamos nuevas tablas, columnas o buckets**, y **qué hay que hacer** para mantener el sistema cubriendo todo.

### 9.1 Comportamiento por tipo de cambio

| Cambio en el esquema | ¿Backups antiguos afectados? | ¿Backups nuevos cubren? | ¿Restore funciona? |
|---|---|---|---|
| Agregar una **columna nueva** a una tabla existente | ✅ Funcionan, las filas viejas no traen el campo (queda en default) | ✅ Sí, automáticamente | ✅ Sí |
| Eliminar una **columna** | ✅ Funcionan, el restore ignora la columna eliminada | ✅ | ✅ |
| Renombrar una columna | ⚠️ Se pierde el dato al restaurar (se guarda en una clave inexistente y se descarta) | ✅ con el nuevo nombre | ⚠️ requiere migración manual |
| Agregar una **tabla nueva** | ⚠️ Backups viejos no la contienen → restaurar enriqueciendo no afecta; reemplazando deja la tabla vacía | ❌ **NO** se respalda hasta agregarla a `TABLAS_BACKUP` | ✅ una vez agregada |
| Eliminar una tabla | ⚠️ El restore intentará insertar pero fallará silenciosamente; queda registrado en errores | N/A | ⚠️ |
| Agregar un **bucket nuevo** | ⚠️ No se incluye | ❌ **NO** hasta agregarlo a `BUCKETS` | ✅ una vez agregado |
| Cambiar tipo de columna (ej. text→jsonb) | ⚠️ El restore puede fallar fila por fila por incompatibilidad de tipos | ✅ | ⚠️ requiere migración manual |
| Agregar/eliminar valor de un **enum** | ⚠️ Si se elimina un valor presente en el backup, restore registra error por fila | ✅ | ⚠️ |
| Agregar un **trigger** o función | ✅ Sin impacto | ✅ | ✅ (en modo reemplazar se desactivan temporalmente) |

### 9.2 Checklist al agregar nuevas funcionalidades

Cuando se cree una **nueva tabla** o un **nuevo bucket** que deba respaldarse, se deben actualizar **dos lugares en el código del runner** y, opcionalmente, un tercero en el restore:

#### 9.2.1 Nueva tabla

1. **`supabase/functions/backup-runner/index.ts`** → agregar el nombre de la tabla al array `TABLAS_BACKUP`, **respetando el orden topológico**:
   - Primero las tablas sin dependencias (catálogos).
   - Después las que tienen FKs hacia las anteriores.
   - Si la nueva tabla referencia a otras, debe ir **después** de ellas.
2. **`supabase/functions/backup-restore/index.ts`** → agregar el nombre en la misma posición de su lista interna `TABLAS_ORDENADAS` (el orden controla tanto el `INSERT` como el `DELETE` inverso).
3. Si la tabla tiene RLS y el `service_role` no es suficiente (caso raro), revisar políticas para que el runner pueda hacer `SELECT *`.
4. Desplegar las edge functions (Lovable lo hace automático al guardar).
5. **Probar**: generar un backup manual, descargarlo, abrirlo y verificar que existe `data/<tabla_nueva>.json`.

> **Importante:** si una nueva tabla NO se agrega a `TABLAS_BACKUP`, los backups seguirán funcionando sin errores, pero esa tabla **no quedará respaldada**. No hay alerta automática para esto: es una responsabilidad de quien agrega la tabla.

#### 9.2.2 Nuevo bucket de Storage

1. **`supabase/functions/backup-runner/index.ts`** → agregar el nombre del bucket al array `BUCKETS`.
2. **`supabase/functions/backup-restore/index.ts`** → agregar el bucket en su lista interna de buckets a re-subir.
3. Verificar políticas RLS del bucket: el `service_role` puede leer cualquier bucket por defecto, pero conviene confirmarlo.
4. Desplegar y probar con un backup `alcance: completo`.

#### 9.2.3 Renombrar/eliminar tabla o columna

Para mantener compatibilidad con backups antiguos, se recomienda añadir un mapa de migración en `backup-restore`:

```ts
// Ejemplo conceptual: renombrar columna "telefono" → "celular" en personas
const COLUMN_RENAMES: Record<string, Record<string, string>> = {
  personas: { telefono: "celular" },
};
```

Aplicar este mapa al sanear filas antes del `upsert`.

#### 9.2.4 Cambio de versión de manifest

El `manifest.json` incluye `version: 1`. Si en el futuro se cambia el formato (ej. comprimir cada `.json` por separado, o cambiar la estructura), incrementar a `version: 2` y hacer que `backup-restore` ramifique según versión.

### 9.3 Recomendación de proceso

> **Regla operativa**: cualquier PR que cree una nueva tabla o bucket debe modificar también el `backup-runner` y `backup-restore`. Considerar agregar un test o un linter custom que detecte tablas en `public.*` que no estén en `TABLAS_BACKUP`.

Una forma simple de auditar manualmente:

```sql
-- Tablas en public que NO están siendo respaldadas:
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
  and table_name not in (
    -- Pega aquí TABLAS_BACKUP + las tablas del propio sistema de backups
    'system_backups', 'system_backup_schedules', 'system_backup_restore_logs',
    'roles', 'rol_permisos', 'perfiles', /* … */
  );
```

Si esta consulta devuelve filas, **hay tablas sin cobertura**.

---

## 10. Almacenamiento y costos

- Los backups viven en el **mismo proyecto Supabase** (Lovable Cloud), bucket privado `system-backups`.
- **Costo**: cada backup ocupa espacio en el plan de storage del proyecto.
- **Riesgo**: si el proyecto Supabase se eliminara, los backups se perderían junto con la plataforma.
- **Mitigación recomendada**: descargar copias periódicas localmente desde la UI ("Descargar"). A futuro puede agregarse una integración para subir automáticamente a un destino externo (Google Drive, S3, etc.), pero no está implementada.
- **Política de retención**: configurada por schedule; los backups manuales no se eliminan automáticamente.

### 10.1 Estimación de tamaño

- **DB-only** crece linealmente con `audit_logs`, `formato_respuestas`, `documentos_matricula` y `matriculas`. En un proyecto con poco volumen pesa < 5 MB.
- **Completo** suma el peso real de los archivos en los 7 buckets (firmas, documentos PDF, adjuntos, etc.). Crece más rápido.

---

## 11. Operaciones comunes

### 11.1 Crear un backup manual

UI → `/admin/backups` → botón "Crear backup ahora" → seleccionar alcance → ejecutar.

Aparece como `en_progreso` y, al terminar, cambia a `completado` con métricas.

### 11.2 Descargar un backup

En la fila correspondiente, click en el ícono de descarga. Se genera una URL firmada de 1 hora y se descarga el ZIP.

### 11.3 Eliminar un backup

Click en el ícono de papelera → confirmación → se elimina el objeto del bucket y la fila de la DB.

### 11.4 Programar backups

Tab "Programaciones" → "Nueva programación" → elegir período + hora Colombia + alcance + retención. Se crea automáticamente la entrada en `pg_cron`.

### 11.5 Restaurar un backup

Tab "Importar" → seleccionar backup → elegir modo (recomendado: `enriquecer`) → marcar si incluye archivos → revisar diff de esquema → escribir `RESTAURAR` → ejecutar.

Auditoría queda en `system_backup_restore_logs`.

---

## 12. Limitaciones conocidas y mejoras futuras

| Limitación | Posible mejora |
|---|---|
| Backups viven en el mismo proyecto Supabase | Sincronización opcional a Google Drive / S3 |
| No hay alerta automática si una nueva tabla queda sin respaldar | Linter o test que compare `information_schema` vs `TABLAS_BACKUP` |
| `backup-runner` no comprime cada JSON por separado | Stream + per-file gzip para backups muy grandes |
| Restauración modo `reemplazar` requiere DB sin tráfico | Ventana de mantenimiento; modo "preview" que solo simule |
| No se respaldan tablas `auth.*` | No es necesario (Supabase las gestiona); para clonar usuarios entre proyectos se requeriría otra estrategia |
| No hay verificación de integridad criptográfica del ZIP | Agregar hash SHA-256 al manifest y validarlo al restaurar |
| No hay encriptación a nivel aplicación dentro del ZIP | Agregar passphrase opcional para backups descargados |

---

## 13. Resumen rápido

- **Backups = ZIP con `data/*.json` + opcional `files/*` + `manifest.json`**.
- **`backup-runner`** los genera (manual o cron).
- **`backup-restore`** los aplica en modo `enriquecer` (seguro) o `reemplazar` (destructivo).
- **`backup-schedule-manager`** controla las programaciones vía `pg_cron`.
- **`backup-cleanup`** aplica retención cada noche.
- **Para que una nueva tabla o bucket quede cubierto**: agregarla a `TABLAS_BACKUP` / `BUCKETS` en `backup-runner` **y** en las listas equivalentes de `backup-restore`. Sin esto, los backups seguirán generándose sin errores pero no incluirán los datos nuevos.
