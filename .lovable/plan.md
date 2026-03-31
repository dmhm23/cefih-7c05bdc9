

## Plan: Renombrar estado "elegible" → "Listo para certificar"

### Cambio

El valor interno `'elegible'` se mantiene como key técnico. Solo se cambian las **etiquetas visibles** (labels y textos) a "Listo para certificar".

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/cursos/EnrollmentsTable.tsx` | Badge label: `"Elegible"` → `"Listo para certificar"` |
| `src/components/matriculas/CertificacionSection.tsx` | `ESTADO_CONFIG.elegible.label` → `"Listo para certificar"` |
| `src/pages/certificacion/HistorialCertificadosPage.tsx` | Filter option label y badge: `"Elegible"` → `"Listo para certificar"` |

No se modifica el tipo `EstadoCertificado` ni la lógica interna — solo las 3 etiquetas de UI.

