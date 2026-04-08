

# Plan: Corregir botón "Guardar Perfil" en Gestión de Personal

## Diagnóstico

Identifiqué dos problemas que pueden impedir la creación del perfil:

### 1. Botón "Eliminar" firma sin `type="button"` (FirmaPersonal.tsx, línea 51)
Cuando el usuario carga una firma durante la creación de un perfil, aparece el botón "Eliminar" en `FirmaPersonal`. Este botón **no tiene** `type="button"`, por lo que dentro del `<form>` actúa como `type="submit"`. Si el usuario interactúa con la firma antes de hacer clic en "Guardar", podría estar disparando un envío del formulario que falla o interfiere con el estado de la mutación (`isPending` se queda en `true`), lo que **deshabilita** el botón "Guardar Perfil" permanentemente.

### 2. Validación silenciosa de campos obligatorios
El esquema de validación requiere `apellidos` con mínimo 2 caracteres. Si el usuario solo llena "nombre" y "rol" sin completar "apellidos", react-hook-form bloquea el envío sin mostrar un mensaje visible (el `FormMessage` aparece debajo del campo pero puede no ser notorio). Esto haría que el botón "Guardar" parezca no funcionar.

## Solución

### Archivo: `src/components/personal/FirmaPersonal.tsx`
- Agregar `type="button"` al botón "Eliminar" (línea 51) para evitar que dispare el envío del formulario

### Archivo: `src/pages/personal/PersonalFormPage.tsx`
- Agregar manejo del caso de error de validación en el formulario usando `form.handleSubmit(onSubmit, onError)` donde `onError` muestre un toast indicando que hay campos sin completar, para que el usuario sepa por qué no se creó el perfil

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/personal/FirmaPersonal.tsx` | Agregar `type="button"` al botón "Eliminar" |
| `src/pages/personal/PersonalFormPage.tsx` | Agregar callback `onError` para mostrar toast de validación |

**Total: 2 archivos editados, 0 migraciones**

