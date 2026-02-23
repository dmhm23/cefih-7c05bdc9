

## Ajustes al Modulo de Gestion de Personal

### Cambio 1: Agregar firma y adjuntos al formulario de creacion/edicion

**Archivo:** `src/pages/personal/PersonalFormPage.tsx`

El formulario actual solo tiene datos basicos (nombres, apellidos, cargo). Se agregaran dos secciones opcionales debajo:

1. **Seccion "Documentos Adjuntos"**: Usa el componente `AdjuntosPersonal` existente. Como al crear un perfil nuevo aun no existe un `id`, los adjuntos se almacenaran en estado local (array de `File`) y se subiran secuencialmente despues del `createPersonal`. En modo edicion, se usaran los hooks `useAddAdjunto` / `useDeleteAdjunto` directamente.

2. **Seccion "Firma Digital"**: Usa el componente `FirmaPersonal` existente. Similar logica: en creacion, la firma se captura en estado local (base64 string) y se guarda via `updateFirma` tras crear el perfil. En edicion, se usa `useUpdateFirma` / `useDeleteFirma` directamente.

Ambas secciones son completamente opcionales y no bloquean el boton "Crear Perfil".

**Flujo de creacion:**
1. Usuario llena datos basicos y opcionalmente adjunta archivos y/o firma.
2. Al hacer submit: se crea el perfil, luego se suben adjuntos pendientes y firma si existen.
3. Se navega a `/gestion-personal`.

---

### Cambio 2: Mostrar firma y adjuntos en el panel lateral (DetailSheet)

**Archivo:** `src/components/personal/PersonalDetailSheet.tsx`

Se agregaran dos secciones adicionales debajo de "Datos del Perfil":

1. **Seccion "Documentos Adjuntos"**: Renderiza `AdjuntosPersonal` con los adjuntos del perfil. Conectado a `useAddAdjunto` y `useDeleteAdjunto` para gestion en tiempo real.

2. **Seccion "Firma Digital"**: Renderiza `FirmaPersonal` con la firma existente. Conectado a `useUpdateFirma` y `useDeleteFirma`.

Se importaran los hooks necesarios (`useUpdateFirma`, `useDeleteFirma`, `useAddAdjunto`, `useDeleteAdjunto`) y se conectaran con handlers y toasts, siguiendo el mismo patron de `PersonalDetallePage.tsx`.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/personal/PersonalFormPage.tsx` | Agregar secciones opcionales de adjuntos y firma con estado local para modo creacion |
| `src/components/personal/PersonalDetailSheet.tsx` | Agregar secciones de adjuntos y firma conectadas a los hooks existentes |

