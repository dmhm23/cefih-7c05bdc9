## Modulo: Niveles de Formacion

### Resumen

Crear un nuevo modulo administrable para gestionar los niveles de formacion del sistema. Actualmente la logica de niveles esta dispersa en `TIPOS_FORMACION_CURSO`, `NIVELES_FORMACION_EMPRESA` y `documentoService.ts` (hardcodeada). Este modulo centraliza esa informacion en una entidad `NivelFormacion` con CRUD completo, requisitos documentales configurables, y precarga de los 5 niveles existentes.

---

### Estructura de archivos

```text
Crear:
  src/types/nivelFormacion.ts
  src/services/nivelFormacionService.ts
  src/hooks/useNivelesFormacion.ts
  src/pages/niveles/NivelesPage.tsx
  src/pages/niveles/NivelFormPage.tsx
  src/pages/niveles/NivelDetallePage.tsx

Modificar:
  src/data/mockData.ts              (agregar mockNivelesFormacion)
  src/types/audit.ts                (agregar 'nivel_formacion' a TipoEntidad)
  src/types/index.ts                (exportar nuevos tipos)
  src/components/layout/AppSidebar.tsx (agregar opcion "Niveles de Formacion")
  src/App.tsx                       (agregar rutas /niveles)
  src/components/layout/MainLayout.tsx (agregar routeName)
  src/services/documentoService.ts  (refactorizar para consultar NivelFormacion)
```

---

### 1. Entidad NivelFormacion

**Archivo:** `src/types/nivelFormacion.ts`

```typescript
export type DocumentoReqKey =
  | 'cedula'
  | 'examen_medico'
  | 'certificado_eps'
  | 'arl'
  | 'planilla_seguridad_social'
  | 'curso_previo';

export interface NivelFormacion {
  id: string;
  nombreNivel: string;
  tipoCertificacion?: string;
  duracionHoras?: number;
  duracionDias?: number;
  consecutivo: string;
  documentosRequeridos: DocumentoReqKey[];
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export type NivelFormacionFormData = Omit<NivelFormacion, 'id' | 'createdAt' | 'updatedAt'>;
```

El catalogo de documentos disponibles (para la seccion B del formulario) sera una constante:

```typescript
export const CATALOGO_DOCUMENTOS: { key: DocumentoReqKey; label: string }[] = [
  { key: 'cedula', label: 'Cedula de Ciudadania' },
  { key: 'examen_medico', label: 'Examen Medico Ocupacional' },
  { key: 'certificado_eps', label: 'Certificado EPS' },
  { key: 'arl', label: 'Afiliacion ARL' },
  { key: 'planilla_seguridad_social', label: 'Planilla de Seguridad Social' },
  { key: 'curso_previo', label: 'Certificado de Curso Previo' },
];
```

---

### 2. Datos mock precargados

**Archivo:** `src/data/mockData.ts` (agregar)

4 niveles precargados basados en la logica actual del sistema:


| Consecutivo | Nombre                | Dias   | Horas  | Documentos requeridos para habilitar la carga                                        |
| ----------- | --------------------- | ------ | ------ | ------------------------------------------------------------------------------------ |
| 01          | Reentrenamiento       | 1      | 8      | cedula, examen_medico, arl, certificado_eps, planilla_seguridad_social               |
| 02          | Jefe de Area          | 1      | 8      | cedula, examen_medico, arl, certificado_eps, planilla_seguridad_social               |
| 03          | Trabajador Autorizado | 4      | 32     | cedula, examen_medico, arl, certificado_eps, planilla_seguridad_social               |
| &nbsp;      | &nbsp;                | &nbsp; | &nbsp; | &nbsp;                                                                               |
| 05          | Coordinador T.A.      | 10     | 80     | cedula, examen_medico, arl, certificado_eps, planilla_seguridad_social, curso_previo |


Los datos de duracion y documentos provienen de `TIPOS_FORMACION_CURSO` en formOptions.ts y de la logica hardcodeada en `documentoService.ts`. "Trabajo en Alturas" no existe actualmente en el sistema, se crea sin datos para que el usuario lo complete.

La `planilla_seguridad_social` se incluye como requerido en el nivel pero su caracter opcional se maneja a nivel de matricula (propiedad `opcional` en DocumentoRequerido).

---

### 3. Servicio

**Archivo:** `src/services/nivelFormacionService.ts`

Funciones CRUD siguiendo el patron de `cursoService.ts`:

- `getAll()` — retorna mockNivelesFormacion
- `getById(id)` — busca por id
- `search(query)` — filtra por nombreNivel o consecutivo
- `create(data)` — valida consecutivo unico, push a mock, audit log
- `update(id, data)` — valida consecutivo unico (excluyendo el propio), audit log
- `delete(id)` — audit log (sin validacion de uso en matriculas por ahora, marcado como validacion futura)

