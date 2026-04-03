

# Plan de Implementación Backend — FASE 1 y FASE 2

## Estado Actual

- **Base de datos:** Solo existe la tabla `perfiles` con RLS, trigger y función `get_my_rol()`
- **Frontend:** Todos los servicios (empresas, personal, personas, cursos, niveles) operan con datos mock en memoria
- **Patrón de hooks:** React Query (`useQuery`/`useMutation`) apuntando a servicios mock
- **Edge Functions:** Solo `admin-crear-usuario` y `bootstrap-admin`

## Estrategia de Implementación

La migración se divide en **6 pasos secuenciales**. Cada paso crea tablas/funciones en la base de datos y luego reescribe el servicio frontend correspondiente para usar Supabase en lugar de datos mock. Los hooks React Query **no se modifican** — solo cambia la implementación interna de los servicios.

---

## Paso 1 — Infraestructura Transversal (Migración SQL)

Crear en una sola migración:
- **Función `update_updated_at()`** — trigger reutilizable para timestamps automáticos
- **Tabla `audit_logs`** con ENUMs `tipo_entidad_audit` y `tipo_accion_audit`
- **Función genérica `audit_log_trigger_fn()`** — trigger AFTER INSERT/UPDATE/DELETE que registra cambios automáticamente
- **Todos los ENUMs de T-007** (25 tipos): `tipo_documento_identidad`, `genero`, `nivel_educativo`, `estado_curso`, `tipo_formacion`, `estado_matricula`, `tipo_vinculacion`, `tipo_cargo`, `metodo_pago`, etc.
- **Storage buckets:** `firmas`, `documentos-matricula`, `adjuntos-personal`, `facturas`, `certificados` con políticas RLS

**Reglas de negocio cubiertas:** T-001 a T-009, INC-009 (unificación MetodoPago), INC-007 (TipoFormacion estricto), RN-AUD-001/004

---

## Paso 2 — FASE 1A: Empresas y Tarifas (Migración + Servicio)

### Migración SQL
- Tabla `empresas` con UNIQUE en `nit`, campo `activo`, soft-delete, índices GIN para búsqueda
- Tabla `tarifas_empresa` con UNIQUE(`empresa_id`, `nivel_formacion_id`), ON DELETE RESTRICT
- Función `check_empresa_references()` — trigger que impide soft-delete si hay matrículas/tarifas
- Función `get_empresa_estudiantes_count()` — cuenta matrículas por empresa
- RLS: SELECT para autenticados (filtered by `deleted_at IS NULL`), ALL para admin/global
- Triggers: `update_updated_at`, `audit_log_trigger_fn`

### Reescritura Frontend
- **`src/services/empresaService.ts`**: Reemplazar todos los mock por `supabase.from('empresas')` y `supabase.from('tarifas_empresa')`
- **`src/types/empresa.ts`**: Adaptar tipos para mapear snake_case ↔ camelCase (o usar un mapper)
- Los hooks `useEmpresas`, `useEmpresa`, `useCreateEmpresa`, etc. **no cambian** — siguen llamando a `empresaService`

**Reglas cubiertas:** RN-EMP-001 a RN-EMP-013, INC-005, INC-006, INC-010

---

## Paso 3 — FASE 1B: Personal y Cargos (Migración + Servicio)

### Migración SQL
- Tabla `cargos` con ENUM `tipo_cargo`, soft-delete
- Tabla `personal` con FK a `cargos` (ON DELETE RESTRICT), campo `firma`
- Tabla `personal_adjuntos` con `storage_path` apuntando a bucket `adjuntos-personal`
- Función `validar_asignacion_personal_curso()` — previene asignar entrenador sin cargo correcto
- RLS: SELECT para autenticados, ALL para admin/global
- Triggers: `update_updated_at`, `audit_log_trigger_fn`

### Reescritura Frontend
- **`src/services/personalService.ts`**: Reemplazar mock por Supabase queries + Storage API para adjuntos
- **`src/types/personal.ts`**: Ajustar tipos si es necesario

**Reglas cubiertas:** RN-PNL-001 a RN-PNL-006

---

## Paso 4 — FASE 1C: Niveles de Formación (Migración + Servicio)

### Migración SQL
- Tabla `niveles_formacion` con `campos_adicionales` JSONB, `config_codigo_estudiante` JSONB, `documentos_requeridos` TEXT[]
- RLS: SELECT para autenticados, ALL para admin/global
- Triggers: `update_updated_at`, `audit_log_trigger_fn`

