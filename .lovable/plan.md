

# Plan: Mejorar feedback y velocidad al guardar perfil

## Diagnóstico

La lentitud viene del flujo secuencial en `onSubmit` (líneas 193-204):

1. `await createPersonal.mutateAsync(...)` — request 1
2. `await updateFirma.mutateAsync(...)` — request 2 (espera a que termine el 1)
3. `for (const file of tempFiles) { await addAdjunto.mutateAsync(...) }` — request 3, 4, 5... (cada archivo espera al anterior)

Si hay 1 firma + 2 adjuntos, son 4 requests secuenciales. Con ~500-800ms por request, suman ~3 segundos.

Además, `isLoading` solo refleja `createPersonal.isPending || updatePersonal.isPending`, no cubre la subida de firma ni adjuntos post-creación.

## Solución

### Archivo: `src/pages/personal/PersonalFormPage.tsx`

1. **Paralelizar uploads**: Después de crear el perfil, subir firma y todos los adjuntos en paralelo con `Promise.all` en vez de secuencialmente
2. **Estado de carga completo**: Usar un `useState<boolean>` (`isSaving`) que cubra todo el proceso (crear + subir firma + subir adjuntos), para que el botón muestre spinner durante toda la operación

```typescript
// Antes (secuencial ~3s):
const newPersonal = await createPersonal.mutateAsync(personalData);
if (tempFirma) await updateFirma.mutateAsync({...});
for (const file of tempFiles) await addAdjunto.mutateAsync({...});

// Después (paralelo ~1.5s):
const newPersonal = await createPersonal.mutateAsync(personalData);
const uploads: Promise<any>[] = [];
if (tempFirma) uploads.push(updateFirma.mutateAsync({...}));
for (const file of tempFiles) uploads.push(addAdjunto.mutateAsync({...}));
await Promise.all(uploads);
```

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/personal/PersonalFormPage.tsx` | Paralelizar uploads + agregar estado `isSaving` para feedback completo |

**Total: 1 archivo editado, 0 migraciones**

