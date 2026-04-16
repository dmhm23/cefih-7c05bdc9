

## Análisis

**Estado actual:**
- `MinTrabajoCard` permite registrar un número de registro y fechas adicionales, pero **no soporta adjuntos** de ningún tipo.
- `cursos_fechas_mintrabajo` no tiene columnas para archivos.
- Patrón ya existente: `personal_adjuntos` + bucket `adjuntos-personal` (storage privado, signed URLs, sanitización de nombre, mime + tamaño en BD). Lo replicamos.

**Decisiones clave:**
- Crear bucket privado `adjuntos-mintrabajo` (signed URLs 1h, igual que `adjuntos-personal`).
- Crear tabla `cursos_mintrabajo_adjuntos` que sirve para **dos contextos** mediante `fecha_id` nullable:
  - `fecha_id IS NULL` → adjuntos del **registro principal** del curso (vinculados a `curso_id`).
  - `fecha_id NOT NULL` → adjuntos de una **fecha adicional** específica.
- Límite **10 archivos por contexto** (registro principal y por cada fecha adicional).
- Tipos: PDF, JPG, PNG. Tamaño máx **5 MB** por archivo (bajo peso, según solicitud).

## Cambios

### 1. Backend (migración SQL)

**Bucket** (privado):
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('adjuntos-mintrabajo', 'adjuntos-mintrabajo', false);
```

**Tabla:**
```sql
CREATE TABLE public.cursos_mintrabajo_adjuntos (
  id uuid PK default gen_random_uuid(),
  curso_id uuid NOT NULL,
  fecha_id uuid NULL REFERENCES cursos_fechas_mintrabajo(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo_mime text,
  tamano bigint,
  storage_path text NOT NULL,
  created_by uuid,
  created_at timestamptz default now()
);
CREATE INDEX ON public.cursos_mintrabajo_adjuntos (curso_id);
CREATE INDEX ON public.cursos_mintrabajo_adjuntos (fecha_id);
```

**RLS**: SELECT autenticados; ALL para `superadministrador`/`administrador` (mismo patrón que `cursos_fechas_mintrabajo`).

**Storage policies** sobre `storage.objects` para bucket `adjuntos-mintrabajo`: SELECT/INSERT/UPDATE/DELETE para autenticados (igual que `adjuntos-personal`).

### 2. Service (`src/services/cursoService.ts`)

Agregar métodos:
- `listAdjuntosMinTrabajo(cursoId, fechaId?: string | null)` → devuelve adjuntos del contexto solicitado (con signed URL).
- `addAdjuntoMinTrabajo(cursoId, file, fechaId?: string | null)` → valida límite de 10, sube a storage en path `mintrabajo/{cursoId}/{fechaId|principal}/{ts}_{nombre}`, inserta fila.
- `deleteAdjuntoMinTrabajo(adjuntoId)` → borra de storage + fila.

Path sanitization igual que `personalService.addAdjunto`.

### 3. Tipos (`src/types/curso.ts`)

```ts
export interface AdjuntoMinTrabajo {
  id: string;
  cursoId: string;
  fechaId: string | null;
  nombre: string;
  tipoMime: string;
  tamano: number;
  url?: string;       // signed URL
  createdAt: string;
}
```

### 4. Hooks (`src/hooks/useCursos.ts`)

- `useAdjuntosMinTrabajo(cursoId, fechaId?)` → query.
- `useAddAdjuntoMinTrabajo()` / `useDeleteAdjuntoMinTrabajo()` → mutations que invalidan la query del contexto correspondiente.

### 5. Componente compartido (`src/components/cursos/AdjuntosMinTrabajoSection.tsx`) — nuevo

Reutiliza el patrón visual de `AdjuntosPersonal`:
- `FileDropZone` con `accept=".pdf,.jpg,.jpeg,.png"`, `multiple`, hint: *"PDF, JPG, PNG · Máx. 5 MB · Hasta 10 archivos"*.
- Bloquea upload si ya hay 10 (toast informativo).
- Lista compacta con icono, nombre, tamaño, fecha, botones **Vista previa / Descargar / Eliminar**.
- Vista previa inline (PDF en `<object>`, imagen en `<img>`), igual que `AdjuntosPersonal`.

Props: `cursoId`, `fechaId?: string | null`, `readOnly?`, `title?`.

### 6. Integración UI

**`MinTrabajoCard.tsx`:**
- Debajo de los 3 inputs y antes de "Fechas Adicionales" agregar:
  ```
  <AdjuntosMinTrabajoSection cursoId={curso.id} fechaId={null} title="Adjuntos del registro principal" readOnly={readOnly} />
  ```
- En cada item de `minTrabajoFechasAdicionales`, agregar al expandir/colapsar (acordeón sencillo con chevron) la sección:
  ```
  <AdjuntosMinTrabajoSection cursoId={curso.id} fechaId={f.id} title="Adjuntos de esta fecha" readOnly={readOnly} />
  ```

**`AddFechaMinTrabajoDialog.tsx`:**
- Agregar zona de carga **opcional** debajo del campo motivo, dentro del mismo diálogo.
- En modo creación: archivos quedan en estado local; tras crear la fecha (ya devuelve el curso con la nueva fecha), tomar el ID de la fecha recién creada y subir cada archivo con `addAdjuntoMinTrabajo`.
- En modo edición: usar el componente `AdjuntosMinTrabajoSection` directamente con `fechaId`.

### 7. Limpieza al borrar

- `ON DELETE CASCADE` en `fecha_id` ya borra filas de adjuntos cuando se elimina una fecha adicional, pero **no** borra los archivos del bucket. En `cursoService.eliminarFechaAdicional`, **antes** de borrar la fecha, listar adjuntos asociados y removerlos de storage.
- Similar en `cursoService.delete`: borrar archivos del bucket bajo `mintrabajo/{cursoId}/`.

## Archivos a crear/modificar

| Archivo | Tipo |
|---|---|
| Migración SQL | Crear |
| `src/types/curso.ts` | Modificar (añadir `AdjuntoMinTrabajo`) |
| `src/services/cursoService.ts` | Añadir 3 métodos + cleanup en delete/eliminarFecha |
| `src/hooks/useCursos.ts` | Añadir 3 hooks |
| `src/components/cursos/AdjuntosMinTrabajoSection.tsx` | Crear |
| `src/components/cursos/MinTrabajoCard.tsx` | Integrar sección principal + sección por fecha |
| `src/components/cursos/AddFechaMinTrabajoDialog.tsx` | FileDropZone opcional + upload tras crear |

## Resultado esperado

- Registro principal MinTrabajo: zona de carga visible con hasta 10 archivos (PDF/imagen).
- Cada fecha adicional: sus propios adjuntos (independientes), opcionales.
- Al crear una fecha desde el diálogo, opcionalmente se pueden adjuntar archivos en el mismo paso.
- Vista previa inline + descarga + eliminación.
- Contadores: "X / 10 archivos".
- Sin regresiones en el flujo actual de MinTrabajo.

