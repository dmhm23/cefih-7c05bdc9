

## Plan: Corregir nombres de cursos y "Error al guardar" en edición

### Diagnóstico

Identifiqué **un único bug raíz** que causa ambos síntomas (confirmado con logs de Postgres: `invalid input value for enum tipo_formacion: "b62b5715-..."`):

En `CourseInfoCard.tsx`, el dropdown "Tipo de Formación" guarda en dos campos al cambiar:
```ts
onFieldChange("nivelFormacionId", v);   // OK — UUID
onFieldChange("tipoFormacion", v);      // BUG — pone UUID donde debería ir el enum
```

Esto produce dos efectos en cadena:

1. **Nombres "Reentrenamiento" / "Trabajador Autorizado" en lugar del nombre real del nivel:** Al renderizar la lista, el helper `getCursoLabel` resuelve el nivel con `resolveNivel(c.nivelFormacionId || c.tipoFormacion)`. Cuando `nivelFormacionId` no se grabó correctamente o el dropdown se desincroniza, cae al `tipoFormacion` legacy y muestra el alias genérico ("Reentrenamiento", "Trabajador Autorizado").

2. **"Error al guardar":** Al hacer update, el service envía el UUID al campo `tipo_formacion` de la BD (que es un enum estricto: `formacion_inicial | reentrenamiento | jefe_area | coordinador_alturas`). Postgres rechaza con "invalid input value for enum" → el toast genérico muestra "Error al guardar" sin detalle.

Adicionalmente, el toast de error no muestra el mensaje real del backend, lo que ocultó el problema. También el formulario de **creación** (`CursoFormPage.tsx`) ya hace lo correcto: deriva `tipoFormacion` desde `nivel.tipoFormacion`. Solo falla la **edición**.

### Cambios técnicos

**1. `src/components/cursos/CourseInfoCard.tsx`** — Al cambiar el dropdown de nivel, derivar `tipoFormacion` desde el objeto `nivel` (no asignar el UUID):
```ts
onChange={(v) => {
  const nivel = niveles.find(n => n.id === v);
  onFieldChange("nivelFormacionId", v);
  if (nivel?.tipoFormacion) {
    onFieldChange("tipoFormacion", nivel.tipoFormacion); // valor enum válido
  }
}}
```

**2. `src/services/cursoService.ts` (función `update`)** — Defensa adicional: si `tipoFormacion` no es un valor válido del enum, omitirlo del update en lugar de enviarlo y romper. Lista válida: `formacion_inicial | reentrenamiento | jefe_area | coordinador_alturas` (junto con sus alias frontend `trabajador_autorizado | jefe_area | reentrenamiento | coordinador_ta` que sí están en `TIPO_FE_TO_DB`).

**3. `src/pages/cursos/CursoDetallePage.tsx`** — Mejorar el manejo de error del toast para mostrar el mensaje real:
```ts
} catch (error: any) {
  toast({ 
    title: "Error al guardar",
    description: error?.message || "Revise los campos e intente nuevamente",
    variant: "destructive"
  });
}
```

**4. Limpieza opcional (sin migración):** No hace falta migración SQL — los cursos existentes en BD tienen `tipo_formacion = 'formacion_inicial'` correcto. El bug solo afectaba el **intento de update**, que era rechazado por Postgres y no llegaba a persistirse.

### Validación post-cambio

- **Editar un curso existente:** cambiar el nivel de formación, modificar duración/horas, guardar. Debe persistir sin "Error al guardar".
- **Lista de cursos:** la columna "Curso" debe mostrar `{numeroCurso}—{nombreCompletoDelNivel}` (ej. `FIH-A-26-04-03—Trabajador autorizado`) en lugar de solo "Reentrenamiento" o "Trabajador Autorizado".
- **Header del detalle de curso:** mismo formato correcto.
- **Crear curso nuevo:** debe seguir funcionando igual (no se toca el flujo de creación, que ya estaba bien).

### Sin impacto en otras áreas

- No modifica el esquema de BD ni triggers.
- No afecta cursos ya creados ni matrículas vinculadas.
- No cambia la generación automática del número de curso.

