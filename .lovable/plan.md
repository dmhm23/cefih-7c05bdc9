
## Sincronizacion de Niveles y Ajustes de UI

### Resumen

4 cambios independientes:

1. Reordenar campos Horas/Dias en el formulario de Nuevo Nivel
2. Navegacion "Atras" con historial en NivelFormPage
3. Sincronizar dropdown de Curso con el modulo de Niveles
4. Sincronizar dropdown de Matricula con el modulo de Niveles

---

### 1. Reordenar Horas antes de Dias en NivelFormPage

**Archivo:** `src/pages/niveles/NivelFormPage.tsx` (lineas 204-231)

Intercambiar el orden de los dos `FormField` dentro del grid: primero `duracionHoras`, luego `duracionDias`.

---

### 2. Boton "Atras" con navegacion al origen en NivelFormPage

**Archivo:** `src/pages/niveles/NivelFormPage.tsx`

- Cambiar `navigate("/niveles")` en el boton "Atras" (linea 172) por `navigate(-1)` para volver a la vista anterior real (puede ser `/niveles/:id` u otra).
- Hacer lo mismo con el boton "Cancelar" (linea 363).

---

### 3. Sincronizar "Tipo / Nivel de Formacion" en CursoFormPage con el modulo de Niveles

**Archivo:** `src/pages/cursos/CursoFormPage.tsx`

Actualmente el dropdown usa `TIPOS_FORMACION_CURSO` (constante hardcodeada con 4 valores). Se reemplazara por datos dinamicos del modulo de Niveles:

- Importar `useNivelesFormacion` desde `@/hooks/useNivelesFormacion`.
- Llamar al hook para obtener la lista de niveles.
- Cambiar el schema zod: `tipoFormacion` pasa de `z.enum([...])` a `z.string().min(1, "Seleccione el tipo de formacion")`.
- Reemplazar el `<Select>` por un `<Combobox>` (ya existe el componente) que muestre `nivel.nombreNivel` como label y `nivel.id` como value.
- Al seleccionar un nivel, autocompletar `duracionDias` y `horasTotales` desde los datos del nivel seleccionado.
- En `onSubmit`, usar `nivel.nombreNivel` para construir el nombre del curso en lugar de `TIPO_FORMACION_LABELS`.
- Eliminar las importaciones de `TIPOS_FORMACION_CURSO` y `TIPO_FORMACION_LABELS` que ya no se usan.

---

### 4. Sincronizar "Nivel de Formacion" en MatriculaFormPage con el modulo de Niveles

**Archivos afectados:**

**`src/pages/matriculas/MatriculaFormPage.tsx`** (lineas 742-765):
- Importar `useNivelesFormacion`.
- Reemplazar el `<Select>` que usa `NIVELES_FORMACION_EMPRESA` por un `<Combobox>` alimentado dinamicamente con los niveles del modulo.
- Las opciones mostraran `nivel.nombreNivel` como label y `nivel.id` como value.
- Eliminar la importacion de `NIVELES_FORMACION_EMPRESA`.

**`src/pages/matriculas/MatriculaDetallePage.tsx`** y **`src/components/matriculas/MatriculaDetailSheet.tsx`**:
- Reemplazar `NIVELES_FORMACION_EMPRESA` por una funcion que consulte `mockNivelesFormacion` para resolver el label del nivel guardado.
- Importar `useNivelesFormacion` o acceder directamente a los datos mock para obtener el nombre legible.

**`src/components/matriculas/formatos/InfoAprendizDocument.tsx`** y **`EvaluacionReentrenamientoDocument.tsx`**:
- Reemplazar el uso de `NIVELES_FORMACION_EMPRESA` para resolver labels por una busqueda en `mockNivelesFormacion`.

**Nota:** Los valores ya guardados en matriculas existentes (como `"jefe_area"`) seguiran funcionando porque se hara un fallback: buscar primero por `id`, luego por `nombreNivel`, y si no coincide, mostrar el valor tal cual.

---

### Archivos a modificar (resumen)

| Archivo | Cambio |
|---|---|
| `src/pages/niveles/NivelFormPage.tsx` | Reordenar Horas/Dias, navigate(-1) |
| `src/pages/cursos/CursoFormPage.tsx` | Reemplazar TIPOS_FORMACION_CURSO por useNivelesFormacion + Combobox |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Reemplazar NIVELES_FORMACION_EMPRESA por useNivelesFormacion + Combobox |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Resolver label desde niveles dinamicos |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Resolver label desde niveles dinamicos |
| `src/components/matriculas/formatos/InfoAprendizDocument.tsx` | Resolver label desde niveles dinamicos |
| `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx` | Resolver label desde niveles dinamicos |
