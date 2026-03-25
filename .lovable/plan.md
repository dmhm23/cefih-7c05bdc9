

## Plan: Renombrar "Cargo" a "Rol" en Gestión de Personal

### Alcance
Solo se cambian **labels/textos visibles** en el módulo de gestión de personal. Los nombres internos de campos (`cargoId`, `cargoNombre`, `TipoCargo`, etc.) se mantienen intactos para no romper la integración con matrículas donde "cargo" sí es correcto.

### Archivos a modificar

#### 1. `src/components/personal/GestionCargosModal.tsx`
- Título: "Gestionar Cargos" → "Gestionar Roles"
- Descripción: "Crear, editar o eliminar cargos del sistema" → "...roles del sistema"
- Label "Nombre del cargo" → "Nombre del rol"
- Placeholder: "Ej: Entrenador Senior" (se mantiene, es un ejemplo válido)
- Botón tooltip "Cargo en uso" → "Rol en uso, no se puede eliminar"
- Mensajes toast: "Cargo creado/actualizado/eliminado" → "Rol creado/actualizado/eliminado"
- Errores: textos de error que mencionen "cargo" → "rol"

#### 2. `src/pages/personal/GestionPersonalPage.tsx`
- Columna header "Cargo" → "Rol"
- Botón "Gestionar Cargos" → "Gestionar Roles"
- Filtro label "Cargo" → "Rol"

#### 3. `src/pages/personal/PersonalFormPage.tsx`
- FormLabel "Cargo *" → "Rol *"
- Placeholder "Seleccionar cargo..." → "Seleccionar rol..."
- Validación z: mensaje "Seleccione un cargo" → "Seleccione un rol"
- Tooltip botón "Gestionar cargos" → "Gestionar roles"

#### 4. `src/pages/personal/PersonalDetallePage.tsx`
- EditableField label "Cargo" → "Rol"

#### 5. `src/components/personal/PersonalDetailSheet.tsx`
- Label "Cargo" → "Rol" (en el sheet lateral)

#### 6. `src/types/personal.ts`
- `TIPOS_CARGO` → renombrar constante a `TIPOS_ROL` (o mantener nombre interno y solo cambiar si se usa en UI)
- En realidad `TIPOS_CARGO` se usa internamente; lo dejamos igual pero cambiamos el label visible "Tipo" en el modal por "Tipo de rol"

#### 7. `src/services/personalService.ts`
- Mensajes de error: "Ya existe un cargo con ese nombre" → "Ya existe un rol con ese nombre"
- "No se puede eliminar un cargo que está asignado..." → "No se puede eliminar un rol que está asignado..."
- "Cargo no encontrado" → "Rol no encontrado"

### Lo que NO cambia
- Campos internos: `cargoId`, `cargoNombre`, `TipoCargo`, `mockCargos`, hooks (`useCargos`, `useCreateCargo`, etc.)
- Todo el módulo de matrículas sigue usando "cargo" (cargo laboral del participante)
- Datos mock mantienen sus keys

