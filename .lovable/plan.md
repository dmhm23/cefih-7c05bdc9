

## Plan: Soporte para múltiples personas de contacto en Empresas

### Resumen

Reemplazar los tres campos planos (`personaContacto`, `telefonoContacto`, `emailContacto`) por un array `contactos` que permita agregar, editar y eliminar personas de contacto. Se mantiene el primer contacto como "principal" para compatibilidad con matrícula.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/types/empresa.ts` | Agregar tipo `ContactoEmpresa { id, nombre, telefono, email, esPrincipal }`. Agregar `contactos: ContactoEmpresa[]` a `Empresa`. Mantener campos legacy (`personaContacto`, etc.) como opcionales para compatibilidad |
| `src/data/mockEmpresas.ts` | Agregar array `contactos` a cada empresa mock (migrando los valores actuales como contacto principal) |
| `src/pages/empresas/EmpresaDetallePage.tsx` | Sección "Datos de Contacto": renderizar lista de contactos con botón "+ Agregar contacto". Cada contacto editable inline con opción de eliminar. Badge "Principal" en el primer contacto |
| `src/pages/empresas/EmpresaFormPage.tsx` | Reemplazar campos fijos por sección dinámica de contactos con botón "Agregar otro contacto" |
| `src/components/empresas/EmpresaDetailSheet.tsx` | Misma lógica: mostrar lista de contactos en vez de campos fijos |
| `src/components/matriculas/CrearEmpresaModal.tsx` | Sección de contactos dinámica (inicia con uno, permite agregar más) |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Al seleccionar empresa, llenar `empresaContactoNombre/Telefono` con el contacto principal (`esPrincipal` o el primero del array) |
| `src/pages/empresas/EmpresasPage.tsx` | Columna "Persona Contacto" muestra el contacto principal; si hay más, muestra badge "+N" |
| `src/services/empresaService.ts` | Ajustar mock service para manejar el array de contactos |

### Detalle de la interfaz

**En formularios (crear/editar empresa):**
- Se muestra un grupo de campos (nombre, teléfono, email) por cada contacto
- Botón "Agregar contacto" al final de la lista
- Botón de eliminar (X) en cada contacto excepto el primero (mínimo 1 contacto)
- Checkbox o badge "Principal" para marcar cuál es el contacto que se usará por defecto en matrículas

**En detalle de empresa:**
- Cards o filas por cada contacto con sus datos
- Botón "+ Agregar contacto" al final
- Editable inline como el resto de campos

**En matrícula:**
- Al seleccionar empresa, se autocompleta con el contacto principal
- Si hay múltiples contactos, se podría mostrar un selector para elegir cuál usar

