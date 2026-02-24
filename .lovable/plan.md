

## PARTE 6 — Vista Previa Profesional

### Objetivo

Reemplazar el `PreviewDialog` actual (lineas 285-389) con una vista previa profesional que renderiza el formato como un documento real, usando el encabezado institucional estandar (`DocumentHeader`), datos dummy de estudiante/curso, y estilos fieles al documento impreso.

---

### Situacion actual

- `PreviewDialog` es un `Dialog` pequeno (max-w-3xl) con renderizado basico de bloques.
- No usa el encabezado institucional (`DocumentHeader`) que todos los documentos reales usan.
- No muestra datos dummy reales — los campos auto aparecen como texto gris generico.
- No tiene estetica de "hoja" (margenes, tipografia de documento).
- No es consistente con los preview dialogs existentes (InfoAprendiz, RegistroAsistencia, etc.).

---

### Cambios detallados

#### 1. Crear componente `FormatoPreviewDocument`

**Archivo:** `src/components/formatos/FormatoPreviewDocument.tsx` (nuevo)

Componente que renderiza el formato como documento imprimible, reutilizando `DocumentHeader` y los patrones visuales de los documentos existentes.

**Props:**
```typescript
interface FormatoPreviewDocumentProps {
  formato: Partial<FormatoFormacion>;
}
```

**Datos dummy embebidos** (constante `DUMMY_DATA`):
- Persona: Juan Carlos Perez Martinez, CC 1.023.456.789, genero M, nacimiento 15/03/1990, telefono 310-456-7890, email juan.perez@email.com, RH O+, nivel educativo Tecnologo.
- Empresa: Construcciones ABC S.A.S., NIT 900.123.456-7, cargo Operario, area Construccion, sector Construccion, vinculacion Contrato obra.
- Curso: "Trabajo Seguro en Alturas - Nivel Avanzado", tipo Formacion, numero 2025-001, inicio 15/01/2025, fin 20/01/2025, 6 dias, 48 horas.
- Personal: Entrenador "Carlos Rodriguez", Supervisor "Ana Martinez".

**Estructura del documento:**

1. `DocumentHeader` con nombre del formato, codigo, version, subsistema "FORMACION", fechas del documentMeta o defaults.

2. Por cada bloque en `formato.bloques`, renderizar segun tipo:

| Tipo | Renderizado en preview |
|---|---|
| `section_title` | `<div>` con borde inferior, h2 uppercase tracking-widest, estilo identico a `.section-title` de los documentos existentes |
| `heading` | h3 con font-bold, nivel respetado (H1 = text-lg, H2 = text-base, H3 = text-sm) |
| `paragraph` | Texto justificado con `text-sm leading-relaxed` |
| `text` | `FieldCell` con label y valor dummy "Dato de ejemplo" |
| `date` | `FieldCell` con label y valor "15/01/2025" |
| `number` | `FieldCell` con label y valor "42" |
| `radio` | `FieldCell` con label y la primera opcion seleccionada visualmente (circulo relleno) |
| `select` | `FieldCell` con label y la primera opcion como valor |
| `checkbox` | Checkbox marcado con label |
| `auto_field` | `FieldCell` con label, valor resuelto desde `DUMMY_DATA` segun la `key`, y badge "Auto" pequeno al lado del label |
| `signature_aprendiz` | Box dashed con texto "Firma del Aprendiz" y placeholder gris |
| `signature_entrenador_auto` | Box dashed con nombre "Carlos Rodriguez" |
| `signature_supervisor_auto` | Box dashed con nombre "Ana Martinez" |
| `attendance_by_day` | Tabla simplificada con 6 filas (una por dia del curso dummy) y columnas Fecha/Hora entrada/Hora salida/Firma |
| `health_consent` | Badge "Bloque complejo" con nota informativa |
| `data_authorization` | Badge "Bloque complejo" con nota informativa |
| `evaluation_quiz` | Badge "Bloque complejo" con nota informativa |
| `satisfaction_survey` | Badge "Bloque complejo" con nota informativa |

