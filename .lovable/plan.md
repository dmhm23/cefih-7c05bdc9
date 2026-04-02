

## Plan: Añadir tooltips a todos los botones de iconos de la aplicación

### Problema

La mayoría de botones icon-only usan `title=` nativo del navegador (feo, lento) o no tienen ninguna etiqueta visible. Esto dificulta la comprensión de la interfaz para usuarios que no conocen la iconografía.

### Estrategia

Crear un componente wrapper `IconButton` que encapsule `Button` + `Tooltip` de Radix en un solo componente reutilizable. Luego reemplazar progresivamente todos los botones icon-only de la app por este componente.

Esto es más limpio y mantenible que envolver manualmente cada botón con `<Tooltip><TooltipTrigger>...<TooltipContent>`.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/shared/IconButton.tsx` | **Nuevo** — componente wrapper que combina Button + Tooltip |
| `src/components/shared/RowActions.tsx` | Usar `IconButton` en los botones desktop inline |
| `src/components/shared/DetailSheet.tsx` | Tooltips en navegación prev/next, fullscreen, cerrar |
| `src/components/shared/CopyableCell.tsx` | Tooltip "Copiar al portapapeles" |
| `src/components/layout/MainLayout.tsx` | Tooltip "Notificaciones" en campana |
| `src/pages/certificacion/PlantillasPage.tsx` | Tooltip "Editar" en botón Pencil |
| `src/pages/empresas/EmpresaDetallePage.tsx` | Tooltips en botones de contactos y tarifas (Editar, Eliminar, Volver) |
| `src/pages/cursos/CursoDetallePage.tsx` | Tooltip "Volver" |
| `src/components/cursos/EnrollmentsTable.tsx` | Tooltips en Generar certificado, Descargar, Ver matrícula, Eliminar |
| `src/components/cursos/CourseHeader.tsx` | Tooltip "Volver" |
| `src/components/portal-admin/DocumentosCatalogoTable.tsx` | Tooltips Editar y Eliminar |
| Todas las páginas con botón ArrowLeft (back) | Tooltip "Volver" — ~15 archivos de páginas |
| `src/components/shared/SearchInput.tsx` | Tooltip "Limpiar búsqueda" |

### Componente IconButton

```typescript
// src/components/shared/IconButton.tsx
interface IconButtonProps extends ButtonProps {
  tooltip: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}
```

Renderiza:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" {...rest}>
      {children}
    </Button>
  </TooltipTrigger>
  <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
</Tooltip>
```

Nota: Se asegurará de que exista un `<TooltipProvider>` en el layout principal (`MainLayout` o `App`) para no tener que envolverlo en cada uso.

### Alcance por prioridad

**Fase 1 — Componentes compartidos** (máximo impacto, mínimo esfuerzo):
- `IconButton.tsx` nuevo
- `RowActions.tsx` — todos los botones de tabla heredan tooltip automáticamente
- `DetailSheet.tsx` — navegación y cierre
- `MainLayout.tsx` — campana de notificaciones
- `TooltipProvider` global en App o MainLayout

**Fase 2 — Páginas con botones de acción**:
- Todos los botones ArrowLeft ("Volver") en ~15 páginas
- Botones de Editar/Eliminar en tablas de empresas, plantillas, documentos, cursos
- Botones de certificados en EnrollmentsTable

### Labels previstos

| Icono | Tooltip |
|---|---|
| ArrowLeft | "Volver" |
| Bell | "Notificaciones" |
| Eye | "Vista previa" / "Ver" |
| Pencil/Edit | "Editar" |
| Trash2 | "Eliminar" |
| Download | "Descargar" |
| Copy | "Copiar" |
| Maximize2 | "Pantalla completa" |
| ChevronLeft/Right | "Anterior" / "Siguiente" |
| X | "Cerrar" |
| Award | "Generar certificado" |
| RotateCcw | "Limpiar" |
| Search X | "Limpiar búsqueda" |

