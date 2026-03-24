## Plan: Mejorar modal "Agregar Estudiantes" con filtros por nivel y estado documental

### Cambios en `src/components/cursos/AgregarEstudiantesModal.tsx`

**1. Recibir `tipoFormacion` del curso como prop nueva**

Agregar prop `nivelFormacion: string` a la interfaz del componente. Usar `useCurso(cursoId)` o pasar directamente desde el padre.

**2. Filtrar matrículas disponibles correctamente (3 condiciones)**

Actualizar el `useMemo` de `disponibles` para:

- Excluir matrículas ya asignadas a cualquier curso (`m.cursoId` no vacío)
- Solo mostrar matrículas cuyo `empresaNivelFormacion` coincida con el `tipoFormacion` del curso
- Excluir las del curso actual (ya cubierto por la condición anterior)

```ts
const disponibles = useMemo(() => {
  return matriculas.filter(
    (m) =>
      (!m.cursoId || m.cursoId === '') &&
      m.empresaNivelFormacion === nivelFormacion
  );
}, [matriculas, nivelFormacion]);
```

**3. Mostrar indicador de documentos pendientes**

En cada fila de matrícula, verificar `m.documentos` para detectar documentos con `estado === 'pendiente'`. Mostrar un badge de advertencia "Pendiente documentos" junto al nombre, sin bloquear la selección.

```text
┌─────────────────────────────────────────────────┐
│ ☐  Juan Pérez López                    Creada   │
│    CC: 1234567890                                │
│    Pendiente de documentos (2)                 │
└─────────────────────────────────────────────────┘
```

### Cambios en `src/components/cursos/EnrollmentsTable.tsx`

Pasar la nueva prop `nivelFormacion={curso.tipoFormacion}` al componente `AgregarEstudiantesModal`.

### Archivos modificados

- `src/components/cursos/AgregarEstudiantesModal.tsx` — filtro por nivel, indicador documental
- `src/components/cursos/EnrollmentsTable.tsx` — pasar prop `nivelFormacion`