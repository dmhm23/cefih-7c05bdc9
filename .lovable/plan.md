

# Plan: Aplicar diseño moderno del Calendar al BirthDateField

## Problema

El `BirthDateField` usa `DayPicker` directamente sin los estilos del componente `Calendar.tsx`. El `Calendar` tiene classNames detallados para celdas, encabezados, días seleccionados, etc. que le dan el aspecto moderno. El `BirthDateField` solo pasa `caption: "hidden"` y `nav: "hidden"`, dejando el resto con estilos por defecto de `react-day-picker` que se ven desalineados y sin pulir.

## Solución

Copiar los `classNames` del componente `Calendar.tsx` al `DayPicker` dentro de `BirthDateField`, manteniendo `caption: "hidden"` y `nav: "hidden"` (ya que se usa la barra custom). Además, ajustar el estilo de la barra de navegación custom (mes/año) para que sea más limpia y alineada con la referencia:

- Aplicar los mismos classNames de `Calendar` (months, month, table, head_row, head_cell, row, cell, day, day_selected, day_today, day_outside, day_disabled)
- Limpiar el padding y bordes de la barra de navegación para que se integre mejor

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/BirthDateField.tsx` | Agregar classNames completos del Calendar al DayPicker |

**Total: 1 archivo editado, 0 migraciones**

