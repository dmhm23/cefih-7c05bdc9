

# Plan: Corregir sección Vinculación Laboral en detalle de matrícula

## Problemas identificados

1. **Cambio de tipo de vinculación no limpia campos**: `handleFieldChange` solo actualiza un campo a la vez. Al cambiar `tipoVinculacion` de "empresa" a "independiente", los campos `empresaNombre`, `empresaNit`, `empresaId`, etc. conservan los valores anteriores.

2. **Campo Empresa es texto libre**: Actualmente es un `EditableField` de tipo `text`. Debería ser un dropdown con las empresas del directorio, y al seleccionar una, autocompletar NIT, Representante legal, Sector económico, ARL y contacto.

3. **Regla de negocio Independiente**: Cuando `tipoVinculacion === "independiente"`, Empresa debe mostrar el nombre completo del estudiante y NIT su número de documento, automáticamente.

4. **Layout roto en grid de 3 columnas**: Campos con contenido largo (Nivel de formación, Sector económico) desbordan su celda. El botón "Ver empresa en directorio" ocupa una celda sin alineación.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/matriculas/MatriculaDetallePage.tsx` | **1)** Importar `useEmpresas` y cargar la lista de empresas. **2)** Crear función `handleTipoVinculacionChange(nuevoTipo)` que: si `independiente` → setear `empresaNombre` con nombre+apellidos del estudiante, `empresaNit` con su documento, limpiar `empresaId`, `empresaRepresentanteLegal`, contacto empresa; si `empresa`/`arl` → limpiar campos empresa para forzar nueva selección; invoca `handleFieldChange` para cada campo afectado. **3)** Reemplazar el `EditableField` de "Empresa" (línea 644-648) por un `EditableField type="select"` con las opciones de empresas del directorio (value=id, label=nombreEmpresa). **4)** Crear función `handleEmpresaSelect(empresaId)` que busca la empresa en la lista y autocompleta: `empresaId`, `empresaNombre`, `empresaNit`, `empresaRepresentanteLegal`, `sectorEconomico`, `arl`, `empresaContactoNombre`, `empresaContactoTelefono`. **5)** Cuando `tipoVinculacion === "independiente"`, mostrar los campos Empresa y NIT como `editable={false}` (solo lectura, ya que se autocompletaron). **6)** Mover "Ver empresa en directorio" debajo de la grilla como un enlace de texto alineado, fuera de las celdas del grid. **7)** Agregar `min-w-0` a las celdas del grid y `truncate` a campos con texto largo para evitar desborde visual. |

**Total: 1 archivo editado, 0 migraciones**

## Detalle técnico

### Lógica de `handleTipoVinculacionChange`
```
switch (nuevoTipo):
  "independiente":
    empresaNombre = `${persona.nombres} ${persona.apellidos}`
    empresaNit = persona.numeroDocumento
    empresaId = ""
    empresaRepresentanteLegal = ""
    empresaContactoNombre = ""
    empresaContactoTelefono = ""
  "empresa" | "arl":
    empresaNombre = ""
    empresaNit = ""
    empresaId = ""
    empresaRepresentanteLegal = ""
    empresaContactoNombre = ""
    empresaContactoTelefono = ""
```

### Layout fix
- Grid: `grid grid-cols-2 md:grid-cols-3 gap-3` → agregar clase `[&>*]:min-w-0` para que los hijos respeten el ancho de columna.
- El botón "Ver empresa en directorio" sale del grid y va como elemento independiente debajo, con `mt-2`.

