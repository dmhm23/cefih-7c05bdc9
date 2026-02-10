

## Auto-completar datos de empresa para independientes

### Problema actual
La sección "Datos de la Empresa" solo se muestra cuando el tipo de vinculacion es "empresa". Cuando se selecciona "independiente", esos campos no aparecen.

### Cambios a realizar

**Archivo: `src/pages/matriculas/MatriculaFormPage.tsx`**

1. **Mostrar "Datos de la Empresa" para ambos tipos de vinculacion** -- cambiar la condicion `tipoVinculacion === "empresa"` a `tipoVinculacion === "empresa" || tipoVinculacion === "independiente"` para que la seccion sea visible en ambos casos.

2. **Auto-completar campos cuando se selecciona "independiente"** -- agregar un `useEffect` que observe `tipoVinculacion` y `selectedPersona`. Cuando `tipoVinculacion` cambie a `"independiente"` y haya una persona seleccionada:
   - `empresaNombre` = `selectedPersona.nombres + " " + selectedPersona.apellidos`
   - `empresaNit` = `selectedPersona.numeroDocumento`
   - `empresaRepresentanteLegal` = `selectedPersona.nombres + " " + selectedPersona.apellidos`

3. **Limpiar campos si cambia a "empresa"** -- en el mismo `useEffect`, si se cambia a "empresa", limpiar esos tres campos para que el usuario los llene manualmente.

4. **Tambien auto-completar si se selecciona persona despues** -- ajustar el `useEffect` para que si ya esta seleccionado "independiente" y luego se elige una persona, tambien se auto-completen los campos.

### Detalles tecnicos

```text
useEffect:
  Si tipoVinculacion === "independiente" && selectedPersona:
    -> setValue("empresaNombre", nombres + apellidos)
    -> setValue("empresaNit", numeroDocumento)  
    -> setValue("empresaRepresentanteLegal", nombres + apellidos)
  Si tipoVinculacion === "empresa":
    -> setValue("empresaNombre", "")
    -> setValue("empresaNit", "")
    -> setValue("empresaRepresentanteLegal", "")
```

Los campos auto-completados seguiran siendo editables por si el usuario necesita corregir algun dato.

