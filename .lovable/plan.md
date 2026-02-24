

## PARTE 7 — Sistema de Autocompletado Inteligente (Auto-Fields)

### Resumen

Crear un resolver centralizado que mapea las claves `AutoFieldKey` a datos reales de Persona, Matricula, Curso y Personal, e integrarlo en el contexto de Matricula para que los formatos dinamicos se rendericen con datos reales (no dummy). Tambien agregar claves faltantes al catalogo y validaciones en el builder.

---

### Situacion actual

Ya existe una base solida:
- Catalogo de 34 claves en `autoFieldCatalog.ts` con categorias y etiquetas
- Tipo `AutoFieldKey` en `formatoFormacion.ts`
- Inspector con selector por categoria para `auto_field`
- Preview del builder con datos dummy (`FormatoPreviewDocument.tsx`)
- Los formatos dinamicos se resuelven en matricula via `useFormatosMatricula` y se listan en `FormatosList`

Lo que falta:
- **Resolver centralizado** que tome datos reales y devuelva valores por clave
- **Renderizador de formato dinamico** en contexto de matricula (actualmente solo hay legacy preview dialogs)
- Claves faltantes del spec: `fecha_diligenciamiento`, `aprendiz_firma`, `entrenador_firma`, `supervisor_firma`
- Validacion al guardar formato: auto_field sin key asignada

---

### Cambios detallados

#### 1. Ampliar catalogo y tipo AutoFieldKey

**Archivos:** `src/types/formatoFormacion.ts`, `src/data/autoFieldCatalog.ts`

Agregar las siguientes claves:

| Clave | Label | Categoria | Fuente |
|---|---|---|---|
| `fecha_diligenciamiento` | Fecha de diligenciamiento | Datos del Curso | Sistema (fecha actual) |
| `aprendiz_firma` | Firma del aprendiz | Datos del Aprendiz | Persona.firma |
| `entrenador_firma` | Firma del entrenador | Personal Asignado | Personal.firmaBase64 |
| `supervisor_firma` | Firma del supervisor | Personal Asignado | Personal.firmaBase64 |

Se agregan al union type `AutoFieldKey` y al array `AUTO_FIELD_CATALOG`.

#### 2. Crear utilidad `resolveAutoFieldValue`

**Archivo nuevo:** `src/utils/resolveAutoField.ts`

Funcion pura que recibe un contexto de datos y una clave, y devuelve el valor resuelto:

```text
interface AutoFieldContext {
  persona: Persona | null;
  matricula: Matricula | null;
  curso: Curso | null;
  entrenador: Personal | null;   // del curso.entrenadorId
  supervisor: Personal | null;   // del curso.supervisorId
}

function resolveAutoFieldValue(
  key: AutoFieldKey, 
  ctx: AutoFieldContext
): string | null
```

Mapeo interno (sin hardcodeo por nombre de formato):

- `nombre_aprendiz` -> `persona.nombres + " " + persona.apellidos`
- `documento_aprendiz` -> `persona.numeroDocumento`
- `tipo_documento_aprendiz` -> lookup en TIPOS_DOCUMENTO labels
- `genero_aprendiz` -> lookup en GENEROS labels
- `fecha_nacimiento_aprendiz` -> `persona.fechaNacimiento` formateado
- `telefono_aprendiz` -> `persona.telefono`
- `email_aprendiz` -> `persona.email`
- `rh_aprendiz` -> `persona.rh`
- `nivel_educativo_aprendiz` -> lookup label
- `pais_nacimiento_aprendiz` -> lookup label
- `contacto_emergencia_nombre` -> `persona.contactoEmergencia.nombre`
- `contacto_emergencia_telefono` -> `persona.contactoEmergencia.telefono`
- `empresa_nombre` -> `matricula.empresaNombre`
- `empresa_cargo` -> `matricula.empresaCargo`
- `empresa_nit` -> `matricula.empresaNit`
- `empresa_representante_legal` -> `matricula.empresaRepresentanteLegal`
- `area_trabajo` -> `matricula.areaTrabajo`
- `sector_economico` -> `matricula.sectorEconomico`
- `tipo_vinculacion` -> lookup label
- `eps_aprendiz` -> `matricula.eps`
- `arl_aprendiz` -> `matricula.arl`
- `nivel_previo` -> lookup label
- `centro_formacion_previo` -> `matricula.centroFormacionPrevio`
- `empresa_nivel_formacion` -> lookup label
- `nombre_curso` -> `curso.nombre`
- `tipo_formacion_curso` -> lookup label
- `numero_curso` -> `curso.numeroCurso`
- `fecha_inicio_curso` -> `curso.fechaInicio` formateado
- `fecha_fin_curso` -> `curso.fechaFin` formateado
- `duracion_dias_curso` -> `String(curso.duracionDias)`
- `horas_totales_curso` -> `String(curso.horasTotales)`
- `entrenador_nombre` -> `entrenador.nombres + " " + entrenador.apellidos` (o `curso.entrenadorNombre`)
- `supervisor_nombre` -> `supervisor.nombres + " " + supervisor.apellidos` (o `curso.supervisorNombre`)
- `fecha_diligenciamiento` -> fecha actual formateada
- `aprendiz_firma` -> `persona.firma` (base64, retornado como-is o null)
- `entrenador_firma` -> `entrenador.firmaBase64` (base64 o null)
- `supervisor_firma` -> `supervisor.firmaBase64` (base64 o null)

