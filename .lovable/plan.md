

# Grupo 2 -- Cumplimiento Legal y Documentacion

## Analisis de brechas: Estado actual vs. Requerimientos

| Requerimiento | Estado actual | Ajuste necesario |
|---|---|---|
| Consentimiento informado de salud (restriccion medica, alergias, medicamentos, embarazo, lectoescritura) | No existe | Crear modelo de datos y seccion en formulario/detalle |
| Autorizacion de tratamiento de datos (acepto/rechazo) | No existe | Agregar campo booleano y texto legal |
| Firma digital con react-signature-canvas | Existe `firmaCapturada` y `firmaBase64` en el modelo, existe hook `useCapturarFirma` y servicio `capturarFirma` | Crear componente visual de captura de firma con react-signature-canvas |
| Documentos dinamicos por nivel de formacion (cedula, examen medico, ARL, EPS, planilla, curso previo) | Existen solo 3 documentos fijos (cedula, examen medico, certificado EPS) sin ARL ni planilla | Ampliar tipos de documentos, hacer la lista dinamica segun nivel de formacion |
| Carga de documentos a Google Drive (simulado) | Existe `handleSimularDocumento` con URL ficticia | Crear servicio de carga simulada a Google Drive con estructura AÑO/ID_CURSO/NOMBRE_CEDULA |
| Opcion de cargar PDF consolidado con checklist | No existe | Agregar opcion de carga unica con checklist manual |
| Fechas asociadas a documentos (fecha examen medico, fecha ARL) | Solo existe `fechaCarga` generico | Agregar campo `fechaDocumento` (fecha del documento en si, no de carga) |
| Vista del estudiante para firmar (QR/enlace) | No existe | Fuera de alcance de esta fase frontend; se prepara la estructura pero no se implementa el flujo publico completo |

## Plan de implementacion

### Paso 1: Instalar react-signature-canvas

Agregar la dependencia `react-signature-canvas` y sus tipos `@types/react-signature-canvas`.

### Paso 2: Actualizar tipos y modelo de datos

**Archivo: `src/types/matricula.ts`**

Agregar al tipo `Matricula`:

```
// Consentimiento de salud
consentimientoSalud: boolean;
restriccionMedica: boolean;
restriccionMedicaDetalle?: string;
alergias: boolean;
alergiasDetalle?: string;
consumoMedicamentos: boolean;
consumoMedicamentosDetalle?: string;
embarazo?: boolean; // solo visible si genero = F
nivelLectoescritura: boolean;

// Autorizacion de datos
autorizacionDatos: boolean;
```

Ampliar `TipoDocumento` para incluir:

```
'cedula' | 'examen_medico' | 'certificado_eps' | 'arl' | 'planilla_seguridad_social' | 'curso_previo' | 'consolidado' | 'otro'
```

Agregar a `DocumentoRequerido`:

```
fechaDocumento?: string;       // fecha del documento (ej. fecha del examen medico)
fechaInicioCobertura?: string; // para ARL
opcional?: boolean;            // planilla de seguridad social es opcional
```

### Paso 3: Crear servicio simulado de Google Drive

**Nuevo archivo: `src/services/driveService.ts`**

Servicio que simula la subida de archivos a Google Drive:

- `uploadDocumento(matriculaId, documentoTipo, archivo)`: Simula subida, genera URL con estructura `AÑO/ID_CURSO/NOMBRE_CEDULA/ARCHIVO`
- `uploadConsolidado(matriculaId, archivo)`: Sube un PDF unico y asocia multiples tipos de documento
- Retorna URL ficticia de Google Drive
- No almacena binarios (solo genera la referencia URL simulada)

### Paso 4: Crear funcion para generar documentos segun nivel de formacion

**Archivo: `src/services/matriculaService.ts`**

Agregar funcion `getDocumentosRequeridos(tipoFormacion, nivelPrevio)` que retorna la lista dinamica:

- **Trabajador Autorizado / Reentrenamiento**: Cedula, Examen medico (+fecha), ARL (+fecha inicio cobertura), EPS, Planilla seguridad social (opcional)
- **Coordinador T.A.**: Todo lo anterior + Curso previo (solo historial)
- **Jefe de Area**: Cedula, ARL (+fecha), EPS, Planilla seguridad social (opcional)

Actualizar el `create()` para usar esta funcion en vez de la lista fija actual.

### Paso 5: Crear componente de captura de firma

**Nuevo archivo: `src/components/matriculas/FirmaCaptura.tsx`**

Componente que usa `react-signature-canvas`:

- Canvas de firma (fondo blanco, trazo negro)
- Botones: Limpiar, Guardar
- Al guardar: exporta como PNG base64 y llama al servicio `capturarFirma`
- Vista previa de firma ya capturada (imagen del base64 existente)
- Indicador visual de estado (capturada / pendiente)

### Paso 6: Crear componente de consentimiento de salud

**Nuevo archivo: `src/components/matriculas/ConsentimientoSalud.tsx`**

Componente reutilizable con:

