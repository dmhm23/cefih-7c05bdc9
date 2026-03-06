

## Plan: Fase 4 — Excepciones, Revocación y Reemisión

### Estado actual

- **Excepciones**: El servicio (`excepcionCertificadoService`) y hooks (`useExcepcionesCertificado`) ya existen con solicitar/aprobar/rechazar. La UI solo permite *solicitar* desde `CertificacionSection` cuando el estado es "bloqueado". No hay UI de gestión/aprobación de excepciones.
- **Revocación**: El servicio `certificadoService.revocar` existe. El hook `useRevocarCertificado` existe. No hay UI para invocarla.
- **Reemisión**: No existe. El servicio solo genera v1; no hay lógica de nueva versión preservando el histórico.

---

### 1. Gestión de Excepciones (Aprobar/Rechazar)

**`src/components/matriculas/ExcepcionesPanel.tsx`** (nuevo)
- Panel colapsable dentro de `CertificacionSection` que muestra las excepciones de la matrícula usando `useExcepcionesByMatricula`.
- Lista cada solicitud con: motivo, solicitante, fecha, estado (badge con colores: pendiente=amber, aprobada=emerald, rechazada=red).
- Botones "Aprobar" y "Rechazar" en cada solicitud pendiente (usando `useAprobarExcepcion` y `useRechazarExcepcion`).
- Al aprobar: se genera automáticamente el certificado marcando `autorizadoExcepcional: true`. Esto requiere agregar el parámetro al servicio `generar`.

**`src/components/matriculas/CertificacionSection.tsx`** (modificar)
- Importar y renderizar `ExcepcionesPanel` debajo de las acciones.
- Ajustar lógica de `estadoDisplay`: si hay excepción aprobada y no hay certificado generado, mostrar estado "elegible" en lugar de "bloqueado".
- Pasar `autorizadoExcepcional: true` al generar certificado cuando la elegibilidad viene por excepción.

**`src/services/certificadoService.ts`** (modificar)
- Agregar campo opcional `autorizadoExcepcional` al método `generar`.

### 2. Revocación con UI

**`src/components/matriculas/CertificacionSection.tsx`** (modificar)
- Agregar botón "Revocar" (destructive, con icono `FileWarning`) visible cuando `estadoDisplay === 'generado'`.
- Al hacer clic: abrir `ConfirmDialog` (componente existente) con campo de motivo obligatorio (Textarea).
- Llamar `useRevocarCertificado` con id, `revocadoPor: "admin"`, motivo.
- Tras revocar: invalidar queries, mostrar toast, el estado cambia automáticamente a "revocado".

**`src/components/matriculas/RevocacionDialog.tsx`** (nuevo)
- Dialog con Textarea para motivo (obligatorio) y confirmación destructive.
- Muestra código del certificado a revocar.

### 3. Reemisión (nueva versión)

**`src/services/certificadoService.ts`** (modificar)
- Agregar método `reemitir(id, svgFinal, snapshotDatos, codigo)`:
  - Busca certificado existente, lo marca como `estado: 'revocado'` (preserva historial).
  - Crea nuevo `CertificadoGenerado` con `version: anterior.version + 1`, mismo `codigo` base pero con sufijo de versión, estado `'generado'`.
  - No elimina el registro anterior.

**`src/hooks/useCertificados.ts`** (modificar)
- Agregar `useReemitirCertificado` mutation hook.

**`src/components/matriculas/CertificacionSection.tsx`** (modificar)
- Cuando `estadoDisplay === 'revocado'`: mostrar botón "Reemitir Certificado".
- Genera nueva versión usando la plantilla activa y datos actuales.
- Muestra versión actual y enlace al historial de versiones.

**`src/components/matriculas/HistorialVersiones.tsx`** (nuevo)
- Componente colapsable que lista todos los certificados de la matrícula (generados + revocados).
- Muestra: código, versión, estado, fecha, motivo de revocación si aplica.
- Permite descargar PDF de cualquier versión.

### 4. Historial de Certificados mejorado

**`src/pages/certificacion/HistorialCertificadosPage.tsx`** (modificar)
- Agregar columnas: matrícula, persona, excepcional (si/no), motivo revocación.
- Agregar badge de estado con colores consistentes.
- Agregar acción de fila para ver detalle/descargar.

### Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `src/components/matriculas/ExcepcionesPanel.tsx` | Crear |
| `src/components/matriculas/RevocacionDialog.tsx` | Crear |
| `src/components/matriculas/HistorialVersiones.tsx` | Crear |
| `src/components/matriculas/CertificacionSection.tsx` | Modificar (excepciones, revocación, reemisión) |
| `src/services/certificadoService.ts` | Modificar (reemitir, autorizadoExcepcional) |
| `src/hooks/useCertificados.ts` | Modificar (useReemitirCertificado) |
| `src/pages/certificacion/HistorialCertificadosPage.tsx` | Modificar (columnas, badges) |
| `src/types/certificado.ts` | Sin cambios (tipos ya cubren todo) |

