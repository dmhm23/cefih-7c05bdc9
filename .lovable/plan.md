## Plan: FASE 2 — Motor Básico de Generación de Certificados

### Alcance

Implementar generación simulado de certificados desde la vista de matrícula: validación de elegibilidad, reemplazo de tokens SVG, generación de PDF, y sección visual completa.

---

### Archivos nuevos

#### 1. `src/components/matriculas/CertificacionSection.tsx`

Componente que reemplaza la sección "Certificado" actual (líneas 678-697 de `MatriculaDetallePage`). Muestra:

- **Estado de elegibilidad** con badge (Elegible / Bloqueado / Generado / Revocado)
- **Motivos de bloqueo** listados si no es elegible (pago pendiente, documentos incompletos, formatos incompletos)
- **Botón "Generar Certificado"** (solo si elegible y no existe certificado previo)
- **Botón "Descargar PDF"** (si ya fue generado)
- **Botón "Solicitar excepción"** (si bloqueado, abre dialog simple con textarea para motivo)
- **Fechas** de generación y entrega (editables)
- Consume `useCertificadosByMatricula` para obtener certificados existentes

Props: `matricula`, `persona`, `curso`, `formatosDinamicos`, `onFieldChange`, `getValue`

#### 2. `src/utils/certificadoGenerator.ts`

Lógica pura de generación:

- `evaluarElegibilidad(matricula, formatosDinamicos)` → `{ elegible: boolean, motivos: string[] }` — valida pagado, docs completos, formatos completos
- `construirDiccionarioTokens(persona, curso, matricula)` → `Record<string, string>` — mapea tokens como `nombreCompleto`, `numeroDocumento`, `numeroCurso`, `fechaInicio`, `fechaFin`, `tipoFormacion`, `empresaNombre`, `entrenadorNombre`, etc.
- `reemplazarTokens(svgRaw, diccionario)` → `string` — reemplaza `{{token}}` en el SVG
- `generarCodigoCertificado(curso, matricula)` → `string` — código provisional (ej: `{numeroCurso}-{consecutivo}`)

#### 3. `src/utils/certificadoPdf.ts`

- `descargarCertificadoPdf(svgFinal: string, codigo: string)` — abre ventana con el SVG renderizado y ejecuta `window.print()` con estilos de impresión (patrón existente en el proyecto)

---

### Archivos modificados

#### 4. `src/services/certificadoService.ts`

Agregar método `generar(matriculaId, cursoId, personaId, plantillaId, tipoCertificadoId, svgFinal, snapshotDatos, codigo)` que crea el `CertificadoGenerado` con estado `'generado'` y registra audit log.

#### 5. `src/hooks/useCertificados.ts`

Agregar hook `useGenerarCertificado()` — mutation que llama al servicio completo de generación e invalida queries de certificados y matrícula.

#### 6. `src/pages/matriculas/MatriculaDetallePage.tsx`

- Reemplazar la sección "Certificado" (líneas 678-697) por `<CertificacionSection>`.
- Importar el nuevo componente.
- No se modifica nada más de la página.

---

### Flujo de generación (dentro de `CertificacionSection`)

1. Click en "Generar Certificado"
2. `evaluarElegibilidad()` — doble check
3. `plantillaService.getActiva()` — obtener SVG base
4. `construirDiccionarioTokens()` — armar datos
5. `reemplazarTokens()` — SVG final
6. `certificadoService.generar()` — persistir con snapshot
7. Actualizar matrícula con `fechaGeneracionCertificado`
8. Toast de éxito, actualizar UI

### Resultado

Desde `/matriculas/:id` se puede evaluar elegibilidad y generar certificado real con plantilla SVG. Se puede descargar como PDF. Se pueden solicitar excepciones si está bloqueado.  
  
Nota: En **/certificacion/plantillas** se debe unificar la sección de **tipos de certificado** dentro de **plantillas de certificado**.

Al cargar una nueva plantilla, deben mostrarse todas las opciones de tipos disponibles y todos los parámetros configurables asociados a la plantilla.