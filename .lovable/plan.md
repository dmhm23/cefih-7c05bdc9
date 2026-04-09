

# Plan: Reordenar campos de contacto — Teléfono antes de Email

## Problema

En todas las vistas de personas, el campo Email aparece primero y Teléfono segundo. El usuario quiere el orden inverso: Teléfono primero, Email después.

## Vistas afectadas

1. **`PersonaFormPage.tsx`** (líneas 376-399): En la card "Datos de Contacto", el `FormField` de `email` está antes del de `telefono`.
2. **`PersonaDetallePage.tsx`** (líneas 219-228): En la sección de contacto, `EditableField` de Email va antes del de Teléfono.
3. **`PersonaDetailSheet.tsx`** (líneas 250-261): Mismo orden invertido en el panel lateral.

## Solución

En cada archivo, intercambiar el orden de los bloques de Email y Teléfono (mover el bloque de Teléfono arriba del de Email). Sin cambios de lógica ni de datos.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/personas/PersonaFormPage.tsx` | Intercambiar orden: Teléfono antes de Email |
| `src/pages/personas/PersonaDetallePage.tsx` | Intercambiar orden: Teléfono antes de Email |
| `src/components/personas/PersonaDetailSheet.tsx` | Intercambiar orden: Teléfono antes de Email |

**Total: 3 archivos editados, 0 migraciones**

