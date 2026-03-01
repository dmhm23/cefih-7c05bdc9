

## Plan: Mejoras UX en /portal-estudiante (admin)

### Problemas detectados

1. **MonitoreoDetalleDialog no refleja cambios en tiempo real**: El dialog usa los datos del `row` que se pasó al abrirlo (snapshot). Cuando el admin hace toggle del portal o reabre un documento, el dialog no actualiza su contenido — los badges y el switch quedan desactualizados hasta cerrar y reabrir.

2. **Monitoreo sin contadores de resumen**: La tabla muestra filas individuales pero no hay indicadores globales (ej. "12 pendientes, 3 completados, 1 bloqueado") que den contexto rápido al admin.

3. **Tabla de monitoreo sin paginación**: Si hay muchas matrículas, la tabla carga todo sin paginación ni indicador de cantidad de resultados.

4. **DocumentoConfigDialog no resetea formulario al abrir**: Los campos internos (`key`, `nombre`, `tipo`, etc.) se inicializan con `useState(documento?.xxx)` pero no se actualizan cuando cambia `documento` (props). Si abres un documento para editar y luego abres otro, los campos pueden quedar con datos del anterior.

5. **Toggle global "Portal activo por defecto" sin confirmación**: Un clic accidental puede desactivar el portal globalmente sin aviso previo.

6. **Columna "Portal" en tabla de monitoreo es confusa**: Dice "Sí/No" pero no comunica bien qué significa ni permite acción directa.

7. **Sin indicador de progreso por fila**: En la tabla de monitoreo, no se puede ver de un vistazo el progreso general de cada estudiante (ej. "1/2 completados").

---

### Cambios propuestos

#### 1. Refrescar `MonitoreoDetalleDialog` tras mutaciones
- Cambiar la arquitectura: en lugar de pasar `row` como dato estático, pasar `matriculaId` y que el dialog consulte los datos frescos del query `portal-monitoreo` (o re-derive del cache invalidado).
- Alternativa más simple: pasar `onDataChange` al dialog, que tras cada mutación exitosa haga `refetch` y actualice el `selectedRow` en `MonitoreoTable` con los datos frescos.

#### 2. Agregar chips de resumen sobre la tabla de monitoreo
- Encima de la barra de búsqueda, mostrar 3 chips: total matrículas, cantidad con todo completado, cantidad con documentos pendientes.

#### 3. Corregir `DocumentoConfigDialog` — sincronizar estado con props
- Agregar un `useEffect` que actualice los estados locales cuando `documento` o `open` cambien.

#### 4. Agregar confirmación al toggle global
- Envolver el `Switch` de "Portal activo por defecto" con un `ConfirmDialog` cuando se desactiva (solo al desactivar, activar no requiere confirmación).

#### 5. Agregar columna de progreso en tabla de monitoreo
- Reemplazar o complementar los chips individuales de documentos con una mini barra de progreso o texto "1/2" por fila que resuma el avance.

#### 6. Indicador de cantidad de resultados
- Bajo la barra de búsqueda/filtros, mostrar "Mostrando X matrículas" para dar contexto.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `MonitoreoTable.tsx` | Chips resumen, columna progreso, contador de resultados, pasar `onDataChange` al dialog |
| `MonitoreoDetalleDialog.tsx` | Recibir `onDataChange`, llamarlo tras mutaciones exitosas para refrescar datos |
| `DocumentoConfigDialog.tsx` | `useEffect` para sincronizar estado local con props `documento` |
| `PortalAdminPage.tsx` | Confirmación al desactivar toggle global |

