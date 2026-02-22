

## Boton "Restablecer columnas" en el selector de columnas

### Cambio

Agregar un tercer boton "Restablecer" en el footer del `ColumnSelector` que restaure la visibilidad de cada columna a su valor en `DEFAULT_COLUMNS`. Para esto, el componente necesita recibir la configuracion por defecto como prop.

### Archivo: `src/components/shared/ColumnSelector.tsx`

- Agregar prop `defaultColumns: ColumnConfig[]` a la interfaz `ColumnSelectorProps`.
- Agregar un boton "Restablecer" en el footer (entre "Mostrar todas" y "Ocultar todas") que aplique la visibilidad de `defaultColumns` a cada columna.

### Archivos consumidores (pasar la nueva prop)

- `src/pages/personas/PersonasPage.tsx` — pasar `defaultColumns={DEFAULT_COLUMNS}`
- `src/pages/matriculas/MatriculasPage.tsx` — pasar `defaultColumns={DEFAULT_COLUMNS}`
- `src/components/cursos/CursosListView.tsx` — pasar `defaultColumns={DEFAULT_COLUMNS}`

### Comportamiento

- Al hacer clic en "Restablecer", cada columna toma el valor `visible` definido en el array `DEFAULT_COLUMNS` original del modulo correspondiente.
- No elimina columnas ni altera el orden, solo restablece la propiedad `visible`.
- Las columnas con `alwaysVisible: true` no se ven afectadas.

