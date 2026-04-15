

# Fix: Firma no se reutiliza entre formatos del portal

## Causa raíz

Cuando eliminamos la casilla "Guardar mi firma para uso en documentos futuros", el estado `autorizaReutilizacion` quedó fijo en `false`. Pero la condición en `portalDinamicoService.ts` (línea 55) exige **ambas** condiciones para guardar la firma en `firmas_matricula`:

```typescript
if (firmaPayload.esOrigenFirma && firmaPayload.autorizaReutilizacion) {
```

Como `autorizaReutilizacion` siempre es `false`, la firma **nunca se persiste** en `firmas_matricula`, y por tanto los formatos siguientes no la encuentran para reutilizarla.

## Solución

Dado que la autorización ya queda implícita al firmar y enviar el formato (como indicaste), la lógica debe ser: **si el formato es origen de firma (`esOrigenFirma = true`) y hay firma capturada, siempre guardarla en `firmas_matricula`**.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/services/portalDinamicoService.ts` | Simplificar la condición: solo verificar `esOrigenFirma`, eliminar el check de `autorizaReutilizacion`. Hardcodear `autoriza_reutilizacion: true` en el upsert. |
| `src/pages/estudiante/DynamicPortalRenderer.tsx` | Eliminar el estado `autorizaReutilizacion` y su paso al payload (ya no se necesita). |
| `src/services/portalDinamicoService.ts` (interfaz) | Eliminar `autorizaReutilizacion` de `EnviarFormatoDinamicoParams.firmaPayload`. |

### Detalle técnico

**`portalDinamicoService.ts`** — línea 55 cambia de:
```typescript
if (firmaPayload && firmaPayload.esOrigenFirma && firmaPayload.autorizaReutilizacion) {
```
a:
```typescript
if (firmaPayload && firmaPayload.esOrigenFirma) {
```

Y en el upsert se pasa `autorizaReutilizacion: true` (siempre implícita).

**`DynamicPortalRenderer.tsx`** — eliminar `const [autorizaReutilizacion, setAutorizaReutilizacion] = useState(false)` y la prop `autorizaReutilizacion` del payload de envío.

