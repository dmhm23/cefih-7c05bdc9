

## Plan: Tooltip en etiqueta "Bloqueado" del Monitoreo

### Archivo modificado

**`src/components/portal-admin/MonitoreoTable.tsx`**

1. Importar `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` desde `@/components/ui/tooltip`.
2. Envolver el `Badge` de estado "bloqueado" (líneas ~152-157) con un `Tooltip` que muestre un mensaje explicativo al hacer hover.
3. El tooltip solo aparece cuando `estado === 'bloqueado'`; para los demás estados el Badge se renderiza sin tooltip.
4. Texto del tooltip: *"Este documento aún no está disponible. Puede deberse a que el portal no está habilitado para esta matrícula o a que existe un documento previo que debe completarse primero."*
5. Envolver la tabla (o la sección relevante) con `<TooltipProvider delayDuration={200}>` para un hover responsivo.

