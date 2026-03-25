

## Plan: Actualizar reglas de cierre de curso y permitir reapertura con justificación

### Resumen
Tres cambios principales:
1. **Cierre de curso**: validar documentos completos + MinTrabajo (el pago NO bloquea el cierre)
2. **Elegibilidad de certificados**: el pago sigue bloqueando certificados, pero no el cierre
3. **Reapertura de curso cerrado**: permitir edición solicitando justificación, registrada en auditoría

---

### 1. Actualizar validación de cierre — `src/services/cursoService.ts`

En `cambiarEstado`, reemplazar la validación de "matrículas pendientes" por validación de **documentos incompletos**:

- Recorrer las matrículas del curso y verificar que cada una tenga todos sus documentos obligatorios con `estado !== 'pendiente'`
- Si hay matrículas con documentos pendientes, lanzar error `DOCUMENTOS_INCOMPLETOS` con la lista de afectados
- Mantener la validación de MinTrabajo existente
- **Eliminar** la validación que bloquea por estado de matrícula `pendiente`/`creada` (el pago no bloquea cierre)

### 2. Actualizar `CloseCourseDialog.tsx`

- Agregar nuevo step `"documentos_incompletos"` al tipo `Step`
- En `handleOpen`: además de validar MinTrabajo, verificar si hay matrículas con documentos pendientes en el frontend y mostrar la lista
- Nuevo panel visual que liste los estudiantes con documentos faltantes, con botón para revisar
- Reemplazar el step `matriculas_pending` actual por `documentos_incompletos`
- Actualizar el `handleConfirm` para capturar el nuevo código de error del backend

### 3. Reapertura de curso cerrado — `src/pages/cursos/CursoDetallePage.tsx`

- Cambiar `isReadOnly` para que un curso cerrado **no sea totalmente de solo lectura**
- Al intentar guardar cambios en un curso cerrado, mostrar un **diálogo de justificación** (textarea) antes de proceder
- La justificación se registra en el log de auditoría junto con los campos modificados

### 4. Nuevo componente `src/components/cursos/JustificacionEdicionDialog.tsx`

Dialog simple con:
- Título: "Justificación de edición"
- Descripción: "Este curso está cerrado. Indique el motivo de la modificación."
- Textarea obligatorio para la justificación
- Botones Cancelar / Confirmar edición

### 5. Actualizar servicio `cursoService.update`

- Aceptar campo opcional `justificacion?: string` en los datos
- Cuando se provea, incluirlo en el log de auditoría

### 6. Actualizar `certificadoGenerator.ts` — `evaluarElegibilidad`

- Sin cambios funcionales necesarios: ya valida pago y documentos por separado
- Los certificados siguen bloqueados si `!matricula.pagado`, lo cual es correcto

### Archivos modificados
- `src/services/cursoService.ts` — nueva validación documentos, justificación en update
- `src/components/cursos/CloseCourseDialog.tsx` — nuevo step documentos incompletos
- `src/pages/cursos/CursoDetallePage.tsx` — reapertura con justificación
- `src/components/cursos/JustificacionEdicionDialog.tsx` — nuevo componente

