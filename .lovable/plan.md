

## Plan: Habilitar edición de contactos en la vista detalle de empresa

### Problema

En `EmpresaDetallePage.tsx` (vista completa `/empresas/:id`), la sección "Personas de Contacto" (líneas 272-299) es de solo lectura: muestra los contactos pero no permite editarlos, eliminarlos ni agregar nuevos. En contraste, el `EmpresaDetailSheet` (panel lateral) sí permite todo esto.

### Solución

Replicar en `EmpresaDetallePage.tsx` la misma lógica de gestión de contactos que ya existe en `EmpresaDetailSheet.tsx`:

1. Agregar estado local `contactos` con `useState<ContactoEmpresa[]>`
2. Inicializar contactos desde `empresa.contactos` en el `useEffect` existente
3. Agregar handlers: `handleContactoChange`, `handleAddContacto`, `handleRemoveContacto`, `handleSetPrincipal`
4. Actualizar `handleSave` para incluir `contactos` y sincronizar los campos legacy (`personaContacto`, etc.)
5. Actualizar `handleCancel` para resetear contactos
6. Reemplazar la sección read-only por inputs editables con botones de agregar/eliminar/marcar principal

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/pages/empresas/EmpresaDetallePage.tsx` | Agregar estado, handlers y UI editable para contactos (mismo patrón que `EmpresaDetailSheet`) |

### UI de la sección actualizada

- Cada contacto en una card con inputs para nombre, teléfono y email
- Badge "Principal" o botón para marcar como principal
- Botón eliminar (si hay más de 1 contacto)
- Botón "+ Agregar contacto" al final

