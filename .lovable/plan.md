

# Fix: Firma digital en portal — UX y posición

## Problemas identificados

1. **Auto-cierre inmediato**: `DynamicPortalRenderer` usa `onEnd` del canvas para guardar la firma en `answers` automáticamente. Al hacerlo, la condición `!answers[signatureBlock.id]` se vuelve `false` y el canvas desaparece, reemplazado por "Firma capturada". Un roce accidental cierra la interacción.

2. **Firma siempre al final**: La firma se renderiza hardcodeada al final de `DynamicPortalRenderer`, fuera de `PortalFormatoRenderer`. El renderer semántico clasifica correctamente `signature_capture` como sección independiente pero no tiene un caso en `renderPortalBlock` para renderizarla — devuelve `null`.

3. **UX pobre vs referencia**: El componente `FirmaPersonal` (gestión de personal) tiene tabs (Dibujar/Cargar PNG), botón explícito "Guardar Firma", y botón "Limpiar" claro. El portal no tiene nada de esto.

## Cambios

### 1. `PortalFormatoRenderer.tsx` — Renderizar firma inline

Agregar caso `signature_capture` en `renderPortalBlock` que renderice un componente `PortalSignatureCapture` con la misma UX de `FirmaPersonal`:
- Tabs: Dibujar / Cargar PNG
- Botón explícito "Guardar Firma" (no auto-save on stroke)
- Botón "Limpiar" visible
- Si ya hay firma guardada: mostrar preview + botón "Cambiar firma"
- Si hay firma reutilizable desde `firmasMatricula`: mostrar preview con badge "Firma reutilizada"

Esto hace que la firma aparezca en la posición exacta donde el bloque fue ubicado en el formato.

### 2. `DynamicPortalRenderer.tsx` — Eliminar firma hardcodeada

- Eliminar toda la sección de firma manual (SignatureCanvas, handleClearSignature, handleEndStroke, firmaBase64 state, sigCanvasRef, isEmptyRef)
- Eliminar la sección de "Firma capturada" y el checkbox de autorización de reutilización
- La firma ahora se lee desde `answers[signatureBlockId]` que el renderer semántico ya gestiona
- Adaptar `handleSubmit` para extraer `firmaBase64` desde `answers` en lugar del state local

### 3. Nuevo componente `PortalSignatureCapture.tsx`

Componente reutilizable inspirado en `FirmaPersonal`:
- Props: `blockId`, `label`, `value` (base64 o null), `onChange`, `readOnly`, `reusableSignature?` (FirmaMatricula)
- Estado interno: canvas ref, isEmpty, tab activo
- No auto-guarda al terminar trazo — requiere clic en "Guardar Firma"
- Muestra firma existente con opción de cambiar/limpiar

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/portal/PortalSignatureCapture.tsx` | Nuevo componente |
| `src/components/portal/PortalFormatoRenderer.tsx` | Agregar caso signature_capture + pasar firmasMatricula al renderer |
| `src/pages/estudiante/DynamicPortalRenderer.tsx` | Eliminar firma hardcodeada, simplificar submit |

