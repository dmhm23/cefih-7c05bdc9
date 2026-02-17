

## Sistema de Comentarios para Matriculas

### Resumen

Reemplazar el campo estatico "Observaciones" y agregar un sistema de comentarios con historial en dos secciones de la vista `/matriculas/:id`:

1. **Cobros / Cartera** -- nuevo bloque de comentarios de seguimiento de cartera
2. **Observaciones finales** -- convertir de campo de texto estatico a sistema de comentarios

Ambas secciones compartiran el mismo componente reutilizable de comentarios.

### Archivos nuevos

**`src/types/comentario.ts`**
- Interfaz `Comentario`: id, matriculaId, seccion (`'cartera' | 'observaciones'`), texto, usuarioId, usuarioNombre, creadoEn, editadoEn (opcional)
- Type `SeccionComentario`

**`src/components/shared/ComentariosSection.tsx`**
- Componente reutilizable que recibe: lista de comentarios, seccion, matriculaId, callbacks (agregar, editar, eliminar)
- Input de texto + boton "Agregar" para nuevos comentarios
- Lista cronologica de comentarios, cada uno mostrando: usuario, fecha/hora formateada, texto, botones de editar y eliminar
- Collapsible: si hay mas de 3 comentarios, mostrar los 3 mas recientes y un boton "Ver todos (N)" que expande el historial completo usando el componente Collapsible ya disponible
- Modo edicion inline: al hacer clic en editar, el texto se convierte en input editable con botones guardar/cancelar
- Confirmacion al eliminar usando el toast o un mini-confirm inline

**`src/services/comentarioService.ts`**
- Almacen en memoria (`mockComentarios` array en `mockData.ts`)
- Metodos: `getByMatriculaSeccion(matriculaId, seccion)`, `create(data)`, `update(id, texto)`, `delete(id)`
- Cada operacion crea un registro en `mockAuditLogs` con accion crear/editar/eliminar, incluyendo usuario y timestamp

**`src/hooks/useComentarios.ts`**
- `useComentarios(matriculaId, seccion)` -- query
- `useCreateComentario()` -- mutation
- `useUpdateComentario()` -- mutation
- `useDeleteComentario()` -- mutation
- Todos invalidan el query de comentarios al completarse

### Archivos modificados

**`src/data/mockData.ts`**
- Agregar array `mockComentarios` exportado (puede iniciar vacio o con 2-3 comentarios de ejemplo para m1)

**`src/types/audit.ts`**
- Agregar `'comentario'` al tipo `TipoEntidad`

**`src/pages/matriculas/MatriculaDetallePage.tsx`**
- En la seccion "Cobros / Cartera" (linea 480-560): agregar `<ComentariosSection>` despues de los campos de pago, con seccion `'cartera'`
- Reemplazar la seccion "Observaciones" (lineas 583-594): eliminar el `EditableField` estatico y colocar `<ComentariosSection>` con seccion `'observaciones'`
- Importar el nuevo componente

### Detalle del componente ComentariosSection

```text
+------------------------------------------+
| Comentarios                    [Colapsar] |
+------------------------------------------+
| [Escriba un comentario...] [Agregar]     |
+------------------------------------------+
| Usuario Actual - 17 feb 2026, 14:30      |
| Texto del comentario aqui...             |
|                          [Editar] [Eliminar]|
+------------------------------------------+
| Usuario Actual - 16 feb 2026, 09:15      |
| Otro comentario...                       |
|                          [Editar] [Eliminar]|
+------------------------------------------+
| > Ver todos los comentarios (5)          |
+------------------------------------------+
```

- Los comentarios se muestran del mas reciente al mas antiguo
- El boton "Colapsar/Expandir" minimiza toda la seccion
- Cada accion (crear, editar, eliminar) genera un audit log automaticamente desde el servicio

### Registro en logs (audit)

Cada operacion en `comentarioService` registra en `mockAuditLogs`:
- **Crear**: entidadTipo `'comentario'`, accion `'crear'`, valorNuevo con el texto
- **Editar**: accion `'editar'`, valorAnterior con texto viejo, valorNuevo con texto nuevo
- **Eliminar**: accion `'eliminar'`, valorAnterior con el comentario eliminado

Todos incluyen usuarioId, usuarioNombre y timestamp. La vista de logs del administrador se implementara posteriormente.