### Reescritura Frontend
- **`src/services/nivelFormacionService.ts`**: Reemplazar mock por Supabase
- **`src/types/nivelFormacion.ts`**: Mapear campos (`nombreNivel` → `nombre`, etc.)

**Reglas cubiertas:** RN-NF-001 a RN-NF-006

---

## Paso 5 — FASE 2A: Personas (Migración + Servicio)

### Migración SQL
- Tabla `personas` con ENUMs (`tipo_documento_identidad`, `genero`, `nivel_educativo`), UNIQUE en `numero_documento`
- Trigger `validar_contacto_emergencia()` — valida nombre y teléfono obligatorios en JSONB
- Trigger `check_persona_references()` — impide soft-delete si tiene matrículas activas
- Índice GIN para búsqueda por nombre
- RLS: SELECT para autenticados, ALL para admin/global

### Reescritura Frontend
- **`src/services/personaService.ts`**: Reemplazar mock por Supabase, incluyendo firma vía Storage
- **`src/types/persona.ts`**: Ajustar tipos

**Reglas cubiertas:** RN-PER-001 a RN-PER-009, INC-004

---

## Paso 6 — FASE 2B: Cursos (Migración + Servicio)

### Migración SQL
- Tabla `cursos` con FKs a `niveles_formacion`, `personal` (entrenador/supervisor), ENUM `estado_curso` y `tipo_formacion`
- Tabla `cursos_fechas_mintrabajo` con FK CASCADE a cursos
- Trigger `autogenerar_nombre_curso()` — concatena tipo + número
- Trigger `validar_asignacion_personal_curso()` — ya creado en paso 3, se asigna aquí
- RLS y triggers de auditoría

### Reescritura Frontend
- **`src/services/cursoService.ts`**: Reemplazar mock por Supabase, joins con personal/nivel
- **`src/types/curso.ts`**: Eliminar `| string` de `TipoFormacion`, mapear campos

### Edge Function (nuevo)
- **`exportar-csv-mintrabajo`**: Genera CSV con 15 columnas consolidando datos de persona + matrícula + curso para cursos cerrados

**Reglas cubiertas:** RN-CUR-001 a RN-CUR-011, INC-007

---

## Orden de Dependencias

```text
Paso 1: ENUMs + audit_logs + Storage + funciones utilitarias
  │
  ├── Paso 2: empresas + tarifas_empresa
  │
  ├── Paso 3: cargos + personal + personal_adjuntos
  │
  └── Paso 4: niveles_formacion
        │
        ├── Paso 5: personas (sin dependencia directa, pero se necesita para cursos)
        │
        └── Paso 6: cursos + cursos_fechas_mintrabajo
                     (depende de: niveles_formacion, personal)
```

## Archivos Afectados por Paso

| Paso | Migraciones SQL | Servicios Frontend | Tipos Frontend | Hooks |
|------|----------------|-------------------|----------------|-------|
| 1 | 1 migración grande | `api.ts` (agregar helper Supabase) | — | — |
| 2 | 1 migración | `empresaService.ts` | `empresa.ts` | Sin cambios |
| 3 | 1 migración | `personalService.ts` | `personal.ts` | Sin cambios |
| 4 | 1 migración | `nivelFormacionService.ts` | `nivelFormacion.ts` | Sin cambios |
| 5 | 1 migración | `personaService.ts` | `persona.ts` | Sin cambios |
| 6 | 1 migración + 1 Edge Function | `cursoService.ts` | `curso.ts` | Sin cambios |

**Total: 6 migraciones SQL, 1 Edge Function, 5 servicios reescritos, 5 archivos de tipos ajustados**

## Consideraciones Importantes

1. **Mapeo snake_case ↔ camelCase**: Se creará una utilidad helper en `api.ts` para transformar automáticamente las respuestas de Supabase (snake_case) al formato camelCase que espera el frontend
2. **Los datos mock existentes se pierden**: Al migrar a base de datos real, los datos de `mockData.ts`, `mockEmpresas.ts`, etc. dejan de usarse. Se pueden crear seeds opcionales
3. **El archivo `types.ts` de Supabase se regenera automáticamente** tras cada migración — no se edita manualmente
4. **Cada paso es desplegable de forma independiente** — se puede validar en producción antes de continuar al siguiente
5. **RLS garantiza seguridad** — todas las tablas requieren autenticación; los roles admin/global tienen acceso de escritura

