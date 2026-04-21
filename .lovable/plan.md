

## Plan: Captura manual dd/mm/aaaa para Fecha de Nacimiento

### Causa raíz del cambio

Hoy la fecha de nacimiento se captura con `BirthDateField`, un popover con calendario + selector de mes/año. El usuario quiere reemplazar eso por un input numérico tipo máscara **`dd/mm/aaaa`**, escrito a mano, igual al patrón habitual de cédulas/documentos físicos. Más rápido, más natural para un dato que casi nadie elige "haciendo clic en un calendario".

**Lo importante**: el formato de almacenamiento en BD **no cambia**. La columna `personas.fecha_nacimiento` es `date` (PostgreSQL), y todo el front la maneja como string `YYYY-MM-DD`. Solo cambia la capa de captura/visualización en formularios.

### Decisión arquitectónica

Crear un único componente reutilizable **`BirthDateInput`** (input enmascarado dd/mm/aaaa), y reemplazar todas las apariciones de `BirthDateField` por él. Esto centraliza el comportamiento y deja la puerta abierta para reutilizarlo en futuros campos de fecha manual (vencimientos, fechas de certificación, etc.) sin tocar nada del modelo de datos.

### Comportamiento del nuevo `BirthDateInput`

- **Visual**: input de texto con máscara `dd/mm/aaaa` (placeholder `01/01/1990`).
- **Auto-formato al escribir**: solo dígitos; inserta automáticamente las `/` después del día y del mes. Permite borrar normalmente.
- **Acepta pegado**: si el usuario pega `1990-06-15`, `15/06/1990`, `15-06-1990`, etc., se normaliza al formato visual.
- **Validación**: al perder foco (`onBlur`) valida:
  - 10 caracteres con formato `dd/mm/aaaa`.
  - Día válido para el mes (incluye años bisiestos).
  - Año entre 1900 y el año actual − 10 (rango razonable; el límite inferior amplio para no rechazar adultos mayores ya cargados).
  - Fecha no futura.
- **Errores**: muestra mensaje inline (`<FormMessage>`) usando el sistema de validación existente (zod ya valida `min(1)`; añadiremos un `refine` que verifique formato `YYYY-MM-DD` resultante).
- **Output**: el `onChange` siempre emite **`YYYY-MM-DD`** (vacío si la fecha aún es inválida o incompleta), de modo que el resto del sistema (servicios, tablas, exportaciones, certificados) sigue intacto.
- **Edición**: al recibir un `value` `YYYY-MM-DD` existente, lo muestra como `dd/mm/aaaa` automáticamente, así que toda persona ya guardada se ve y se edita igual.

### Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/components/shared/BirthDateInput.tsx` | **Nuevo**. Input enmascarado dd/mm/aaaa con auto-formato, paste-friendly, validación onBlur, output `YYYY-MM-DD`. |
| `src/pages/personas/PersonaFormPage.tsx` | Reemplaza `BirthDateField` por `BirthDateInput`. Refuerza schema zod: `fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (dd/mm/aaaa)")`. |
| `src/components/matriculas/CrearPersonaModal.tsx` | Reemplaza `BirthDateField` por `BirthDateInput`. Mismo refuerzo de schema. |
| `src/components/personas/PersonaDetailSheet.tsx` | El campo "Fecha de Nacimiento" deja de usar `EditableField type="date"` (popover) y pasa a usar `BirthDateInput` envuelto en una variante inline editable (mismo patrón visual: chevron lápiz + guardar/cancelar). |
| `src/components/shared/BirthDateField.tsx` | **Se conserva** por ahora: aún es útil en otros contextos donde el calendario es preferible. Pero queda **no usado** para fecha de nacimiento. (Marcamos en su JSDoc "deprecated para fechas de nacimiento; usar BirthDateInput".) Puede limpiarse en un PR posterior si se confirma que no se usa en otros lados. |

### Compatibilidad con datos existentes

- **Cero migración SQL**. Las personas ya creadas tienen `fecha_nacimiento` en formato `YYYY-MM-DD`. El nuevo input las recibe y las muestra como `dd/mm/aaaa` automáticamente.
- **Cero impacto** en exportación CSV MinTrabajo, certificados, plantillas de PDF, autocompletado de tokens, listados, filtros — todos siguen leyendo el string `YYYY-MM-DD` que el componente sigue emitiendo.
- **Importación masiva** (`personaPlantilla.ts`): no se toca; ya parsea fechas desde Excel y normaliza a `YYYY-MM-DD`. Sigue compatible.
- **Portal estudiante** (`portalEstudianteService.ts`): solo lee, no escribe — sin cambio.

### Configuraciones futuras

Una vez probado en personas, este `BirthDateInput` queda disponible para:

- Fechas de cobertura/vencimiento de documentos donde hoy se usa `DateField`.
- Fecha de certificación previa, fecha de expedición de cédula, etc.

No se reemplazan ahora — solo se documenta el componente y queda listo para adopción gradual.

### Validación post-cambio

- **Crear persona** (`/personas/nueva` y modal en matrícula): escribir `15071990` autocompleta a `15/07/1990`; al guardar persiste `1990-07-15` en BD.
- **Editar persona existente** (`/personas/<id>` y panel de detalle): la fecha actual se ve como `dd/mm/aaaa`; cambiarla a otro valor válido se guarda correctamente.
- **Pegar** `1985-06-15` o `15-06-1985` se normaliza al visual `15/06/1985`.
- **Errores**: `32/13/2050` → mensaje "Fecha inválida"; `15/02/2030` (futuro) → "La fecha no puede ser futura"; `15/02/1899` → "Año fuera de rango".
- **Listado de personas** y filtros de cumpleaños/fecha siguen mostrando exactamente lo mismo que antes (solo cambió la captura).
- **Certificados y exportación CSV** no se afectan: la cadena `YYYY-MM-DD` continúa fluyendo igual.

### Sin impacto colateral

- Cero cambios en BD, RLS, tipos generados (`Persona.fechaNacimiento: string`), servicios o hooks.
- Cero cambios en `BirthDateField` (queda disponible si en algún módulo se prefiere calendario).
- Cero impacto en módulos que solo leen la fecha (cursos, matrículas, certificación, portal).

