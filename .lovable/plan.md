## Plan: Parte 3 — Documento "Información del Aprendiz"

### Resumen

Crear la pagina `/estudiante/documentos/info_aprendiz` con acordeones de solo lectura mostrando datos de la matricula/persona, seccion interactiva de autorizacion, captura de firma digital y envio unico. Tambien un nuevo servicio para cargar los datos completos necesarios.  
  
Nota: revisar los formatos ya creados en formatos para formación.

---

### Archivos nuevos (1)


| Archivo                                     | Descripcion                   |
| ------------------------------------------- | ----------------------------- |
| `src/pages/estudiante/InfoAprendizPage.tsx` | Pagina completa del documento |


### Archivos modificados (3)


| Archivo                                   | Cambio                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/App.tsx`                             | Reemplazar placeholder de ruta `documentoKey` por router condicional               |
| `src/services/portalEstudianteService.ts` | Agregar `getInfoAprendizData(matriculaId)` que retorna persona + matricula + curso |
| `src/hooks/usePortalEstudiante.ts`        | Agregar hook `useInfoAprendizData(matriculaId)`                                    |


---

### Detalle de implementacion

#### 1. Servicio: `getInfoAprendizData`

Nuevo metodo en `portalEstudianteService` que recibe `matriculaId` y retorna `{ persona, matricula, curso }` resolviendo las relaciones desde mockData.

#### 2. Hook: `useInfoAprendizData`

React Query wrapper sobre el nuevo servicio.

#### 3. Pagina `InfoAprendizPage`

**Layout mobile-first** (max-w-md, sin sidebar):

- **Header**: Boton "Volver" + titulo "Informacion del Aprendiz"
- **Estado completado**: Si el documento ya esta completado, mostrar vista de solo lectura con firma capturada, fecha de envio y boton "Volver al inicio". No permitir reenvio.

**Acordeones (Accordion de Radix)** — todos en solo lectura:

1. **Datos Personales**: nombre, documento, genero, fecha nacimiento, RH, nivel educativo, email, telefono, contacto emergencia. Datos de `persona`.
2. **Vinculacion Laboral**: tipo vinculacion (empresa/independiente), empresa nombre, NIT, representante legal, cargo, sector economico, area trabajo, EPS, ARL. Datos de `matricula`.
3. **Consentimiento de Salud**: restriccion medica, alergias, medicamentos, lectoescritura. Datos de `matricula`. Reutilizar la estructura visual del componente `ConsentimientoSalud` con prop `readOnly=true`.

**Seccion interactiva — Autorizacion**:

- Texto legal: "Autorizo el tratamiento de mis datos personales..." (texto expandible en Sheet lateral para lectura completa).
- Radio group: "Acepto" / "No acepto".
- Si selecciona "No acepto" → mensaje de advertencia, boton enviar deshabilitado.

**Firma digital**:

- Reutilizar componente `FirmaCaptura` existente.
- Canvas de firma con botones limpiar/guardar.

**Boton "Enviar"**:

- Deshabilitado si: no acepta autorizacion O no hay firma.
- Al enviar: llama `enviarDocumento(matriculaId, 'info_aprendiz', { firmaBase64, firmaFecha, metadata: { autorizacionAceptada: true } })`.
- Post envio: toast de exito + navegar a `/estudiante/inicio`.

#### 4. Router en App.tsx

Reemplazar el placeholder actual (linea 106) por un componente que resuelve `documentoKey` del param y renderiza `InfoAprendizPage` si es `info_aprendiz`, o un placeholder para otros keys.

#### 5. Campos mostrados en cada acordeon

**Datos Personales** (grid 2 cols):

- Nombres / Apellidos
- Tipo documento / Numero documento
- Genero / Fecha nacimiento
- RH / Nivel educativo
- Email / Telefono
- Contacto emergencia (nombre, telefono, parentesco)

**Vinculacion Laboral** (grid 2 cols):

- Tipo vinculacion
- Empresa / NIT (si aplica)
- Representante legal / Cargo
- Area trabajo / Sector economico
- EPS / ARL

**Consentimiento Salud**:

- Renderizar `ConsentimientoSalud` con `readOnly={true}` pasando los datos de la matricula.

---

### Resolucion de labels

Para campos como `genero`, `nivelEducativo`, `sectorEconomico`, etc., resolver el label legible desde los catalogos en `formOptions.ts` (ej. `M` → `Masculino`, `construccion` → `Construccion`).