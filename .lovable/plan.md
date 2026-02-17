

## Dos Nuevos Formatos: Registro de Asistencia y Participacion PTA-ATS

### Resumen

Crear dos nuevos documentos automaticos que reutilizan datos existentes de Persona, Matricula y Curso. Ambos requieren que el estudiante haya completado el formato "Informacion del Aprendiz" (autorizacion + firma). Para pruebas, la matricula m1 (Juan Carlos Rodriguez Perez) se actualizara en mock data para simular ese estado completo.

---

### 1. Actualizar mock data (matricula m1)

En `src/data/mockData.ts`, modificar la matricula `m1` para simular que Juan Carlos ya diligencio el formato de Informacion del Aprendiz:

- `firmaCapturada: true`
- `firmaBase64`: un valor base64 valido (mismo patron que m2/m4)
- `autorizacionDatos: true` (ya esta)

---

### 2. Actualizar tipo FormatoDocumento

En `src/types/formato.ts`, agregar los nuevos tipos al campo `tipo`:

```
tipo: 'info_aprendiz' | 'registro_asistencia' | 'participacion_pta_ats'
```

---

### 3. Nuevo componente: RegistroAsistenciaDocument

**Archivo**: `src/components/matriculas/formatos/RegistroAsistenciaDocument.tsx`

Props: `persona`, `matricula`, `curso`, `fechaAsistencia` (editable por admin), `onFechaChange`

Contenido del documento:
- `<DocumentHeader>` con: nombre "REGISTRO DE ASISTENCIA DE FORMACION Y ENTRENAMIENTO EN ALTURAS", codigo "FIH04-014", version "009", fechaCreacion "12/04/2018", fechaEdicion "03/2025", subsistema "Alturas"
- Cuerpo con campos tipo ficha (FieldCell, grid 2 columnas):
  - Fecha de asistencia (editable por admin, autocompletada desde `curso.fechaInicio`)
  - Empresa (desde `matricula.empresaNombre` o "Independiente")
  - Nombres y apellidos completos (desde Persona, NO editables)
  - Tipo de documento (desde Persona, NO editable)
  - Numero de documento (desde Persona, NO editable)
  - Numero de celular (desde Persona, NO editable)
  - Tema de la actividad (nombre del curso)
  - Instructor a cargo (entrenador del curso)
- Seccion de firma: muestra la imagen `firmaBase64` de la matricula (reutilizada, sin nueva captura)
- Marca de agua "Borrador" si no hay firma

---

### 4. Nuevo componente: RegistroAsistenciaPreviewDialog

**Archivo**: `src/components/matriculas/formatos/RegistroAsistenciaPreviewDialog.tsx`

Sigue el mismo patron que `InfoAprendizPreviewDialog`:
- Dialog con vista previa y boton "Descargar PDF"
- `PRINT_STYLES` reutilizando los estilos de encabezado ya definidos
- Nombre de archivo: `registro-asistencia-{tipoDoc}-{numDoc}-{nombres}-{apellidos}.pdf`
- La fecha de asistencia es editable dentro de la preview (Input controlado)
- Bloqueado si `!matricula.firmaCapturada || !matricula.autorizacionDatos` (muestra mensaje)

---

### 5. Nuevo componente: ParticipacionPtaAtsDocument

**Archivo**: `src/components/matriculas/formatos/ParticipacionPtaAtsDocument.tsx`

Props: `persona`, `matricula`, `curso`, `fechaDiligenciamiento` (editable), `onFechaChange`

Contenido del documento:
- `<DocumentHeader>` con: nombre "PARTICIPACION EN EL DILIGENCIAMIENTO DEL PTA - ATS", codigo "FIH04-077", version "001", fechaCreacion "10/03/2025", fechaEdicion "03/2025", subsistema "Alturas"
- Bloque de texto normativo fijo (no editable):
  > "En cumplimiento de lo establecido en la Resolucion 4272 de 2021 del Ministerio del Trabajo, por la cual se establecen los requisitos minimos de seguridad para el desarrollo de trabajo en alturas, declaro que he participado activamente en el diligenciamiento del Permiso de Trabajo en Alturas (PTA) y el Analisis de Trabajo Seguro (ATS), previo al inicio de las actividades de formacion y entrenamiento en trabajo en alturas."
- Fecha de diligenciamiento (autocompletada desde `curso.fechaInicio`, editable por admin)
- Datos del estudiante (NO editables): nombres, apellidos, tipo y numero de documento
- Firma digital reutilizada desde `matricula.firmaBase64`
- Marca de agua "Borrador" si no hay firma

---

### 6. Nuevo componente: ParticipacionPtaAtsPreviewDialog

**Archivo**: `src/components/matriculas/formatos/ParticipacionPtaAtsPreviewDialog.tsx`

Mismo patron que los otros dialogs de preview:
- Vista previa + descarga PDF
- Nombre de archivo: `participacion-pta-ats-{tipoDoc}-{numDoc}-{nombres}-{apellidos}.pdf`
- Bloqueado si no hay firma previa

---

### 7. Integrar en MatriculaDetallePage

En `src/pages/matriculas/MatriculaDetallePage.tsx`:

- Importar los dos nuevos PreviewDialog
- Agregar estados para `previewFormato` que acepte los nuevos IDs
- En la seccion "Formatos para Formacion" del sidebar, agregar los dos nuevos formatos a la lista de `FormatosList`:
  - "Registro de Asistencia" con estado calculado (completo si firma existe, borrador si no)
  - "Participacion PTA - ATS" con estado calculado igual
- Renderizar los dos nuevos PreviewDialog condicionalmente segun `previewFormato`

---

### Resumen de archivos

| Archivo | Accion |
|---------|--------|
| `src/data/mockData.ts` | Modificar m1: agregar firma |
| `src/types/formato.ts` | Agregar tipos nuevos |
| `src/components/matriculas/formatos/RegistroAsistenciaDocument.tsx` | Crear |
| `src/components/matriculas/formatos/RegistroAsistenciaPreviewDialog.tsx` | Crear |
| `src/components/matriculas/formatos/ParticipacionPtaAtsDocument.tsx` | Crear |
| `src/components/matriculas/formatos/ParticipacionPtaAtsPreviewDialog.tsx` | Crear |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Integrar formatos |

