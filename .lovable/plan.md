

# Plan: Corregir persistencia de nivel de formación y horas en cursos

## Diagnóstico

Analicé los datos en base de datos y el código completo del flujo. Los dos problemas tienen causas raíz distintas pero conectadas:

### Problema 1: "Siempre muestra el primer nivel"

**No es un problema de guardado, sino de visualización.** Los datos en la base de datos confirman que el `nivel_formacion_id` sí se guarda correctamente con el UUID del nivel seleccionado. Sin embargo, todos los niveles existentes comparten el mismo `tipo_formacion: formacion_inicial` en la base de datos.

El panel lateral (`CursoDetailSheet`) y la lista muestran el label llamando a `resolveNivelCursoLabel(curso.tipoFormacion)`, donde `curso.tipoFormacion` es siempre `trabajador_autorizado` (el mapeo frontend de `formacion_inicial`). Esto hace que el label siempre resuelva a **"Trabajador Autorizado"**, sin importar qué nivel se seleccionó.

**Causa raíz**: Las vistas usan `tipoFormacion` (el enum genérico) en lugar de `nivelFormacionId` (el UUID específico del nivel) para mostrar el nombre.

### Problema 2: "Horas se guardan en 0"

La tabla `cursos` no tiene columna para horas totales. En el formulario, las horas se leen del nivel seleccionado y se muestran correctamente. Pero al guardar, `cursoService.create` nunca envía ese valor, y `mapCursoRow` hardcodea `horasTotales: 0` y `duracionDias: 0`.

**Causa raíz**: No existe persistencia ni lectura de las horas del curso.

---

## Solución

### 1. Migración SQL: Agregar columnas `duracion_horas` y `duracion_dias` a `cursos`

```sql
ALTER TABLE public.cursos
  ADD COLUMN duracion_horas integer NOT NULL DEFAULT 0,
  ADD COLUMN duracion_dias integer NOT NULL DEFAULT 0;
```

Esto permite persistir ambos valores sin depender de recalcularlos desde el nivel o las fechas cada vez que se lee un curso.

### 2. `src/services/cursoService.ts` — Persistir horas y días, y leerlos

**En `create`**: incluir `duracion_horas` y `duracion_dias` en el objeto `dbData`.

**En `mapCursoRow`**: leer `row.duracion_horas` y `row.duracion_dias` en lugar de hardcodear 0. También mapear `nivelFormacionId` correctamente (ya se hace).

### 3. `src/pages/cursos/CursoFormPage.tsx` — Enviar horas y días al guardar

En `onSubmit`, asegurar que `horasTotales` y `duracionDias` se incluyan en el payload que va a `createCurso.mutateAsync`.

### 4. Vistas de detalle — Usar `nivelFormacionId` para el label

En `CursoDetailSheet.tsx` y `CourseInfoCard.tsx`, cambiar:
```typescript
// Antes:
resolveNivelCursoLabel(curso.tipoFormacion)
// Después:
resolveNivelCursoLabel(curso.nivelFormacionId || curso.tipoFormacion)
```

La función `resolve` ya busca por UUID primero, así que al pasarle el `nivelFormacionId` resolverá al nombre correcto del nivel ("Coordinador de trabajo en alturas", "Reentrenamiento Trabajador Autorizado", etc.).

### 5. Lista de cursos — Mismo ajuste de label

Verificar y ajustar `CursosListView.tsx` y `CursosCalendarioView.tsx` para que usen `nivelFormacionId` al mostrar el tipo/nivel.

---

## Resumen de cambios

| Recurso | Cambio |
|---------|--------|
| Migración SQL | Agregar columnas `duracion_horas` y `duracion_dias` a `cursos` |
| `src/services/cursoService.ts` | Persistir y leer horas/días; ya no hardcodear 0 |
| `src/pages/cursos/CursoFormPage.tsx` | Enviar `horasTotales` y `duracionDias` en el submit |
| `src/components/cursos/CursoDetailSheet.tsx` | Usar `nivelFormacionId` para resolver el label |
| `src/components/cursos/CourseInfoCard.tsx` | Usar `nivelFormacionId` para resolver el label |
| `src/components/cursos/CursosListView.tsx` | Usar `nivelFormacionId` para resolver el label |

**Total: 1 migración, 4-5 archivos editados**

