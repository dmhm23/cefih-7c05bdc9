

## Plan: Fase 5 — Seguimiento, control y gaps pendientes

### Lo que falta

**Fase 5 completa** y un gap de Fase 1:

1. **Estado "vencido"**: Agregar al enum `EstadoGrupoCartera` y a la lógica de recálculo (si `fechaVencimiento` de alguna factura pasó y saldo > 0).
2. **Historial de acciones automático**: Log que registre eventos del sistema (factura creada, pago registrado, cambio de estado) con timestamp y descripción.
3. **Alertas por vencimiento**: Badge o indicador visual en la bandeja y detalle cuando hay facturas vencidas.
4. **Tipos de actividad en seguimiento**: Extender comentarios para diferenciar entre "llamada", "promesa de pago", "comentario" con etiquetas visuales.
5. **Agrupación automática** (gap Fase 1): Conectar la creación de matrículas con la asignación/creación automática de grupo de cartera.

---

### Cambios concretos

#### 1. `src/types/cartera.ts`
- Agregar `'vencido'` a `EstadoGrupoCartera` y su label.
- Nuevo tipo `TipoActividadCartera = 'llamada' | 'promesa_pago' | 'comentario' | 'sistema'`.
- Nueva interface `ActividadCartera { id, grupoCarteraId, tipo, descripcion, fecha, usuario? }`.

#### 2. `src/data/mockCartera.ts`
- Agregar array `mockActividades` con datos de ejemplo (eventos de sistema y manuales).

#### 3. `src/services/carteraService.ts`
- `getActividadesByGrupo(grupoId)`: retorna historial de actividades.
- `registrarActividad(data)`: crea entrada manual (llamada, promesa).
- Modificar `registrarPago` y `createFactura` para auto-registrar actividad de tipo `'sistema'`.
- Modificar `recalcGrupo` para detectar facturas vencidas y asignar estado `'vencido'`.

#### 4. `src/hooks/useCartera.ts`
- `useActividadesCartera(grupoId)` — query para historial.
- `useRegistrarActividad()` — mutation.

#### 5. `src/components/cartera/ActividadCarteraSection.tsx` — Nuevo
- Componente que muestra el historial de actividades con iconos por tipo (Phone para llamada, Handshake para promesa, MessageSquare para comentario, Bot para sistema).
- Formulario inline para agregar actividad manual con selector de tipo.
- Reemplaza `ComentariosSection` en la vista detalle de cartera.

#### 6. `src/pages/cartera/GrupoCarteraDetallePage.tsx`
- Reemplazar `ComentariosSection` por `ActividadCarteraSection`.
- Agregar indicador de alerta si hay facturas vencidas (banner o badge en el header).

#### 7. `src/pages/cartera/CarteraPage.tsx`
- Agregar estado `'vencido'` a las opciones de filtro.
- Mostrar icono de alerta en filas con facturas vencidas.

#### 8. `src/components/shared/StatusBadge.tsx`
- Agregar variante para `'vencido'` (rojo/destructivo).