Los campos se organizan en grid de 2 columnas (`grid-2`) siguiendo el patron de los documentos existentes. Los bloques con `props.span` usan `grid-column: span 2`.

**Sub-componente `FieldCell`** (reutilizar el patron de InfoAprendizDocument):
```
<div className="field-cell">
  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
  <p className="text-sm font-medium">{value}</p>
</div>
```

#### 2. Crear componente `FormatoPreviewDialog`

**Archivo:** `src/components/formatos/FormatoPreviewDialog.tsx` (nuevo)

Dialog profesional de vista previa, siguiendo el patron de `RegistroAsistenciaPreviewDialog` y `ParticipacionPtaAtsPreviewDialog`.

**Estructura:**
- `Dialog` con `max-w-6xl h-[90vh]`, layout flex column, padding 0.
- Header fijo: titulo "Vista Previa — {nombre}", boton "Descargar PDF" (usando `window.print()` como los demas dialogos).
- Body: `ScrollArea` con fondo `bg-muted/30`, documento centrado con `shadow-lg rounded border bg-white`.
- El documento renderizado con `FormatoPreviewDocument` dentro de un `div ref={documentRef}`.

**Print/PDF:**
- Misma logica de `handlePrint` que los dialogos existentes: clonar el DOM del documento, inyectar `PRINT_STYLES`, abrir ventana y `window.print()`.
- Reutilizar los mismos `PRINT_STYLES` CSS del proyecto (patron ya establecido).

#### 3. Eliminar `PreviewDialog` inline

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

- Eliminar la funcion `PreviewDialog` (lineas 285-389).
- Importar `FormatoPreviewDialog` del nuevo componente.
- Reemplazar `<PreviewDialog ... />` (linea 860) por `<FormatoPreviewDialog ... />`.
- Las props se mantienen: `open`, `onOpenChange`, `formato`.

#### 4. Mapeo de auto_field a datos dummy

Dentro de `FormatoPreviewDocument`, crear un `Record<AutoFieldKey, string>` con los valores dummy:

```typescript
const DUMMY_AUTO_VALUES: Record<string, string> = {
  nombre_aprendiz: "Juan Carlos Pérez Martínez",
  documento_aprendiz: "1.023.456.789",
  tipo_documento_aprendiz: "Cédula de Ciudadanía",
  genero_aprendiz: "Masculino",
  fecha_nacimiento_aprendiz: "15/03/1990",
  telefono_aprendiz: "310-456-7890",
  email_aprendiz: "juan.perez@email.com",
  rh_aprendiz: "O+",
  nivel_educativo_aprendiz: "Tecnólogo",
  empresa_nombre: "Construcciones ABC S.A.S.",
  empresa_nit: "900.123.456-7",
  empresa_cargo: "Operario",
  nombre_curso: "Trabajo Seguro en Alturas - Nivel Avanzado",
  fecha_inicio_curso: "15/01/2025",
  fecha_fin_curso: "20/01/2025",
  entrenador_nombre: "Carlos Rodríguez",
  supervisor_nombre: "Ana Martínez",
  // ... demas campos
};
```

---

### Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/components/formatos/FormatoPreviewDocument.tsx` | Nuevo: documento con encabezado institucional, datos dummy, renderizado profesional por tipo de bloque |
| `src/components/formatos/FormatoPreviewDialog.tsx` | Nuevo: dialog grande (90vh) con scroll, boton PDF, patron consistente con los demas preview dialogs |
| `src/pages/formatos/FormatoEditorPage.tsx` | Eliminar PreviewDialog inline, importar y usar FormatoPreviewDialog |

### Lo que NO cambia

- Layout del builder (Partes 1-5)
- Inspector de propiedades
- Drag and drop
- Logica de guardado y dirty state
- El estado del builder se preserva al abrir/cerrar la vista previa

