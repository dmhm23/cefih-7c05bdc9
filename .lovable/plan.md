

## Plan: Rediseño del módulo de certificados — Eliminar TipoCertificado, integrar config en Plantilla

### Resumen

Fusionar `TipoCertificado` dentro de `PlantillaCertificado`. La plantilla pasa a contener: tipo de formación, reglas de validación, patrón de código y **niveles de formación asignados**. Se elimina toda la infraestructura de "tipos de certificado".

### Cambios

#### 1. `src/types/certificado.ts` — Fusionar modelo

- Agregar a `PlantillaCertificado`: `tipoFormacion`, `reglaCodigo`, `reglas: ReglaTipoCertificado`, `nivelesAsignados: string[]`
- Eliminar `tipoCertificadoId` de `CertificadoGenerado`
- Eliminar interfaces `TipoCertificado`, `TipoCertificadoFormData`
- Actualizar `PlantillaFormData` para incluir los nuevos campos

#### 2. `src/data/mockCertificados.ts` — Actualizar mock

- Agregar campos nuevos a `mockPlantillas[0]` (tipoFormacion, reglas, reglaCodigo, nivelesAsignados)
- Eliminar `mockTiposCertificado`

#### 3. `src/services/plantillaService.ts` — Preservar nuevos campos en create/update

- Asegurar que `create` y `update` manejen `tipoFormacion`, `reglas`, `reglaCodigo`, `nivelesAsignados`

#### 4. Eliminar archivos de TipoCertificado

- Eliminar `src/services/tipoCertificadoService.ts`
- Eliminar `src/hooks/useTiposCertificado.ts`

#### 5. `src/pages/certificacion/PlantillasPage.tsx` — Simplificar UI

- Eliminar pestaña "Tipos de Certificado" y todo su CRUD
- Eliminar imports de tipos/hooks de TipoCertificado
- El diálogo de "Nueva Plantilla" ahora incluye: nombre, archivo SVG, tipo de formación, regla de código, reglas de validación (switches), niveles asignados (multi-select con niveles de formación)
- La tabla de plantillas muestra: nombre, tipo formación, estado, tokens, versión, niveles asignados

#### 6. `src/pages/certificacion/PlantillaEditorPage.tsx` — Agregar panel de configuración

- En el panel derecho (debajo del mapeo de etiquetas), agregar sección "Configuración" editable:
  - Tipo de formación (Select)
  - Regla de código (Input)
  - Niveles asignados (multi-select con checkboxes)
  - Switches de reglas de validación
- Estos campos se guardan junto con el SVG al presionar "Guardar"

#### 7. Referencias a `tipoCertificadoId` — Limpiar

- `src/components/matriculas/CertificacionSection.tsx`: eliminar campo `tipoCertificadoId` del objeto de generación
- `src/components/cursos/EnrollmentsTable.tsx`: eliminar campo `tipoCertificadoId`
- `src/services/certificadoService.ts`: eliminar `tipoCertificadoId` de params y lógica
- `src/hooks/useCertificados.ts`: eliminar de tipos de mutation

#### 8. `src/App.tsx` — Sin cambios de rutas

Las rutas ya están limpias (sin ruta de tipos). Sin cambios necesarios.

