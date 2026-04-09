

# Plan: Mejorar date picker de fecha de nacimiento

## Problema

El `DateField` actual usa dropdowns nativos del navegador para mes/año (sin localización), permite cualquier rango de años (1950-2040), no restringe fechas futuras ni aplica la lógica de edad mínima 18 / máxima 90 años.

## Solución

Crear un componente especializado `BirthDateField` que extienda la experiencia del `DateField` con las restricciones específicas para fecha de nacimiento, sin modificar el `DateField` compartido que usan otros módulos.

### Características del nuevo componente

1. **Rango**: solo fechas entre `hoy - 90 años` y `hoy - 18 años`
2. **Localización**: pasar `locale={es}` al `DayPicker` para meses y días en español
3. **Selector de año custom**: reemplazar el dropdown nativo por un popover con input de búsqueda que filtra solo años válidos del rango permitido; al seleccionar un año, el calendario navega a ese año
4. **Selector de mes custom**: dropdown estilizado con los 12 meses en español
5. **Sin botón "Hoy"**: no aplica para fecha de nacimiento (hoy está fuera del rango)
6. **`disabled` en DayPicker**: bloquear fechas fuera del rango

### Implementación

El componente usará `DayPicker` directamente (sin pasar por `Calendar.tsx`) para tener control total sobre `caption` y dropdowns, renderizando componentes custom para la navegación mes/año con Lucide icons (`ChevronLeft`, `ChevronRight`) y un popover con `Input` para buscar años.

### Uso en PersonaFormPage

```tsx
<BirthDateField value={field.value} onChange={field.onChange} />
```

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/BirthDateField.tsx` | Nuevo componente especializado |
| `src/pages/personas/PersonaFormPage.tsx` | Reemplazar `DateField` por `BirthDateField` en fecha de nacimiento |

**Total: 1 archivo nuevo, 1 archivo editado, 0 migraciones**

