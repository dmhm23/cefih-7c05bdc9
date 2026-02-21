

## Corrección: Scroll horizontal solo en la tabla

### Problema detectado

Cuando se activan muchas columnas en el selector, el scroll horizontal se propaga a toda la vista (el panel derecho completo) en lugar de quedarse contenido exclusivamente dentro de la tabla. Esto ocurre porque el contenedor de la tabla no tiene una restricción de ancho que lo obligue a respetar los límites de su padre.

### Solución

Modificar el componente `DataTable` para que el contenedor externo de la tabla tenga `overflow-hidden` y el contenedor interno con `overflow-x-auto` quede correctamente acotado. Adicionalmente, asegurar que el wrapper principal use `min-w-0` para evitar que el contenido de la tabla expanda el layout flex/grid del padre.

### Cambios

**Archivo: `src/components/shared/DataTable.tsx`**
- Agregar `min-w-0 w-full` al contenedor raiz (`div.space-y-2`) para que no crezca mas alla del espacio disponible del padre.
- Agregar `overflow-hidden` al div con borde (`rounded-lg border`) para que actue como barrera de scroll.
- El `overflow-x-auto` interno ya existe y seguira manejando el scroll horizontal de la tabla.

Esto garantiza que:
- Solo la tabla hace scroll horizontal cuando hay muchas columnas.
- El header, toolbar, filtros y panel lateral no se desplazan horizontalmente.
- El layout general de la pagina se mantiene intacto.

### Verificacion de columnas ocultas por defecto

Las tres tablas ya tienen las columnas adicionales configuradas con `visible: false`:
- **Personas**: email, genero, nivelEducativo, tipoDocumento, fechaNacimiento, paisNacimiento, rh, areaTrabajo, contactoEmergencia (todas ocultas)
- **Cursos**: supervisor, numeroCurso, tipoFormacion, minTrabajoRegistro, minTrabajoResponsable, horasTotales (todas ocultas)
- **Matriculas**: tipoVinculacion, nit, cargo, nivelFormacion, eps, arl, valorCupo, abono, saldo, formaPago, fechaPago, ctaFactNumero, nivelPrevio (todas ocultas)

No se requieren cambios en las paginas de listado, solo en el componente `DataTable`.