Usa `delay()`, `ApiError` y registra en `mockAuditLogs`.

---

### 4. Hooks (React Query)

**Archivo:** `src/hooks/useNivelesFormacion.ts`

- `useNivelesFormacion()` — queryKey: ['niveles-formacion']
- `useNivelFormacion(id)` — queryKey: ['nivel-formacion', id]
- `useSearchNiveles(query)` — queryKey: ['niveles-formacion', 'search', query]
- `useCreateNivelFormacion()` — invalida ['niveles-formacion']
- `useUpdateNivelFormacion()` — invalida ['niveles-formacion'] y ['nivel-formacion', id]
- `useDeleteNivelFormacion()` — invalida ['niveles-formacion']

---

### 5. Vista Listado

**Archivo:** `src/pages/niveles/NivelesPage.tsx`

Sigue el patron de `PersonasPage.tsx`:

- Encabezado con titulo "Niveles de Formacion" y boton "Nueva formación"
- Barra de busqueda (por nombre o consecutivo)
- DataTable con columnas:
  - Consecutivo (sortable)
  - Nombre del nivel (sortable)
  - Tipo de certificacion
  - Duracion (muestra "X dias / Y horas")
  - Documentos (muestra cantidad, ej: "5 documentos")
  - Fecha actualizacion (sortable, default sort desc)
  - Acciones (ver, editar, eliminar)
- ColumnSelector con persistencia en localStorage
- ConfirmDialog para eliminacion

---

### 6. Formulario de creacion/edicion

**Archivo:** `src/pages/niveles/NivelFormPage.tsx`

Usa react-hook-form + zod, siguiendo el patron de `CursoFormPage.tsx`.

**Seccion A — Informacion general:**

- Nombre del nivel (obligatorio)
- Tipo de certificacion (opcional, input texto)
- Consecutivo (obligatorio, unico)
- Duracion en dias (number, opcional)
- Duracion en horas (number, opcional)
- Validacion: al menos uno entre dias u horas mayor que 0

**Seccion B — Requisitos documentales:**

- Lista del catalogo de documentos con Switch/toggle para habilitar/deshabilitar
- Poder añadir otro documento para que el usuario cargue
- Los habilitados se guardan en `documentosRequeridos[]`

**Seccion C — Observaciones:**

- Textarea opcional

En modo edicion: carga los datos existentes con `useNivelFormacion(id)`.

---

### 7. Vista Detalle

**Archivo:** `src/pages/niveles/NivelDetallePage.tsx`

Vista de solo lectura con opcion de editar, similar a otros detalles del sistema:

- Card de informacion general
- Lista de documentos requeridos
- Observaciones
- Boton editar, boton eliminar

---

### 8. Navegacion y rutas

**AppSidebar.tsx:** Agregar entrada despues de "Cursos":

```
{ title: "Niveles de Formacion", url: "/niveles", icon: Layers }
```

(Icono `Layers` de lucide-react)

**App.tsx:** Agregar rutas:

```
/niveles → NivelesPage
/niveles/nuevo → NivelFormPage
/niveles/:id → NivelDetallePage
/niveles/:id/editar → NivelFormPage
```

**MainLayout.tsx:** Agregar a `routeNames`:

```
"/niveles": "Niveles de Formacion"
```

---

### 9. Auditoria

Agregar `'nivel_formacion'` a `TipoEntidad` en `src/types/audit.ts`.

Registrar en AuditLog:

- Crear nivel
- Editar nivel (incluyendo cambios en documentosRequeridos)
- Eliminar nivel

---

### 10. Integracion con Matriculas (documentoService.ts)

Refactorizar `getDocumentosRequeridos()` en `src/services/documentoService.ts` para:

1. Recibir el nivel de formacion como parametro (string key)
2. Buscar en `mockNivelesFormacion` el nivel correspondiente
3. Generar los `DocumentoRequerido[]` dinamicamente a partir de `documentosRequeridos` del nivel encontrado
4. Si no encuentra el nivel, usar un fallback minimo (solo cedula)
5. Marcar `planilla_seguridad_social` como `opcional: true` cuando se genera

Esto elimina la logica hardcodeada actual basada en `if/else` por tipo de nivel.

La funcion de mapeo entre `DocumentoReqKey` y los datos del documento (nombre legible) usara el `CATALOGO_DOCUMENTOS` definido en el tipo.

---

### 11. Exclusiones

No se incluye en este modulo:

- Gestion de formatos
- Asociacion de formatos al nivel
- Logica de evaluacion o certificacion
- Configuracion de encuestas