

## Plan: FASE 1 — Estructura Base del Módulo de Certificación

### Alcance

Crear la arquitectura base: tipos, servicios mock, hooks, páginas placeholder, navegación y rutas. No se implementa lógica de generación (eso es Fase 2).

---

### Archivos nuevos

#### 1. `src/types/certificado.ts`
Tipos principales:
- `EstadoCertificado`: `'elegible' | 'generado' | 'bloqueado' | 'revocado'`
- `CertificadoGenerado`: id, matriculaId, cursoId, personaId, plantillaId, tipoCertificadoId, codigo, estado, snapshotDatos, svgFinal, version, fechaGeneracion, etc.
- `PlantillaCertificado`: id, nombre, svgRaw, tokens detectados, activa, versión, historial.
- `TipoCertificado`: id, nombre, tipoFormacion asociado, plantillaId, reglas (requierePago, requiereDocumentos, requiereFormatos, incluyeEmpresa, incluyeFirmas), regla de código.
- `SolicitudExcepcionCertificado`: id, matriculaId, solicitadoPor, motivo, estado (pendiente/aprobada/rechazada), resueltoPor, fechas.

#### 2. `src/services/certificadoService.ts`
CRUD mock sobre array en memoria (`mockCertificados`). Métodos: `getAll`, `getById`, `getByMatricula`, `getByCurso`, `create`, `revocar`.

#### 3. `src/services/plantillaService.ts`
CRUD mock para plantillas SVG. Métodos: `getAll`, `getById`, `getActiva`, `create`, `update`, `detectarTokens`.

#### 4. `src/services/tipoCertificadoService.ts`
CRUD mock para tipos de certificado. Métodos: `getAll`, `getById`, `getByTipoFormacion`, `create`, `update`.

#### 5. `src/services/excepcionCertificadoService.ts`
CRUD mock para excepciones. Métodos: `getAll`, `getById`, `getByMatricula`, `solicitar`, `aprobar`, `rechazar`.

#### 6. `src/hooks/useCertificados.ts`
Hooks React Query: `useCertificados`, `useCertificado`, `useCertificadosByMatricula`, `useCertificadosByCurso`, `useCreateCertificado`, `useRevocarCertificado`.

#### 7. `src/hooks/usePlantillas.ts`
Hooks: `usePlantillas`, `usePlantilla`, `usePlantillaActiva`, `useCreatePlantilla`, `useUpdatePlantilla`.

#### 8. `src/hooks/useTiposCertificado.ts`
Hooks: `useTiposCertificado`, `useTipoCertificado`, `useCreateTipoCertificado`, `useUpdateTipoCertificado`.

#### 9. `src/hooks/useExcepcionesCertificado.ts`
Hooks: `useExcepcionesCertificado`, `useSolicitarExcepcion`, `useAprobarExcepcion`, `useRechazarExcepcion`.

#### 10. Páginas placeholder
- `src/pages/certificacion/HistorialCertificadosPage.tsx` — Tabla vacía con filtros placeholder.
- `src/pages/certificacion/PlantillasPage.tsx` — Lista de plantillas placeholder.
- `src/pages/certificacion/TiposCertificadoPage.tsx` — Lista de tipos placeholder.

#### 11. `src/data/mockCertificados.ts`
Arrays iniciales vacíos para certificados, plantillas, tipos y excepciones.

---

### Archivos modificados

#### 12. `src/components/layout/AppSidebar.tsx`
Agregar sección "Certificación" con subitems colapsables:
- Historial → `/certificacion/historial`
- Plantillas → `/certificacion/plantillas`
- Tipos de Certificado → `/certificacion/tipos`

Usar `Collapsible` o `SidebarGroup` con sub-menú, icono `Award`.

#### 13. `src/App.tsx`
Agregar rutas:
- `/certificacion/historial` → `HistorialCertificadosPage`
- `/certificacion/plantillas` → `PlantillasPage`
- `/certificacion/tipos` → `TiposCertificadoPage`

#### 14. `src/types/index.ts`
Agregar `export * from './certificado'`.

#### 15. `src/types/audit.ts`
Agregar `'certificado' | 'plantilla_certificado' | 'excepcion_certificado'` a `TipoEntidad`.

---

### Resultado
Módulo integrado en la navegación con páginas funcionales (vacías), servicios y hooks listos para consumir en Fase 2.

