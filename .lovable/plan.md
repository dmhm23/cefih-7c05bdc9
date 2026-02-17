

## Modal de Estudiante editable en /matriculas/:id

### Situacion actual

El modal que se abre al hacer clic en el nombre del estudiante muestra datos en modo solo lectura (texto estatico). Sin embargo, el panel lateral en /matriculas ya tiene toda la logica de edicion de persona implementada con `EditableField`, `handlePersonaFieldChange`, `handlePersonaNestedFieldChange` y guardado via `useUpdatePersona`.

### Cambios propuestos

**Archivo unico a modificar:** `src/pages/matriculas/MatriculaDetallePage.tsx`

### 1. Agregar imports y hooks necesarios

- Importar `useUpdatePersona` desde `@/hooks/usePersonas`.
- Importar las opciones de formulario necesarias: `TIPOS_DOCUMENTO`, `GENEROS`, `NIVELES_EDUCATIVOS`, `GRUPOS_SANGUINEOS`, `PAISES` desde `@/data/formOptions`.
- Importar iconos adicionales: `User`, `FileText`, `Mail`, `Phone`, `UserCircle`, `Droplet`, `Globe`, `AlertCircle`, `GraduationCap`, `Calendar` (los que no esten ya importados).
- Importar `PersonaFormData` desde `@/types/persona`.

### 2. Agregar estado y logica de edicion de persona

- Nuevo estado: `personaFormData` (`Partial<PersonaFormData>`) para acumular cambios.
- Nuevo estado: `isPersonaDirty` (boolean) para saber si hay cambios pendientes.
- Instanciar `useUpdatePersona()`.
- Funcion `handlePersonaFieldChange(field, value)`: actualiza `personaFormData` y marca `isPersonaDirty`.
- Funcion `handlePersonaNestedFieldChange("contactoEmergencia", field, value)`: para campos anidados del contacto de emergencia.
- Helper `getPersonaValue(field)`: retorna el valor editado si existe, o el valor original de `persona`.
- Al cerrar el modal o cancelar: resetear `personaFormData` e `isPersonaDirty`.

### 3. Transformar el modal de solo lectura a editable

Reemplazar el contenido del `Dialog` (lineas 619-659) por campos `EditableField`, replicando la estructura del panel lateral:

- **Nombres** - `EditableField` tipo texto, editable
- **Apellidos** - `EditableField` tipo texto, editable
- **Tipo Documento** - `EditableField` tipo select con `TIPOS_DOCUMENTO`, editable
- **No. Documento** - `EditableField` tipo texto, **`editable={false}`** (restriccion solicitada)
- **Genero** - `EditableField` tipo select con `GENEROS`
- **Fecha Nacimiento** - `EditableField` tipo date
- **RH** - `EditableField` tipo select con `GRUPOS_SANGUINEOS`
- **Nivel Educativo** - `EditableField` tipo select con `NIVELES_EDUCATIVOS`
- **Pais Nacimiento** - `EditableField` tipo select con `PAISES`
- **Email** - `EditableField` tipo texto
- **Telefono** - `EditableField` tipo texto
- **Contacto de Emergencia** (subseccion): nombre, telefono, parentesco

### 4. Guardar y cancelar dentro del modal

- Si `isPersonaDirty` es true, mostrar botones "Guardar" y "Cancelar" en el `DialogFooter`.
- Al guardar: llamar `updatePersona.mutateAsync({ id: persona.id, data: personaFormData })`, mostrar toast de exito, resetear estado.
- Al cancelar: resetear `personaFormData` e `isPersonaDirty`.
- Mantener el enlace "Ver perfil completo" siempre visible.

### 5. Reset al cambiar de matricula o cerrar

- Resetear `personaFormData` e `isPersonaDirty` cuando `personaModalOpen` cambia a `false`.

