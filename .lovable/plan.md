

## Formato "Informacion del Aprendiz" — Preview + Descarga PDF

### Resumen

Transformar la seccion "Progreso" del sidebar en `/matriculas/:id` en una seccion "Formatos para Formacion" que lista documentos generables. El primero es "Informacion del Aprendiz", un documento autodiligenciado con datos de Persona, Matricula y Curso, con vista previa tipo documento y descarga PDF.

---

### 1. Arquitectura general

```text
MatriculaDetallePage.tsx
  └─ Sidebar (col derecha)
      └─ Seccion "Formatos para Formacion" (reemplaza "Progreso")
          └─ FormatosList (lista de formatos con acciones)
              └─ Fila: "Informacion del Aprendiz" [Ver preview] [Descargar PDF]

InfoAprendizPreviewDialog.tsx (modal ancho)
  └─ Renderiza el documento como "hoja" A4
  └─ Boton "Descargar PDF" + "Cerrar"

InfoAprendizDocument.tsx (componente puro del documento)
  └─ Secciones: Ficha, Emergencia, Salud, Autorizacion, Firma, Autoevaluacion
  └─ Layout grid 2 columnas, estilo ficha (label/valor)
```

### 2. Generacion de PDF

Se usara `window.print()` con estilos `@media print` sobre el contenedor del documento. No requiere dependencias adicionales. El componente del documento se renderiza en un iframe oculto o se usa la API de print directamente sobre el contenido del modal. Esto garantiza que el PDF descargado coincide exactamente con el preview.

Alternativa considerada: `@react-pdf/renderer` no esta instalado y agregaria complejidad significativa. El approach de print CSS es mas simple y cumple los criterios de aceptacion.

### 3. Archivos nuevos

**A. `src/types/formato.ts`**
- Tipo `EstadoFormato = 'borrador' | 'completo'`
- Interface `FormatoDocumento` con: id, nombre, estado, tipo

**B. `src/components/matriculas/formatos/InfoAprendizDocument.tsx`**
- Componente puro que recibe datos de persona, matricula y curso
- Renderiza el documento con layout de ficha (label: valor)
- Secciones:
  1. **Ficha de Matricula**: grid 2 cols con fecha inicio/fin, empresa, celular, tipo/num documento, nombres, apellidos, genero, pais, fecha nacimiento, nivel educativo, area trabajo, cargo, nivel formacion
  2. **Informacion de Emergencia**: contacto nombre, telefono, RH del participante
  3. **Consentimiento de Salud**: preguntas con respuestas Si/No (solo lectura, datos de matricula)
  4. **Autorizacion de Datos**: seccion visible con badge "Pendiente"
  5. **Firma**: recuadro vacio con badge "Pendiente"
  6. **Autoevaluacion**: 6 preguntas con opciones Si/No/N-A, todas en "Si" por defecto, editables en preview
- Marca de agua "BORRADOR" cuando faltan secciones pendientes
- Datos vacios muestran "Pendiente" con estilo tenue
- Sin curso: fechas muestran "Pendiente asignacion a curso"

**C. `src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx`**
- Dialog/modal ancho (max-w-4xl) con scroll
- Contiene el documento dentro de un contenedor "tipo hoja" con sombra y fondo blanco
- Botones: "Descargar PDF" (primario) y "Cerrar" (secundario)
- La descarga usa `window.print()` con estilos print que aislan solo el documento

**D. `src/components/matriculas/formatos/FormatosList.tsx`**
- Lista de formatos como filas/cards
- Cada fila: icono, nombre del formato, badge de estado, botones "Ver preview" y "Descargar PDF"
- Por ahora solo tiene "Informacion del Aprendiz"

### 4. Archivos modificados

**`src/pages/matriculas/MatriculaDetallePage.tsx`**
- Reemplazar la seccion "Progreso" (lineas 507-539) del sidebar por la seccion "Formatos para Formacion"
- Importar FormatosList e InfoAprendizPreviewDialog
- Agregar estado para controlar apertura del preview dialog
- Pasar datos de persona, matricula y curso al dialog

### 5. Contenido detallado del documento

**Seccion 6.1 - Ficha de Matricula (grid 2 columnas):**

| Columna izquierda | Columna derecha |
|---|---|
| Fecha inicio curso | Fecha fin curso |
| Empresa que paga | Celular estudiante |
| Tipo documento | Numero documento |
| Primer nombre | Segundo nombre |
| Primer apellido | Segundo apellido |
| Genero | Pais nacimiento |
| Fecha nacimiento | Nivel educativo |
| Area de trabajo | Cargo |
| Nivel de formacion (span completo) | |

Nota: nombres y apellidos se separan por espacio para primer/segundo.

**Seccion 6.2 - Emergencia (grid 2 columnas):**

| Columna izquierda | Columna derecha |
|---|---|
| Contacto emergencia | Telefono emergencia |
| RH del participante | |

**Seccion 6.3 - Consentimiento Salud (solo lectura):**
- Restriccion medica: Si/No + detalle
- Alergias: Si/No + detalle
- Medicamentos: Si/No + detalle
- Embarazo: Si/No (si aplica)
- Lectoescritura: Si/No

**Seccion 6.4 - Autorizacion datos:** Badge "Pendiente del estudiante"

**Seccion 6.5 - Firma:** Recuadro vacio con borde punteado + Badge "Pendiente del estudiante"

**Seccion 6.6 - Autoevaluacion:**
Tabla con columnas: Pregunta | Si | No | N/A
- Ha realizado curso de alturas nivel Avanzado Trabajador Autorizado o Reentrenamiento con anterioridad?
- Sabe que es un arnes y para que sirve?
- Considera tener conocimientos y habilidades en Trabajo en Alturas?
- La Res. 4272 de 2021, es la que Establece los Requisitos Minimos de seguridad para Trabajar en Alturas?
- Tiene presente la diferencia entre las medidas de prevencion y medidas de proteccion contra caidas?
- Dentro de sus actividades laborales, debe desarrollar actividades superando los 2 m?

Todas marcadas en "Si" por defecto. Editables en preview (radio buttons).

### 6. Estilos del documento

- Contenedor con `max-width: 210mm`, centrado, fondo blanco, sombra
- Titulos de seccion: texto uppercase, bold, con separador inferior
- Campos: `text-xs` para label, `text-sm font-medium` para valor
- Datos vacios: color tenue + texto "Pendiente" o guion
- Marca "BORRADOR": texto semitransparente diagonal o banner superior
- `@media print`: ocultar botones, bordes del modal, mostrar solo el documento

### 7. Flujo de estados

- El documento siempre existe (no necesita generacion previa)
- Estado `BORRADOR`: cuando faltan autorizacion, firma o autoevaluacion del estudiante
- Se puede descargar PDF incluso en estado borrador
- No se implementa estado `PDF_LISTO` por ahora (el PDF se genera al momento de descargar)

