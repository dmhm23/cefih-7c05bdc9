

# Ajuste de columnas en la tabla de Matriculas

## Cambios solicitados

Reemplazar las columnas actuales de la tabla por las siguientes 7 columnas operativas:

| Columna actual | Accion |
|---|---|
| Documento | Eliminar |
| Estudiante | Renombrar a "Asistente" |
| Curso | Eliminar |
| Tipo | Eliminar |
| Estado | Eliminar |
| Pago | Mantener como Pago |
| Fecha | Colocar la fecha de creación del registro, no tiene nada que ver con la fecha del curso, son independientes. |
| Actions | Mantener |

Nuevas columnas a agregar: **Empresa**, **Fecha Cobertura ARL**, **Fecha Examen**, **Estado Documental**.

## Columnas resultantes (en orden)

1. **Fecha Creacion** -- `createdAt` formateado dd/MM/yyyy
2. **Empresa** -- `empresaNombre` si `tipoVinculacion === 'empresa'`, sino mostrar "Independiente"
3. **Asistente** -- Nombre completo de la persona (nombres + apellidos)
4. **Fecha Cobertura ARL** -- Extraida del documento tipo `arl` en el array `documentos[]`, campo `fechaInicioCobertura`. Si no existe, mostrar "-"
5. **Fecha Examen** -- Extraida del documento tipo `examen_medico` en el array `documentos[]`, campo `fechaDocumento`. Si no existe, mostrar "-"
6. **Estado Documental** -- "Completo" (badge verde) si todos los documentos no opcionales tienen estado `cargado` o `verificado`; "Pendiente" (badge amarillo) en caso contrario
7. **Estado Financiero** -- "Pagado" (badge verde) si `pagado === true`; "Pendiente" (badge amarillo) si no
8. **Acciones** -- Boton de ver (sin cambios)

## Detalles tecnicos

### Archivo: `src/pages/matriculas/MatriculasPage.tsx`

- Actualizar `DEFAULT_COLUMNS` con las 8 nuevas keys
- Reemplazar el array `columns` con las 8 definiciones nuevas
- Agregar dos funciones helper:
  - `getDocumentoFecha(matricula, tipo, campo)` -- busca en `m.documentos` el documento del tipo indicado y retorna la fecha solicitada
  - `getEstadoDocumental(matricula)` -- retorna "Completo" o "Pendiente" segun el estado de los documentos obligatorios
- Actualizar los filtros: reemplazar el filtro "Estado" por "Estado Documental" (Pendiente/Completo) y mantener "Estado de Pago"
- Eliminar el filtro "Tipo de Formacion" (ya no hay columna de tipo visible)
