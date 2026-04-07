

# Plan: Corregir visualización de adjuntos y firma en Gestión de Personal

## Problema raíz

Hay **dos contextos** donde se muestra el detalle de personal:

### 1. DetailSheet (panel lateral desde el listado)
- La página `GestionPersonalPage` pasa `selectedPersonal` al `PersonalDetailSheet`, pero este dato viene de `usePersonalList()` que llama a `getAll()`.
- `getAll()` retorna `adjuntos: []` y `firmaBase64: undefined` porque **no carga adjuntos ni genera signed URLs**.
- Cuando el usuario sube un archivo o firma, la mutación invalida el query `['personal']`, pero `getAll()` vuelve a retornar datos sin adjuntos ni firma.
- **Resultado**: el toast dice "cargado" pero los adjuntos/firma nunca aparecen.

### 2. DetallePage (vista completa `/gestion-personal/:id`)
- Usa `usePersonal(id)` que llama a `getById()` — este **sí** carga adjuntos con signed URLs y firma.
- **Sin embargo**, después de subir un adjunto, `addAdjunto` invalida `['personal', id]`, lo que re-ejecuta `getById()`, y los adjuntos aparecen correctamente.
- Este flujo **funciona bien**.

El problema principal está en el **DetailSheet del panel lateral**.

## Solución

### Cambio en `PersonalDetailSheet.tsx`

En lugar de usar el `personal` que viene de la lista (sin adjuntos), el componente debe hacer su propia consulta con `usePersonal(personal.id)` para obtener los datos completos (adjuntos + firma con signed URLs).

```
// Antes: usa personal de la lista (sin adjuntos)
adjuntos={personal.adjuntos || []}
firmaExistente={personal.firmaBase64}

// Después: usa fullPersonal de usePersonal(id) 
const { data: fullPersonal } = usePersonal(personal?.id || "");
const displayPersonal = fullPersonal || personal;
adjuntos={displayPersonal.adjuntos || []}
firmaExistente={displayPersonal.firmaBase64}
```

Esto asegura que al abrir el panel lateral, se carguen los adjuntos reales con signed URLs, y que al subir/eliminar archivos, la invalidación del query `['personal', id]` refresque los datos completos.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/personal/PersonalDetailSheet.tsx` | Agregar `usePersonal(id)` para cargar datos completos con adjuntos y firma |

**Total: 1 archivo editado, 0 migraciones**