Si el valor no existe, retorna `null`. El componente que consume decide como mostrar "sin dato".

#### 3. Crear componente `DynamicFormatoDocument`

**Archivo nuevo:** `src/components/matriculas/formatos/DynamicFormatoDocument.tsx`

Similar a `FormatoPreviewDocument` pero usa datos reales en lugar de dummy:

**Props:**
```text
interface DynamicFormatoDocumentProps {
  formato: FormatoFormacion;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
  entrenador: Personal | null;
  supervisor: Personal | null;
}
```

- Usa `DocumentHeader` igual que la preview
- Para cada bloque `auto_field`: llama `resolveAutoFieldValue(key, ctx)` y muestra el valor o un placeholder gris "Sin dato"
- Para firmas (`aprendiz_firma`, `entrenador_firma`, `supervisor_firma`): si hay base64 muestra `<img>`, si no muestra placeholder dashed con "Firma no registrada"
- Los campos de tipo `text`, `date`, `number`, etc. buscan respuestas en `FormatoRespuesta.answers[bloqueId]` (futuro) — por ahora muestran placeholder editable o vacio
- No es editable por el estudiante en esta fase (solo visualizacion)

#### 4. Crear `DynamicFormatoPreviewDialog`

**Archivo nuevo:** `src/components/matriculas/formatos/DynamicFormatoPreviewDialog.tsx`

Dialog profesional que muestra un formato dinamico con datos reales, siguiendo el mismo patron de los legacy dialogs (max-w-6xl, 90vh, ScrollArea, boton PDF):

**Props:**
```text
interface DynamicFormatoPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formato: FormatoFormacion | null;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
}
```

Internamente:
- Usa hooks `usePersonal(curso.entrenadorId)` y `usePersonal(curso.supervisorId)` para obtener entrenador y supervisor
- Renderiza `DynamicFormatoDocument` pasando todos los datos

#### 5. Integrar en MatriculaDetallePage y MatriculaDetailSheet

**Archivos:** `src/pages/matriculas/MatriculaDetallePage.tsx`, `src/components/matriculas/MatriculaDetailSheet.tsx`

Actualmente, cuando se hace click en un formato de la lista:
- Si tiene `legacyComponentId`, abre el dialog legacy correspondiente
- Si NO tiene `legacyComponentId`, no hay handler

Cambio: agregar logica para formatos sin `legacyComponentId`:
- Guardar el formato seleccionado completo (no solo el id)
- Si el formato seleccionado NO es legacy, abrir `DynamicFormatoPreviewDialog` pasando el formato, persona, matricula y curso
- Si ES legacy, seguir abriendo el dialog legacy como hasta ahora

Esto requiere cambiar `previewFormato` de `string | null` a `{ id: string; formato?: FormatoFormacion } | null` o mantener el id y buscar el formato en `formatosDinamicos`.

#### 6. Validacion en el builder al guardar

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

En `handleSave`, antes de guardar, validar:
- Si algun bloque `auto_field` no tiene `props.key` o tiene una key vacia, mostrar toast de error y no guardar
- Mensaje: "Hay campos automaticos sin clave asignada. Revisa los bloques marcados como 'Auto'."

#### 7. Actualizar FormatoPreviewDocument (builder) con claves nuevas

**Archivo:** `src/components/formatos/FormatoPreviewDocument.tsx`

Agregar las 4 nuevas claves al `DUMMY_AUTO_VALUES`:
- `fecha_diligenciamiento`: "24/02/2026"
- `aprendiz_firma`: "(Firma)" (texto, no imagen en dummy)
- `entrenador_firma`: "(Firma)" 
- `supervisor_firma`: "(Firma)"

---

### Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/types/formatoFormacion.ts` | Agregar 4 nuevas claves a `AutoFieldKey` |
| `src/data/autoFieldCatalog.ts` | Agregar 4 entradas al catalogo |
| `src/utils/resolveAutoField.ts` | **Nuevo**: resolver centralizado de auto-fields |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | **Nuevo**: documento con datos reales |
| `src/components/matriculas/formatos/DynamicFormatoPreviewDialog.tsx` | **Nuevo**: dialog profesional para formatos dinamicos |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Integrar DynamicFormatoPreviewDialog para formatos no-legacy |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Integrar DynamicFormatoPreviewDialog para formatos no-legacy |
| `src/pages/formatos/FormatoEditorPage.tsx` | Validacion de auto_field sin key al guardar |
| `src/components/formatos/FormatoPreviewDocument.tsx` | Agregar claves nuevas a DUMMY_AUTO_VALUES |

### Lo que NO cambia

- Layout del builder (Partes 1-5)
- Inspector de propiedades (ya funciona para auto_field)
- Drag and drop
- Legacy preview dialogs (siguen funcionando para formatos con legacyComponentId)
- Logica de guardado y dirty state
- No se duplican datos — los auto-fields se resuelven en tiempo de render