- Recordatorio visual (banner amarillo): "Confirme con el estudiante antes de continuar"
- Cada pregunta como fila con Switch (SI/NO) y campo de texto condicional
- Pregunta de embarazo: solo visible si el genero de la persona es "F"
- Checkbox de nivel de lectoescritura
- Valor por defecto de todo: NO / false

### Paso 7: Crear componente de carga de documentos

**Nuevo archivo: `src/components/matriculas/DocumentosCarga.tsx`**

Componente que:

- Muestra la lista de documentos requeridos (dinamica segun nivel)
- Cada documento tiene: nombre, estado (badge), boton de carga, campo de fecha si aplica
- Opcion toggle: "Cargar documentos individuales" vs "Cargar PDF consolidado"
- Si consolidado: input de archivo unico + checklist con los documentos que incluye
- Al cargar: llama a `driveService.uploadDocumento()` y actualiza estado a "cargado"
- Indicador de progreso general (X de Y documentos cargados)

### Paso 8: Agregar nuevas secciones al formulario de creacion

**Archivo: `src/pages/matriculas/MatriculaFormPage.tsx`**

Agregar dos nuevas Cards despues de la seccion de Vinculacion Laboral:

**Seccion 5 - Consentimiento de Salud**
- Usa el componente `ConsentimientoSalud`
- Se integra con el schema de zod (nuevos campos)

**Seccion 6 - Autorizacion de Datos**
- Checkbox "Acepto" con enlace a texto completo (modal o accordion)
- Por defecto marcado, pero editable

No se incluye firma ni documentos en el formulario de creacion (se hacen post-creacion desde la vista de detalle/panel lateral).

### Paso 9: Agregar secciones al panel lateral (DetailSheet)

**Archivo: `src/components/matriculas/MatriculaDetailSheet.tsx`**

Reorganizar el panel lateral para incluir las nuevas secciones como subsecciones colapsables o fijas:

- **Seccion: Consentimiento de Salud** -- Resumen compacto (iconos de check/warning para cada pregunta). Click para editar abre estado inline.
- **Seccion: Documentos** -- Lista compacta con estados (badge verde/amarillo/rojo). Boton para cargar documento. Progreso X/Y.
- **Seccion: Firma Digital** -- Vista previa miniatura de la firma si existe, o boton "Capturar firma" que abre un Dialog con `FirmaCaptura`.

El panel lateral sigue el patron del modulo de Personas: edicion inline con `EditableField` y guardado con boton flotante al detectar cambios.

### Paso 10: Actualizar la pagina de detalle completo

**Archivo: `src/pages/matriculas/MatriculaDetallePage.tsx`**

Agregar Cards completas para:

- Consentimiento de salud (vista expandida con todas las respuestas)
- Documentos (lista con carga individual, fechas, estados)
- Firma (componente de captura embebido directamente)
- Autorizacion de datos (estado y fecha)

Integrar los botones de carga de documentos con el `driveService`.

### Paso 11: Actualizar mock data

**Archivo: `src/data/mockData.ts`**

- Agregar campos de consentimiento a las matriculas existentes
- Ampliar la lista de documentos con ARL, planilla, etc.
- Agregar datos de ejemplo variados (algunas con consentimiento completo, otras parciales)

### Paso 12: Actualizar hooks

**Archivo: `src/hooks/useMatriculas.ts`**

Agregar hook para la carga de documentos a Drive:

```
useUploadDocumento() -- llama a driveService + updateDocumento
```

## Secuencia de implementacion

1. Instalar dependencia react-signature-canvas (paso 1)
2. Tipos y servicios (pasos 2, 3, 4)
3. Componentes UI nuevos: FirmaCaptura, ConsentimientoSalud, DocumentosCarga (pasos 5, 6, 7)
4. Formulario de creacion actualizado (paso 8)
5. Panel lateral y detalle completo (pasos 9, 10)
6. Mock data y hooks (pasos 11, 12)

## Notas tecnicas

- **react-signature-canvas**: Se usa para la captura de firma como imagen PNG. La firma se almacena como base64 en el modelo (ya existente en `firmaBase64`). No se guarda en base de datos real, solo en el mock service.
- **Google Drive simulado**: El `driveService` genera URLs ficticias siguiendo la estructura AÑO/ID_CURSO/NOMBRE_CEDULA. No hay conexion real a Google Drive API; se prepara la interfaz para cuando se integre el backend real.
- **Documentos dinamicos**: La lista de documentos requeridos cambia segun el tipo de formacion y nivel. Esto reemplaza la lista fija de 3 documentos que se crea actualmente en `matriculaService.create()`.
- **Panel lateral vs. pagina de detalle**: El panel lateral muestra resumenes compactos con acciones rapidas (cargar doc, capturar firma). La pagina de detalle muestra todo expandido con el componente de firma embebido directamente.
- **Flujo publico del estudiante (QR/enlace)**: El requerimiento menciona que el estudiante firma desde su celular via QR. Esto requiere una ruta publica sin autenticacion, lo cual queda fuera de esta fase. Se prepara el modelo de datos pero no se implementa la vista publica.

