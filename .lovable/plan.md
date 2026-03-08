

## Plan: CRUD de Tipos de Certificado en pestaña de Plantillas + eliminar submenú

### Cambios

#### 1. `src/pages/certificacion/PlantillasPage.tsx` — Agregar CRUD de Tipos

En la pestaña "Tipos de Certificado" existente:

- Agregar botón **"Nuevo Tipo"** al lado del botón "Nueva Plantilla" (visible solo cuando la pestaña activa es "tipos")
- Agregar botones **Editar** y **Eliminar** por fila en la tabla de tipos
- Crear un **Dialog** para crear/editar tipo de certificado con campos:
  - Nombre (Input)
  - Tipo de Formación (Select con `TIPO_FORMACION_LABELS`)
  - Plantilla vinculada (Select con plantillas disponibles)
  - Regla de código (Input)
  - Switches: Requiere Pago, Requiere Documentos, Requiere Formatos, Incluye Empresa, Incluye Firmas
- Usar `useCreateTipoCertificado` y `useUpdateTipoCertificado` existentes
- Agregar `useDeleteTipoCertificado` (nuevo)

#### 2. `src/services/tipoCertificadoService.ts` — Agregar `delete`

Agregar método `delete(id)` que elimina del array mock.

#### 3. `src/hooks/useTiposCertificado.ts` — Agregar `useDeleteTipoCertificado`

Nueva mutation que llama `tipoCertificadoService.delete` e invalida query.

#### 4. `src/components/layout/AppSidebar.tsx` — Eliminar submenú "Tipos de Certificado"

Quitar `{ title: "Tipos de Certificado", url: "/certificacion/tipos", icon: SlidersHorizontal }` del array `certificacionItems`.

#### 5. `src/App.tsx` — Eliminar ruta `/certificacion/tipos`

Quitar la ruta y el import de `TiposCertificadoPage`.

#### 6. `src/pages/certificacion/TiposCertificadoPage.tsx` — Eliminar archivo

Ya no se necesita, toda la funcionalidad queda en PlantillasPage.

