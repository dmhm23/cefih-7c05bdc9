

## Modal para Agregar Estudiantes a un Curso

### Resumen

Reemplazar el boton "Agregar" actual (que navega a `/matriculas/nueva?cursoId=...`) por un modal que muestra todas las matriculas existentes que aun no estan asignadas al curso. Permite buscar por cedula, seleccionar multiples estudiantes, revisar la seleccion y confirmar. Tambien se agrega funcionalidad para eliminar estudiantes ya asignados al curso.

---

### Componente nuevo

**`src/components/cursos/AgregarEstudiantesModal.tsx`**

Un Dialog con las siguientes secciones:

1. **Barra de busqueda**: Input para filtrar por numero de cedula
2. **Listado de matriculas disponibles**: Muestra todas las matriculas cuyo `cursoId` sea diferente al curso actual o que no tengan curso asignado. Cada fila muestra:
   - Checkbox de seleccion
   - Nombre completo (desde Persona)
   - Tipo y numero de documento
   - Estado de la matricula
3. **Contador de seleccionados**: Badge o texto que muestra "X seleccionados"
4. **Panel de seleccionados**: Seccion inferior o lateral que lista las personas seleccionadas con opcion de quitar individualmente (boton X)
5. **Footer**: Boton "Cancelar" y "Agregar X estudiantes"

Props:
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `cursoId: string`
- `matriculasActuales: string[]` (IDs de matriculas ya en el curso)

Usa `useMatriculas()` y `usePersonas()` para obtener los datos. Filtra las matriculas que no pertenecen al curso actual.

---

### Servicio: agregar/quitar matricula de curso

**`src/services/cursoService.ts`** - Agregar metodo `agregarEstudiantes`:
- Recibe `cursoId` y `matriculaIds: string[]`
- Actualiza `curso.matriculasIds` agregando los nuevos IDs
- Actualiza cada matricula con `cursoId = cursoId`

**`src/services/cursoService.ts`** - Agregar metodo `removerEstudiante`:
- Recibe `cursoId` y `matriculaId: string`
- Quita el ID de `curso.matriculasIds`
- Limpia `cursoId` de la matricula

---

### Hooks nuevos

**`src/hooks/useCursos.ts`** - Agregar:
- `useAgregarEstudiantesCurso()`: mutation que llama a `cursoService.agregarEstudiantes` e invalida queries de cursos, matriculas
- `useRemoverEstudianteCurso()`: mutation que llama a `cursoService.removerEstudiante` e invalida queries

---

### Modificaciones en CursoDetallePage

**`src/pages/cursos/CursoDetallePage.tsx`**:

1. Importar `AgregarEstudiantesModal`
2. Agregar estado `modalAgregarOpen`
3. Cambiar el boton "Agregar" para abrir el modal en lugar de navegar
4. En la lista de estudiantes inscritos, agregar un boton de eliminar (icono X o Trash) en cada fila con confirmacion via `ConfirmDialog`
5. Importar y usar `useRemoverEstudianteCurso` para la eliminacion

---

### Flujo de usuario

```text
1. Usuario entra a /cursos/:id
2. Hace clic en "Agregar" (seccion Estudiantes Inscritos)
3. Se abre modal con listado de matriculas disponibles
4. Escribe cedula para filtrar
5. Selecciona uno o varios estudiantes con checkboxes
6. Ve contador "3 seleccionados" y lista de seleccionados
7. Clic en "Agregar 3 estudiantes" -> se asignan al curso
8. Para eliminar, clic en icono basura junto a cada estudiante -> confirmacion -> se remueve
```

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/components/cursos/AgregarEstudiantesModal.tsx` | Crear |
| `src/services/cursoService.ts` | Agregar `agregarEstudiantes` y `removerEstudiante` |
| `src/hooks/useCursos.ts` | Agregar `useAgregarEstudiantesCurso` y `useRemoverEstudianteCurso` |
| `src/pages/cursos/CursoDetallePage.tsx` | Integrar modal y boton eliminar |

