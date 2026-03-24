

## Plan: Añadir scrollbar horizontal visible en todas las tablas

### Problema
Las tablas tienen `overflow-auto` pero la scrollbar horizontal nativa es muy delgada o invisible en la mayoría de navegadores modernos (especialmente macOS/Chrome). Cuando las columnas exceden el ancho visible, no hay indicación visual de que se puede desplazar horizontalmente.

### Solución

Aplicar estilos CSS personalizados para hacer la scrollbar horizontal visible y estilizada en el contenedor de scroll de las tablas. Esto se hace en un solo punto centralizado.

### Archivo a modificar

**`src/index.css`** — Agregar reglas CSS para scrollbar horizontal en el contenedor de tabla:

```css
/* Scrollbar horizontal visible en tablas */
[data-table-container] .overflow-auto {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: hsl(var(--border)) transparent;
}

[data-table-container] .overflow-auto::-webkit-scrollbar {
  height: 8px;
}

[data-table-container] .overflow-auto::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

[data-table-container] .overflow-auto::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

[data-table-container] .overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
```

El selector `[data-table-container]` ya existe como atributo en el `DataTable` (línea 189), así que aplica automáticamente a Personas, Matrículas, Cursos y Cartera sin tocar ninguna página individual.

### Impacto
- Un solo cambio en `index.css`
- Scrollbar de 8px de alto, color coherente con el tema, aparece solo cuando hay contenido desbordado
- Aplica a todas las tablas de la aplicación

