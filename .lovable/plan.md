

## Plan: FASE 3 — Integración de Certificación en Tabla de Curso

### Alcance
Agregar columna "Certificado" a la tabla de matriculados del curso, con estado individual, acciones por fila, y botón de generación masiva.

---

### Archivos modificados

#### 1. `src/components/cursos/EnrollmentsTable.tsx`
Cambios principales:
- Importar `useCertificadosByCurso`, `useGenerarCertificado`, `evaluarElegibilidad`, `construirDiccionarioTokens`, `reemplazarTokens`, `generarCodigoCertificado`, `descargarCertificadoPdf`, `plantillaService`
- Recibir `cursoId` adicional o derivarlo de `curso.id` (ya disponible en props)
- Agregar state para checkboxes de selección: `selectedIds`, `setSelectedIds`
- **Nueva columna "Certificado"** entre "Financiero" y "Acciones":
  - Si ya tiene certificado generado → Badge verde "Generado" + botón descargar
  - Si elegible → Badge azul "Elegible" + botón "Generar"
  - Si bloqueado → Badge amarilla "Bloqueado" (tooltip con motivos)
  - Si revocado → Badge roja "Revocado"
- **Checkboxes por fila** (columna izquierda) para selección masiva
- **Botón "Generar certificados"** en el header (junto a "Agregar"), habilitado solo cuando hay seleccionados
  - Al hacer clic: evalúa elegibilidad de cada seleccionado, genera solo los elegibles, muestra dialog de resumen con conteo de generados vs bloqueados (con motivos)
- Usar `useCertificadosByCurso(curso.id)` para consultar certificados existentes y mapearlos por `matriculaId`

#### 2. `src/components/cursos/GeneracionMasivaDialog.tsx` (nuevo)
Dialog que muestra el resultado de la generación masiva:
- Props: `open`, `onOpenChange`, `resultados: { generados: number, bloqueados: { nombre: string, motivos: string[] }[] }`, `isGenerating: boolean`
- Muestra spinner durante generación
- Al terminar: lista de éxitos y lista de bloqueados con motivos
- Botón "Cerrar"

---

### Flujo de generación individual (por fila)
1. Click botón "Generar" en la fila
2. Obtener plantilla activa
3. Construir diccionario de tokens
4. Reemplazar tokens en SVG
5. Llamar `certificadoService.generar()`
6. Toast de éxito, refrescar query

### Flujo de generación masiva
1. Seleccionar matrículas con checkboxes
2. Click "Generar certificados seleccionados"
3. Abrir `GeneracionMasivaDialog` en estado "generando"
4. Iterar seleccionados: evaluar elegibilidad → generar si elegible, acumular bloqueados
5. Mostrar resumen: X generados, Y bloqueados (con motivos por estudiante)
6. Refrescar queries

### Resultado
Desde `/cursos/:id` se puede ver el estado de certificación de cada estudiante, generar individualmente o en masa, y descargar certificados generados.

