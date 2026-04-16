

# Fix: Sincronizar código y versión desde el bloque encabezado

## Diagnóstico

El bloque `document_header` ya tiene campos editables de **Código** y **Versión** en el inspector (líneas 972-992 de `InspectorFields.tsx`). El usuario los edita allí. Sin embargo, al guardar el formato, `handleSave` en `FormatoEditorPage.tsx` lee `config.codigo` y `config.version` — que nunca se actualizan desde el bloque. Resultado: la tabla en Gestión de Formatos siempre muestra ` v001` o vacío.

## Solución

Modificar `handleSave` en `FormatoEditorPage.tsx` para que **extraiga** `codigo` y `version` del bloque `document_header` (si existe) antes de construir el objeto `data`. Si el formato no tiene encabezado, `codigo` y `version` quedan vacíos — tal como lo indicaste.

### Cambio concreto en `FormatoEditorPage.tsx`

Antes de construir `data`, agregar:

```typescript
// Extraer código y versión del bloque encabezado (si existe)
const headerBlock = items.find(it => it.type === 'document_header') as any;
const codigo = headerBlock?.props?.codigo || '';
const version = headerBlock?.props?.version || '';
```

Y reemplazar en el objeto `data`:
- `codigo: config.codigo` → `codigo`
- `version: config.version` → `version`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/formatos/FormatoEditorPage.tsx` | Extraer `codigo`/`version` del bloque `document_header` antes de guardar |

Un solo archivo, un cambio quirúrgico. Sin campos nuevos, sin UI adicional.

