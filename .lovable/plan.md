## Modulo Gestion de Personal - Parte 1

### Resumen

Crear un modulo completo de Gestion de Personal con cargos dinamicos e integrarlo con el formulario de Cursos, reemplazando las listas estaticas `ENTRENADORES_MOCK` y `SUPERVISORES_MOCK`.

---

### Archivos nuevos a crear


| Archivo                                           | Descripcion                                                                                                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/personal.ts`                           | Tipos `Cargo`, `CargoFormData`, `Personal`, `PersonalFormData`, `TipoCargo`                                                                                                              |
| `src/services/personalService.ts`                 | Servicio mock con CRUD para Personal y Cargos (patron identico a `personaService.ts`)                                                                                                    |
| `src/hooks/usePersonal.ts`                        | Hooks de React Query: `usePersonal`, `usePersonalList`, `useCargos`, `useCreatePersonal`, `useUpdatePersonal`, `useDeletePersonal`, `useCreateCargo`, `useUpdateCargo`, `useDeleteCargo` |
| `src/pages/personal/GestionPersonalPage.tsx`      | Vista principal con tabla, busqueda y filtro por cargo (patron de `PersonasPage.tsx`)                                                                                                    |
| `src/pages/personal/PersonalFormPage.tsx`         | Formulario crear/editar perfil con dropdown de cargo + acceso al modal de cargos                                                                                                         |
| `src/pages/personal/PersonalDetallePage.tsx`      | Vista detalle de un perfil de personal                                                                                                                                                   |
| `src/components/personal/GestionCargosModal.tsx`  | Modal para crear, editar, eliminar cargos con validacion de uso                                                                                                                          |
| `src/components/personal/PersonalDetailSheet.tsx` | Panel lateral de detalle rapido (patron de `PersonaDetailSheet`)                                                                                                                         |


### Archivos existentes a modificar


| Archivo                                | Cambio                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/mockData.ts`                 | Agregar arrays `mockPersonalStaff` y `mockCargos` con datos iniciales                                                                                |
| `src/types/index.ts`                   | Exportar tipos desde `personal.ts`                                                                                                                   |
| `src/types/audit.ts`                   | Agregar `'personal'` y `'cargo'` a `TipoEntidad`                                                                                                     |
| `src/components/layout/AppSidebar.tsx` | Agregar entrada "Gestion de Personal" al menu con icono `UserCog`                                                                                    |
| `src/App.tsx`                          | Agregar rutas `/gestion-personal`, `/gestion-personal/nuevo`, `/gestion-personal/:id`, `/gestion-personal/:id/editar`                                |
| `src/pages/cursos/CursoFormPage.tsx`   | Reemplazar `ENTRENADORES_MOCK` y `SUPERVISORES_MOCK` por consultas al servicio de personal filtradas por tipo de cargo (`entrenador` / `supervisor`) |
| `src/data/formOptions.ts`              | Eliminar `ENTRENADORES_MOCK` y `SUPERVISORES_MOCK` (ya no se necesitan)                                                                              |


---

### Modelo de datos

```text
Cargo
  id: string
  nombre: string (unico)
  tipo: 'entrenador' | 'supervisor' | 'administrativo' | 'instructor' | 'otro'
  createdAt: string
  updatedAt: string

Personal
  id: string
  nombres: string
  apellidos: string
  cargoId: string
  cargoNombre: string
  createdAt: string
  updatedAt: string
```

---

### Detalle tecnico por componente

**1. `personalService.ts**`

- Sigue el patron de `personaService.ts`: operaciones sobre arrays en memoria con `delay()`, validacion de unicidad de nombre de cargo, audit logs.
- Metodos especiales: `getByTipoCargo(tipo)` para filtrar personal por tipo de cargo (usado por Cursos).
- Al eliminar cargo: verificar que ningun personal lo tenga asignado; si esta en uso, lanzar `ApiError`.

**2. `GestionCargosModal.tsx**`

- Dialog con dos secciones: formulario de crear/editar arriba y listado abajo.
- Cada fila del listado muestra nombre, badge de tipo, boton editar (llena el formulario arriba) y boton eliminar (deshabilitado si hay personal con ese cargo).
- Al crear un cargo, se emite un callback `onCargoCreated(cargoId)` para que el formulario de personal lo seleccione automaticamente.

**3. `CursoFormPage.tsx` - Integracion**

- Importar `usePersonalByTipoCargo` (o filtrar del listado completo).
- El select de Entrenador lista personal cuyo cargo tiene `tipo === 'entrenador'`.
- El select de Supervisor lista personal cuyo cargo tiene `tipo === 'supervisor'`.
- Al seleccionar, se persiste `entrenadorId`/`supervisorId` y el nombre completo para compatibilidad visual.
- Las constantes `ENTRENADORES_MOCK` y `SUPERVISORES_MOCK` se eliminan de `formOptions.ts`.

**4. Datos mock iniciales**

- 3 cargos: "Entrenador" (entrenador), "Supervisor" (supervisor), "Asistente Administrativo" (administrativo).
- 6 perfiles de personal: los 3 entrenadores y 3 supervisores actuales, mapeados a los cargos correspondientes, para mantener compatibilidad con cursos existentes.

**5. Sidebar**

- Nueva entrada entre "Cursos" y "Niveles de Formacion" con icono `UserCog` de lucide-react.

**6. Auditoría**

- Todas las operaciones CRUD de personal y cargos registran en `mockAuditLogs` con `entidadTipo: 'personal'` o `'cargo'`.