

## Plan: Modal para crear empresa desde matrícula (sin salir del flujo)

### Problema

El botón "Crear empresa" en el formulario de matrícula abre una nueva pestaña (`window.open("/empresas/nueva", "_blank")`), sacando al usuario del flujo.

### Solución

Crear un componente `CrearEmpresaModal` siguiendo el mismo patrón que `CrearPersonaModal`: un `Dialog` con el formulario de empresa embebido. Al guardar, se crea la empresa via `useCreateEmpresa` y se autocompletan los campos de empresa en el formulario de matrícula.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/matriculas/CrearEmpresaModal.tsx` | **Nuevo** — Modal con formulario de empresa (campos: nombre, NIT, representante legal, sector, ARL, dirección, teléfono, contacto, email). Usa `useCreateEmpresa`. Callback `onEmpresaCreated(empresa)` |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Reemplazar `window.open` por apertura del modal. Añadir estado `crearEmpresaOpen`. En `onEmpresaCreated`, setear los campos `empresaId`, `empresaNombre`, `empresaNit`, etc. en el form |

### Detalle del modal

- Campos obligatorios: Nombre, NIT
- Campos opcionales: representante legal, sector económico, ARL, dirección, teléfono empresa, persona contacto, teléfono contacto, email contacto
- Mismos selects (Combobox) para sector y ARL que usa `EmpresaFormPage`
- Al crear exitosamente: cierra el modal, ejecuta `onEmpresaCreated(empresa)` que autocompleta los campos de empresa en el formulario de matrícula
- Esquema de validación reutiliza la misma estructura del `EmpresaFormPage`

