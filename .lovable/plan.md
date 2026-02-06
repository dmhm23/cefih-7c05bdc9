

# Plan: Botón Expandir Navega a Página Completa

## Resumen

Modificar el comportamiento del botón de expandir (Maximize2) en los paneles deslizantes para que navegue a la página de detalle completa (`/personas/:id`, `/matriculas/:id`, `/cursos/:id`) en lugar de solo expandir el panel.

---

## Situación Actual

| Componente | Comportamiento Actual |
|------------|----------------------|
| `DetailSheet` | El botón Maximize2 alterna `expanded` (hace el panel más ancho) |
| Páginas de detalle | Ya existen: `PersonaDetallePage`, `MatriculaDetallePage`, `CursoDetallePage` |

---

## Nuevo Comportamiento

El botón de expandir/ampliar ahora:
1. Navega a la ruta de detalle completo del registro
2. Cierra el panel deslizante
3. Muestra la página de detalle en pantalla completa

```text
Panel deslizante abierto:
+---------------------------+---------------+
|                           | [←][→][⬜][X] |  <- Botón ⬜ (Maximize)
|     Tabla de datos        |   Detalles    |
|                           |   del panel   |
+---------------------------+---------------+

Usuario hace clic en ⬜:
+------------------------------------------+
|  ← Volver   | Juan Pérez García | Editar |
+------------------------------------------+
|                                          |
|     PÁGINA COMPLETA DE DETALLE           |
|     /personas/abc123                     |
|                                          |
+------------------------------------------+
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/DetailSheet.tsx` | Cambiar prop `onExpandToggle` a `onFullScreen` |
| `src/components/personas/PersonaDetailSheet.tsx` | Implementar navegación a `/personas/:id` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Implementar navegación a `/matriculas/:id` |
| `src/components/cursos/CursoDetailSheet.tsx` | Implementar navegación a `/cursos/:id` |

---

## Detalle Técnico

### DetailSheet - Nueva Prop

```typescript
interface DetailSheetProps {
  // ... existing props
  onFullScreen?: () => void; // Reemplaza onExpandToggle
}

// En el header, el botón ahora:
{onFullScreen && (
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={onFullScreen}
    title="Abrir en pantalla completa"
  >
    <Maximize2 className="h-4 w-4" />
  </Button>
)}
```

Se elimina la lógica de `expanded` y `Minimize2` ya que ahora siempre navega a página completa.

### PersonaDetailSheet - Navegación

```typescript
import { useNavigate } from "react-router-dom";

export function PersonaDetailSheet({ ... }) {
  const navigate = useNavigate();
  
  const handleFullScreen = () => {
    if (persona) {
      onOpenChange(false); // Cerrar panel
      navigate(`/personas/${persona.id}`); // Navegar a página completa
    }
  };
  
  return (
    <DetailSheet
      // ... existing props
      onFullScreen={handleFullScreen} // Nueva prop
    >
      {/* contenido */}
    </DetailSheet>
  );
}
```

### MatriculaDetailSheet - Navegación

```typescript
const handleFullScreen = () => {
  if (matricula) {
    onOpenChange(false);
    navigate(`/matriculas/${matricula.id}`);
  }
};
```

### CursoDetailSheet - Navegación

```typescript
const handleFullScreen = () => {
  if (curso) {
    onOpenChange(false);
    navigate(`/cursos/${curso.id}`);
  }
};
```

---

## Flujo de Usuario

```text
1. Usuario en /personas
2. Hace clic en una fila → Panel se abre
3. Ve los detalles en el panel lateral
4. Quiere más espacio o edición avanzada
5. Hace clic en botón Maximize (⬜)
6. Navega a /personas/:id (página completa)
7. Puede usar botón "Volver" para regresar al listado
```

---

## Beneficios

- **Consistencia**: El panel es para vista rápida, la página es para edición completa
- **Navegación clara**: El usuario entiende que está en una página diferente
- **URL compartible**: Puede compartir el enlace directo a un registro
- **Historial de navegación**: El botón "atrás" del navegador funciona correctamente

