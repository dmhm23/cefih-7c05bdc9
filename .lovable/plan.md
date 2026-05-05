# # Catálogos administrables: ARL y Sector económico (MVP)

## Objetivo funcional

Crear una única lista administrable para ARL y una única lista administrable para sector económico.

El objetivo no es mantener una “lista vieja” y una “lista nueva”, sino convertir las opciones actuales, que hoy están definidas de forma fija en código y parcialmente restringidas por enums en base de datos, en opciones administrables desde la aplicación.

A partir de esta implementación:

- `catalogo_opciones` será la fuente principal de opciones para ARL y sector económico.

- Las opciones actuales de `formOptions.ts` se sembrarán una sola vez en `catalogo_opciones` para conservar compatibilidad.

- Los formularios de empresa y matrícula deberán leer las opciones desde `catalogo_opciones`.

- `formOptions.ts` podrá quedar únicamente como fallback técnico temporal, pero no como fuente funcional paralela.

- El usuario final verá y gestionará una sola lista por catálogo.

- No se manejarán dos listas operativas.

---

## Validación previa de dependencias

Resultado de la auditoría sobre los tipos `arl_enum` y `sector_economico`:

- **Columnas que usan los enums:** solo `public.empresas.arl` y `public.empresas.sector_economico` más sus tablas de backup `_backup_empresas_arl_sector_20260429`, que no se tocan. `matriculas.arl` y `matriculas.sector_economico` ya son `text`.

- **Funciones SQL:** ninguna referencia a `arl_enum`; ninguna función referencia `sector_economico` como tipo.

- **Vistas:** ninguna en `public` referencia los enums ni las columnas.

- **Triggers en `empresas`:** `trg_audit_empresas`, `trg_empresas_audit`, `trg_empresas_updated_at`. Son genéricos de auditoría y `updated_at`; no dependen del tipo enum.

- **Políticas RLS:** las políticas de `empresas` usan `deleted_at` y `has_permission`; no dependen de los enums.

- **Edge functions:** no se encontraron referencias a `arl_enum` ni a la columna como enum.

- **Frontend:** las referencias en `src/services/*`, `src/modules/formatos/plugins/safa/autoFields/*` y `FormatoPreviewDocument.tsx` son al nombre de columna, no al tipo enum.

- **Casts explícitos:** no se detectaron `::arl_enum` ni `::sector_economico` en el código de la aplicación.

**Conclusión:** la migración `enum -> text` en `empresas.arl` y `empresas.sector_economico` es viable. No se requiere refactor previo de funciones, vistas, triggers ni RLS.

---

## Alcance aprobado

Implementar un MVP limitado a:

- ARL.

- Sector económico.

Incluye:

- Crear tabla `catalogo_opciones`.

- Sembrar valores actuales de ARL y sector económico desde `formOptions.ts`.

- Migrar `empresas.arl` y `empresas.sector_economico` a `text`.

- Crear service y hook para consumir catálogos.

- Crear página `/admin/catalogos` con dos pestañas:

  - ARL.

  - Sector económico.

- Permitir:

  - crear opción;

  - editar label;

  - activar/desactivar opción.

- No permitir borrado físico.

- Integrar opciones dinámicas en:

  - `EmpresaFormPage`;

  - `MatriculaFormPage`.

- Mantener compatibilidad hacia atrás vía `resolveCatalogLabel`.

Fuera de este alcance:

- EPS.

- Otros catálogos.

- Acceso rápido desde selectores.

- `resolveAutoField`.

- Formatos dinámicos.

- Borrado físico.

- DROP de enums antiguos.

---

## Detalle técnico

### 1. Migración SQL

```sql

-- a) Crear tabla de catálogo

CREATE TABLE public.catalogo_opciones (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  catalogo text NOT NULL CHECK (catalogo IN ('arl','sector_economico')),

  value text NOT NULL,

  label text NOT NULL,

  activo boolean NOT NULL DEFAULT true,

  es_base boolean NOT NULL DEFAULT false,

  orden int NOT NULL DEFAULT 100,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (catalogo, value)

);

ALTER TABLE public.catalogo_opciones ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios autenticados.

-- INSERT/UPDATE: superadmin/admin, siguiendo el patrón de permisos de cargos.