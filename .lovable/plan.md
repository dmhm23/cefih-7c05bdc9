## Plan: Módulo Directorio de Empresas

### Resumen

Crear el módulo completo de Empresas siguiendo los patrones existentes de Personas (tipo, servicio mock, hook, páginas CRUD, sidebar). Se ubicará en el sidebar bajo "Directorio" como submenú colapsable junto a "Personas".

### Archivos nuevos

#### 1. `src/types/empresa.ts`

- Interface `Empresa` con campos: id, nombreEmpresa, nit, representanteLegal, sectorEconomico, arl, direccion, telefonoEmpresa, personaContacto, telefonoContacto, emailContacto, activo, createdAt, updatedAt
- Type `EmpresaFormData = Omit<Empresa, 'id' | 'createdAt' | 'updatedAt'>`

#### 2. `src/data/mockEmpresas.ts`

- Array `mockEmpresas` con 8-10 empresas de ejemplo con datos colombianos realistas
- Catálogos: `SECTORES_ECONOMICOS` y `ARLS` para los filtros

#### 3. `src/services/empresaService.ts`

- CRUD completo siguiendo patrón de `personaService.ts`: getAll, getById, search, create, update, delete
- Validación de NIT único en create/update
- Búsqueda por nombre, NIT, persona contacto, email

#### 4. `src/hooks/useEmpresas.ts`

- Hooks TanStack Query: `useEmpresas`, `useEmpresa`, `useCreateEmpresa`, `useUpdateEmpresa`, `useDeleteEmpresa`
- Mismo patrón que `usePersonas.ts`

#### 5. `src/pages/empresas/EmpresasPage.tsx`

- Tabla con DataTable, SearchInput, FilterPopover, ColumnSelector, BulkActionsBar
- Columnas: Nombre, NIT (copyable), Sector, ARL, Persona contacto, Teléfono, Email, Acciones
- Filtros: Sector económico, ARL
- Búsqueda por nombre, NIT, persona contacto, email
- DetailSheet lateral para vista rápida

#### 6. `src/pages/empresas/EmpresaFormPage.tsx`

- Formulario crear/editar con todos los campos del modelo
- Validación de NIT obligatorio y único

#### 7. `src/pages/empresas/EmpresaDetallePage.tsx`

- Vista detalle con EditableField para edición inline
- Sección de información general y datos de contacto

#### 8. `src/components/empresas/EmpresaDetailSheet.tsx`

- Panel lateral de vista rápida desde la tabla

### Archivos modificados

#### 9. `src/components/layout/AppSidebar.tsx`

- Reemplazar el item suelto "Personas" por un submenú colapsable **"Directorio"** (icono `Users`) con dos hijos: "Personas" (`/personas`) y "Empresas" (`/empresas`)
- Patrón igual al submenú existente de "Certificación"

#### 10. `src/App.tsx`

- Agregar rutas: `/empresas`, `/empresas/nueva`, `/empresas/:id`, `/empresas/:id/editar`

#### 11. `src/data/formOptions.ts`

- Agregar catálogos `SECTORES_ECONOMICOS` y `ARLS` si se centralizan aquí

### Patrones reutilizados

- DataTable + ColumnSelector + FilterPopover + SearchInput (igual que PersonasPage)
- Service mock con delay + ApiError (igual que personaService)
- TanStack Query hooks con invalidación (igual que usePersonas)
- EditableField en detalle (igual que PersonaDetallePage)
- CopyableCell para NIT (igual que documento en Personas)
- Analizar qué datos de **vinculación laboral** se utilizan actualmente en otros módulos para unificarlos y sincronizarlos con el resto de la plataforma desde Directorio > Empresas